'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Upload } from 'lucide-react';
import { api } from '@/lib/api';

type DocumentRow = {
  id: string;
  title: string;
  status: string;
  sourceType: string;
  updatedAt: string;
  chunks: unknown[];
};

export function DocumentsClient() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [title, setTitle] = useState('Graph RAG Notes');
  const [content, setContent] = useState(
    'Graph RAG augments vector retrieval by connecting chunks to entities and relationships. Neo4j can store document, chunk and entity nodes so retrieval can expand through graph neighborhoods before the LLM generates an answer.',
  );
  const [status, setStatus] = useState('Ready');

  const refresh = async () => {
    setDocuments(await api.listDocuments());
  };

  useEffect(() => {
    void refresh();
  }, []);

  const create = async () => {
    setStatus('Creating document');
    await api.createDocument({ title, content, sourceType: 'text' });
    setStatus('Document created');
    await refresh();
  };

  const ingest = async (id: string) => {
    setStatus('Ingesting document');
    await api.ingestDocument(id);
    setStatus('Ingestion completed');
    await refresh();
  };

  return (
    <div className="two-column">
      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">New Document</h2>
          <span className="status">{status}</span>
        </div>
        <div className="panel-body form-grid">
          <div className="field">
            <label>Title</label>
            <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="field">
            <label>Content</label>
            <textarea className="textarea" value={content} onChange={(event) => setContent(event.target.value)} />
          </div>
          <button className="button primary" onClick={create}>
            <Upload size={15} />
            Create
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Documents</h2>
          <button className="button ghost" onClick={refresh}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
        <div className="panel-body">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Chunks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td>
                    <strong>{document.title}</strong>
                    <br />
                    <small>{document.sourceType}</small>
                  </td>
                  <td>
                    <span className={`status ${document.status.toLowerCase()}`}>{document.status}</span>
                  </td>
                  <td>{document.chunks.length}</td>
                  <td>
                    <button className="button" onClick={() => ingest(document.id)}>
                      Ingest
                    </button>
                  </td>
                </tr>
              ))}
              {!documents.length ? (
                <tr>
                  <td colSpan={4}>No documents yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
