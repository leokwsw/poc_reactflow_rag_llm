'use client';

import { useEffect, useState } from 'react';
import { Braces, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

type CustomTool = {
  id: string;
  name: string;
  description?: string;
  baseUrl?: string;
  operations: unknown[];
};

const sampleSpec = JSON.stringify(
  {
    openapi: '3.0.0',
    info: { title: 'Ops API', version: '1.0.0' },
    paths: {
      '/tickets': {
        get: {
          operationId: 'listTickets',
          summary: 'List support tickets',
          parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }],
        },
      },
    },
  },
  null,
  2,
);

export function CustomToolsClient() {
  const [tools, setTools] = useState<CustomTool[]>([]);
  const [name, setName] = useState('Ops API');
  const [description, setDescription] = useState('OpenAPI-backed custom tool operations.');
  const [baseUrl, setBaseUrl] = useState('https://api.example.com');
  const [specText, setSpecText] = useState(sampleSpec);
  const [error, setError] = useState('');

  const refresh = async () => setTools(await api.listCustomTools());

  useEffect(() => {
    void refresh();
  }, []);

  const create = async () => {
    setError('');
    try {
      await api.createCustomTool({ name, description, baseUrl, openapiSpec: JSON.parse(specText) as Record<string, unknown> });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="two-column">
      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Import OpenAPI Tool</h2>
          <button className="button primary" onClick={create}>
            <Braces size={15} />
            Import
          </button>
        </div>
        <div className="panel-body form-grid">
          <div className="field">
            <label>Name</label>
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="field">
            <label>Description</label>
            <input className="input" value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="field">
            <label>Base URL</label>
            <input className="input" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
          </div>
          <div className="field">
            <label>OpenAPI JSON</label>
            <textarea className="textarea code-textarea" value={specText} onChange={(event) => setSpecText(event.target.value)} />
          </div>
          {error ? <p className="error-text">{error}</p> : null}
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Custom Tool List</h2>
          <button className="button ghost" onClick={refresh}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
        <div className="panel-body">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Base URL</th>
                <th>Operations</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((tool) => (
                <tr key={tool.id}>
                  <td>
                    <strong>{tool.name}</strong>
                    <br />
                    <small>{tool.description || 'No description'}</small>
                  </td>
                  <td>{tool.baseUrl || 'from spec'}</td>
                  <td>{tool.operations.length}</td>
                </tr>
              ))}
              {!tools.length ? (
                <tr>
                  <td colSpan={3}>No custom tools yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
