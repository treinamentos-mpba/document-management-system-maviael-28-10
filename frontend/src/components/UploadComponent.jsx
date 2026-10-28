import { useRef, useState } from 'react';
import { MAX_UPLOAD_BYTES } from '../services/documentsApi.js';

function formatSize(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(0)} MiB`;
}

export default function UploadComponent({ onUpload }) {
  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setMessage('');
    setError('');

    if (selectedFile && selectedFile.size > MAX_UPLOAD_BYTES) {
      setError(`O arquivo excede o limite de ${formatSize(MAX_UPLOAD_BYTES)}.`);
      setFile(null);
      event.target.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) {
      return;
    }

    setIsUploading(true);
    setError('');
    setMessage('');
    try {
      await onUpload(file);
      setFile(null);
      if (fileInput.current) {
        fileInput.current.value = '';
      }
      setMessage('Arquivo enviado.');
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-title">
      <div className="upload-copy">
        <span className="upload-glyph" aria-hidden="true">+</span>
        <div>
          <h2 id="upload-title">Adicionar documento</h2>
          <p>Até {formatSize(MAX_UPLOAD_BYTES)} por arquivo</p>
        </div>
      </div>
      <form className="upload-form" onSubmit={handleSubmit}>
        <input
          ref={fileInput}
          className="file-input"
          id="document-file"
          type="file"
          onChange={handleFileChange}
          aria-describedby="upload-feedback"
        />
        <label className="file-picker" htmlFor="document-file">
          {file ? file.name : 'Selecionar arquivo'}
        </label>
        <button className="primary-button" type="submit" disabled={!file || isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar arquivo'}
        </button>
      </form>
      <p
        id="upload-feedback"
        className={`upload-feedback${error ? ' is-error' : ''}`}
        role={error ? 'alert' : 'status'}
      >
        {error || message}
      </p>
    </section>
  );
}