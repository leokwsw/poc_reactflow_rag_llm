import { PlaygroundClient } from '@/components/PlaygroundClient';

export default function PlaygroundPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Playground</h1>
          <p className="page-subtitle">Compare Native RAG, Graph RAG and Hybrid RAG against the same question.</p>
        </div>
      </header>
      <PlaygroundClient />
    </div>
  );
}
