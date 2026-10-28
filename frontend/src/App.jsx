import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/documentsApi.js';
import './styles.css';

export default function App() {
  const [activeUser, setActiveUser] = useState(
    () => window.localStorage.getItem('dms-user-id') || 'usuario-demo'
  );
  const [userInput, setUserInput] = useState(activeUser);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError('');

    listDocuments(activeUser, controller.signal)
      .then(setDocuments)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setLoadError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [activeUser, refreshVersion]);

  function handleUserSubmit(event) {
    event.preventDefault();
    const nextUser = userInput.trim();
    if (!nextUser || nextUser.length > 128) {
      return;
    }

    window.localStorage.setItem('dms-user-id', nextUser);
    if (nextUser === activeUser) {
      setRefreshVersion((version) => version + 1);
    } else {
      setActiveUser(nextUser);
    }
  }

  async function handleUpload(file) {
    await uploadDocument(file, activeUser);
    setRefreshVersion((version) => version + 1);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-name">DMS</span>
        </a>
        <span className="storage-indicator"><span /> Armazenamento local</span>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">BIBLIOTECA</p>
            <h1>Documentos</h1>
          </div>
          <span className="document-count" aria-live="polite">
            {documents.length} {documents.length === 1 ? 'arquivo' : 'arquivos'}
          </span>
        </div>

        <form className="user-bar" onSubmit={handleUserSubmit}>
          <label htmlFor="user-id">Identificador do usuário</label>
          <input
            id="user-id"
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
            maxLength={128}
            autoComplete="off"
            required
          />
          <button type="submit" disabled={!userInput.trim() || userInput.trim().length > 128}>
            Abrir biblioteca
          </button>
        </form>

        <UploadComponent onUpload={handleUpload} />

        <section className="documents-section" aria-labelledby="documents-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SEU ESPAÇO</p>
              <h2 id="documents-title">Arquivos enviados</h2>
            </div>
            <span className="owner-label">Usuário: <strong>{activeUser}</strong></span>
          </div>

          <DocumentList
            documents={documents}
            error={loadError}
            isLoading={isLoading}
            owner={activeUser}
            onRetry={() => setRefreshVersion((version) => version + 1)}
          />
        </section>
      </main>
      <footer className="app-footer">DMS <span>·</span> Documentos mantidos neste servidor</footer>
    </div>
  );
}
