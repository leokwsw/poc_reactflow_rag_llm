'use client';

import { useEffect, useState } from 'react';
import { PlugZap, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

type Provider = {
  id: string;
  name: string;
  baseUrl: string;
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
    await api.createProvider({ name, provider, baseUrl, apiKeyRef, kind, model });
    await refresh();
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Create Provider</h2>
          <button className="button primary" onClick={create}>Create</button>
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
