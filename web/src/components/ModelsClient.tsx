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

  const refresh = async () => {
    setProviders(await api.listProviders());
  };

  useEffect(() => {
    void refresh();
  }, []);

  const test = async () => {
    setTestResult(await api.testProvider());
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
