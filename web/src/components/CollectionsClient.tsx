'use client';

import { useEffect, useState } from 'react';
import { DatabaseZap, RefreshCw, Upload } from 'lucide-react';
import { api, type SourceType } from '@/lib/api';

type CollectionRow = {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  _count: { documents: number; jobs: number };
};

export function CollectionsClient() {
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [name, setName] = useState('Enterprise Knowledge');
  const [description, setDescription] = useState('Policies, product notes and operational documents for workflow retrieval.');
  const [sourceType, setSourceType] = useState<SourceType>('text');
  const [title, setTitle] = useState('Vendor Access Policy');
  const [sourceUri, setSourceUri] = useState('');
  const [content, setContent] = useState('Vendor access requires MFA, quarterly access review, least privilege roles, and security training before production access.');
  const [status, setStatus] = useState('Ready');

  const refresh = async () => {
    const rows = await api.listCollections();
    setCollections(rows);
    setSelectedId((current) => current || rows[0]?.id || '');
  };

  useEffect(() => {
    void refresh();
  }, []);

  const createCollection = async () => {
    setStatus('Creating collection');
    const collection = await api.createCollection({ name, description });
    setSelectedId(collection.id);
    setStatus('Collection created');
    await refresh();
  };

  const submitDocument = async () => {
    if (!selectedId) return;
    setStatus('Submitting source');
    const result = (await api.addCollectionDocument(selectedId, { title, content, sourceType, sourceUri })) as { document: { id: string } };
    setStatus('Embedding and graph indexing');
    await api.ingestCollectionDocument(selectedId, result.document.id);
    setStatus('Ingestion completed');
    await refresh();
  };

  return (
    <div className="two-column">
      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Collections</h2>
          <button className="button ghost" onClick={refresh}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
        <div className="panel-body form-grid">
          <div className="field">
            <label>Name</label>
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea className="textarea compact" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <button className="button primary" onClick={createCollection}>
            <DatabaseZap size={15} />
            Create Collection
          </button>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Docs</th>
                <th>Jobs</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((collection) => (
                <tr key={collection.id} onClick={() => setSelectedId(collection.id)} className={collection.id === selectedId ? 'is-active-row' : ''}>
                  <td>
                    <strong>{collection.name}</strong>
                    <br />
                    <small>{collection.description || 'No description'}</small>
                  </td>
                  <td>{collection._count.documents}</td>
                  <td>{collection._count.jobs}</td>
                </tr>
              ))}
              {!collections.length ? (
                <tr>
                  <td colSpan={3}>No collections yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Submit Source</h2>
          <span className="status">{status}</span>
        </div>
        <div className="panel-body form-grid">
          <div className="field">
            <label>Target Collection</label>
            <select className="select" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Source Type</label>
            <select className="select" value={sourceType} onChange={(event) => setSourceType(event.target.value as SourceType)}>
              {['text', 'file', 'video', 'youtube', 'audio', 'link'].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Title</label>
            <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="field">
            <label>Source URI</label>
            <input className="input" value={sourceUri} onChange={(event) => setSourceUri(event.target.value)} placeholder="https://, youtube id, or file ref" />
          </div>
          <div className="field">
            <label>Extracted Text</label>
            <textarea className="textarea" value={content} onChange={(event) => setContent(event.target.value)} />
          </div>
          <button className="button primary" disabled={!selectedId} onClick={submitDocument}>
            <Upload size={15} />
            Submit and Ingest
          </button>
        </div>
      </section>
    </div>
  );
}
