const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');

const previousMaxFileSize = process.env.UPLOAD_MAX_FILE_SIZE_BYTES;
process.env.UPLOAD_MAX_FILE_SIZE_BYTES = '128';
const app = require('../src/app');

let server;
let baseUrl;
let storageDirectory;

before(async () => {
  storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  process.env.STORAGE_DIR = storageDirectory;
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await once(server, 'close');
  await fs.rm(storageDirectory, { recursive: true, force: true });
  delete process.env.STORAGE_DIR;
  if (previousMaxFileSize === undefined) {
    delete process.env.UPLOAD_MAX_FILE_SIZE_BYTES;
  } else {
    process.env.UPLOAD_MAX_FILE_SIZE_BYTES = previousMaxFileSize;
  }
});

test('o app backend é exportado e mantém o health check', async () => {
  assert.equal(typeof app, 'function');
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('envia, lista e baixa documentos sem expor documentos de outro usuário', async () => {
  const form = new FormData();
  form.append('file', new Blob(['conteudo local'], { type: 'text/plain' }), 'notas.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'alice' },
    body: form,
  });
  assert.equal(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.equal(document.originalName, 'notas.txt');
  assert.equal(document.owner, 'alice');
  assert.equal(document.size, Buffer.byteLength('conteudo local'));
  assert.equal(Object.hasOwn(document, 'storageName'), false);

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'alice' },
  });
  assert.deepEqual(await listResponse.json(), [document]);

  const otherUserResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'bob' },
  });
  assert.deepEqual(await otherUserResponse.json(), []);

  const forbiddenDownload = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'bob' },
  });
  assert.equal(forbiddenDownload.status, 404);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'alice' },
  });
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);
  assert.equal(await downloadResponse.text(), 'conteudo local');
  assert.equal((await fs.readdir(storageDirectory)).length, 1);
});

test('preserva nomes de arquivo UTF-8 com caracteres acentuados', async () => {
  const originalName = 'Autorização_220178.pdf';
  const form = new FormData();
  form.append('file', new Blob(['pdf de teste'], { type: 'application/pdf' }), originalName);

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'alice' },
    body: form,
  });

  assert.equal(response.status, 201);
  const document = await response.json();
  assert.equal(document.originalName, originalName);
  assert.equal(document.mimeType, 'application/pdf');

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'alice' },
  });
  assert.equal(downloadResponse.status, 200);
  assert.equal(downloadResponse.headers.get('content-type'), 'application/pdf');
  assert.equal(
    downloadResponse.headers.get('content-disposition'),
    'attachment; filename="Autoriza__o_220178.pdf"; filename*=UTF-8\'\'Autoriza%C3%A7%C3%A3o_220178.pdf'
  );
  assert.equal(await downloadResponse.text(), 'pdf de teste');
});

test('rejeita usuário ausente e arquivo ausente', async () => {
  const noUserForm = new FormData();
  noUserForm.append('file', new Blob(['x']), 'x.txt');
  const noUserResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: noUserForm,
  });
  assert.equal(noUserResponse.status, 400);

  const noFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'alice' },
    body: new FormData(),
  });
  assert.equal(noFileResponse.status, 400);
});

test('rejeita arquivos acima do limite configurado', async () => {
  const form = new FormData();
  form.append('file', new Blob(['x'.repeat(129)]), 'grande.txt');
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'alice' },
    body: form,
  });

  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'FILE_TOO_LARGE');
});

test('retorna 404 para documento inexistente', async () => {
  const response = await fetch(`${baseUrl}/documents/inexistente/download`, {
    headers: { 'X-User-Id': 'alice' },
  });

  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'DOCUMENT_NOT_FOUND');
});
