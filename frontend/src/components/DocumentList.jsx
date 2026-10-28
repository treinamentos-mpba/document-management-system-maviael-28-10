import DownloadButton from './DownloadButton.jsx';

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({ documents, error, isLoading, owner, onRetry }) {
  if (isLoading) {
    return <p className="list-message" role="status">Carregando documentos...</p>;
  }

  if (error) {
    return (
      <div className="list-message list-error" role="alert">
        <span>{error}</span>
        <button className="text-button" type="button" onClick={onRetry}>Tentar novamente</button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-mark" aria-hidden="true">0</span>
        <p>Nenhum documento enviado para este usuário.</p>
      </div>
    );
  }

  return (
    <div className="document-list">
      <div className="list-header" aria-hidden="true">
        <span>Nome</span>
        <span>Tamanho</span>
        <span>Enviado em</span>
        <span />
      </div>
      {documents.map((document) => (
        <article className="document-row" key={document.id}>
          <div className="document-name">
            <span className="file-mark" aria-hidden="true">DOC</span>
            <span title={document.originalName}>{document.originalName}</span>
          </div>
          <span className="document-size">{formatBytes(document.size)}</span>
          <time className="document-date" dateTime={document.uploadedAt}>
            {formatDate(document.uploadedAt)}
          </time>
          <DownloadButton document={document} owner={owner} />
        </article>
      ))}
    </div>
  );
}