'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { api, type RagMode } from '@/lib/api';

type RagResult = Awaited<ReturnType<typeof api.queryRag>>;

export function PlaygroundClient() {
  const [query, setQuery] = useState('How does Graph RAG improve retrieval?');
  const [mode, setMode] = useState<RagMode>('hybrid');
  const [topK, setTopK] = useState(5);
  const [result, setResult] = useState<RagResult>();
  const [status, setStatus] = useState('Ready');

  const run = async () => {
    setStatus('Querying');
    const response = await api.queryRag({ query, mode, topK });
    setResult(response);
    setStatus('Completed');
  };

  return (
    <div className="two-column">
      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">RAG Query</h2>
          <span className="status">{status}</span>
        </div>
        <div className="panel-body form-grid">
          <div className="field">
            <label>Mode</label>
            <select className="select" value={mode} onChange={(event) => setMode(event.target.value as RagMode)}>
              <option value="native">Native RAG</option>
              <option value="graph">Graph RAG</option>
              <option value="hybrid">Hybrid RAG</option>
            </select>
          </div>
          <div className="field">
            <label>Top K</label>
            <input className="input" type="number" min={1} max={20} value={topK} onChange={(event) => setTopK(Number(event.target.value))} />
          </div>
          <div className="field">
            <label>Question</label>
            <textarea className="textarea" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <button className="button primary" onClick={run}>
            <Search size={15} />
            Run Query
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Answer</h2>
          <span className="status">{result ? `${result.contexts.length} contexts` : 'empty'}</span>
        </div>
        <div className="panel-body answer-stack">
          <p className="answer-text">{result?.answer ?? 'Run a query after ingesting documents.'}</p>
          <h3>Contexts</h3>
          <div className="context-list">
            {result?.contexts.map((context) => (
              <article key={`${context.source}-${context.chunkId}`} className="context-row">
                <strong>{context.source}</strong>
                <span>{typeof context.score === 'number' ? context.score.toFixed(3) : 'n/a'}</span>
                <p>{context.content}</p>
              </article>
            ))}
          </div>
          <h3>Trace</h3>
          <pre className="pre">{JSON.stringify(result?.trace ?? {}, null, 2)}</pre>
        </div>
      </section>
    </div>
  );
}
