export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

async function readError(response) {
  const fallbackMessage = `Falha na operação (HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}).`;
  const responseBody = await response.text();

  try {
    const result = JSON.parse(responseBody);
    return result.error?.message || fallbackMessage;
  } catch {
    const detail = responseBody.trim().replace(/\s+/g, ' ').slice(0, 200);
    return detail ? `${fallbackMessage} ${detail}` : fallbackMessage;
  }
}

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response;
}

export async function listDocuments(owner, signal) {
  const response = await request('/api/documents', {
    headers: { 'X-User-Id': owner },
    signal,
  });
  return response.json();
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/api/upload', {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: formData,
  });
  return response.json();
}

export async function downloadDocument(document, owner) {
  const response = await request(`/api/documents/${encodeURIComponent(document.id)}/download`, {
    headers: { 'X-User-Id': owner },
  });
  const fileUrl = URL.createObjectURL(await response.blob());
  const link = window.document.createElement('a');
  link.href = fileUrl;
  link.download = document.originalName;
  window.document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
}