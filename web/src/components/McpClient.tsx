'use client';

import { useEffect, useState } from 'react';
import { Plug, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

type McpServer = {
  id: string;
  name: string;
  identifier: string;
  serverUrl: string;
  enabled: boolean;
  tools: unknown[];
};

export function McpClient() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [name, setName] = useState('Local MCP');
  const [identifier, setIdentifier] = useState('local-mcp');
  const [serverUrl, setServerUrl] = useState('http://localhost:3333/mcp');

  const refresh = async () => setServers(await api.listMcpServers());

  useEffect(() => {
    void refresh();
  }, []);

  const create = async () => {
    await api.createMcpServer({ name, identifier, serverUrl });
    await refresh();
  };

  return (
    <div className="two-column">
      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Add MCP Server</h2>
          <button className="button primary" onClick={create}>
            <Plug size={15} />
            Create
          </button>
        </div>
        <div className="panel-body form-grid">
          <div className="field">
            <label>Name</label>
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="field">
            <label>Identifier</label>
            <input className="input" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
          </div>
          <div className="field">
            <label>Server URL</label>
            <input className="input" value={serverUrl} onChange={(event) => setServerUrl(event.target.value)} />
          </div>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">MCP List</h2>
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
                <th>URL</th>
                <th>Tools</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {servers.map((server) => (
                <tr key={server.id}>
                  <td>
                    <strong>{server.name}</strong>
                    <br />
                    <small>{server.identifier}</small>
                  </td>
                  <td>{server.serverUrl}</td>
                  <td>{server.tools.length}</td>
                  <td><span className={`status ${server.enabled ? 'ready' : ''}`}>{server.enabled ? 'enabled' : 'disabled'}</span></td>
                </tr>
              ))}
              {!servers.length ? (
                <tr>
                  <td colSpan={4}>No MCP servers yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
