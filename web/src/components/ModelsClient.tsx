'use client';

import { useEffect, useState } from 'react';
import { Pencil, PlugZap, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

type Provider = {
  id: string;
  name: string;
  provider?: string;
  baseUrl: string;
  apiKeyRef?: string;
  kind: string;
  model: string;
  enabled: boolean;
};

export function ModelsClient() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [testResult, setTestResult] = useState<unknown>();
  const [name, setName] = useState('OpenRouter Chat');
  const [provider, setProvider] = useState('openrouter');
  const [baseUrl, setBaseUrl] = useState('https://openrouter.ai/api/v1');
  const [apiKeyRef, setApiKeyRef] = useState('OPENROUTER_API_KEY');
  const [kind, setKind] = useState<'llm' | 'embedding' | 'rerank'>('llm');
  const [model, setModel] = useState('openai/gpt-4o-mini');
  const [enabled, setEnabled] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState('Ready');

  const refresh = async () => {
    setProviders(await api.listProviders());
  };

  useEffect(() => {
    void refresh();
  }, []);

  const test = async () => {
    setTestResult(await api.testProvider());
  };

  const create = async () => {
    setStatus('Creating provider');
    await api.createProvider({ name, provider, baseUrl, apiKeyRef, kind, model });
    setStatus('Provider created');
    await refresh();
  };

  const loadForEdit = (row: Provider) => {
    setEditingId(row.id);
    setName(row.name);
    setProvider(row.provider ?? 'openai-compatible');
    setBaseUrl(row.baseUrl);
    setApiKeyRef(row.apiKeyRef ?? '');
    setKind(row.kind as 'llm' | 'embedding' | 'rerank');
    setModel(row.model);
    setEnabled(row.enabled);
    setStatus(`Editing ${row.name}`);
  };

  const save = async () => {
    if (!editingId) {
      await create();
      return;
    }
    setStatus('Saving provider');
    await api.updateProvider(editingId, { name, provider, baseUrl, apiKeyRef, kind, model, enabled });
    setStatus('Provider updated');
    setEditingId(null);
    await refresh();
  };

  const remove = async (id: string) => {
    setStatus('Deleting provider');
    await api.deleteProvider(id);
    if (editingId === id) {
      setEditingId(null);
    }
    setStatus('Provider deleted');
    await refresh();
  };

  const resetForm = () => {
    setEditingId(null);
    setName('OpenRouter Chat');
    setProvider('openrouter');
    setBaseUrl('https://openrouter.ai/api/v1');
    setApiKeyRef('OPENROUTER_API_KEY');
    setKind('llm');
    setModel('openai/gpt-4o-mini');
    setEnabled(true);
    setStatus('Ready');
  };

  return (
    <div className="two-column">
      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Configured Providers</h2>
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
                <th>Kind</th>
                <th>Model</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => (
                <tr key={provider.id}>
                  <td>
                    <strong>{provider.name}</strong>
                    <br />
                    <small>{provider.baseUrl}</small>
                  </td>
                  <td>{provider.kind}</td>
                  <td>{provider.model || 'not configured'}</td>
                  <td>
                    <span className={`status ${provider.enabled ? 'ready' : ''}`}>{provider.enabled ? 'enabled' : 'disabled'}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="icon-button" disabled={provider.id.startsWith('env-')} title="Edit provider" onClick={() => loadForEdit(provider)}>
                        <Pencil size={14} />
                      </button>
                      <button className="icon-button danger" disabled={provider.id.startsWith('env-')} title="Delete provider" onClick={() => remove(provider.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">{editingId ? 'Edit Provider' : 'Create Provider'}</h2>
            <p className="mini-subtitle">{status}</p>
          </div>
          <div className="table-actions">
            <button className="button ghost" onClick={resetForm}>New</button>
            <button className="button primary" onClick={save}>{editingId ? 'Save' : 'Create'}</button>
          </div>
        </div>
        <div className="panel-body form-grid">
          <div className="field">
            <label>Name</label>
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="field">
            <label>Provider</label>
            <select className="select" value={provider} onChange={(event) => setProvider(event.target.value)}>
              {['openai', 'grok', 'openrouter', 'xiaomi', 'alibaba', 'ollama', 'lm-studio', 'openai-compatible'].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Kind</label>
            <select className="select" value={kind} onChange={(event) => setKind(event.target.value as 'llm' | 'embedding' | 'rerank')}>
              <option value="llm">LLM</option>
              <option value="embedding">Embedding</option>
              <option value="rerank">Reranking</option>
            </select>
          </div>
          <div className="field">
            <label>Base URL</label>
            <input className="input" value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} />
          </div>
          <div className="field">
            <label>API Key Ref</label>
            <input className="input" value={apiKeyRef} onChange={(event) => setApiKeyRef(event.target.value)} />
          </div>
          <div className="field">
            <label>Model</label>
            <input className="input" value={model} onChange={(event) => setModel(event.target.value)} />
          </div>
          <label className="check-row">
            <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
            Enabled
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Connection Test</h2>
          <button className="button primary" onClick={test}>
            <PlugZap size={15} />
            Test
          </button>
        </div>
        <div className="panel-body">
          <pre className="pre">{JSON.stringify(testResult ?? { message: 'Run a provider test.' }, null, 2)}</pre>
        </div>
      </section>
    </div>
  );
}
