import { StudioClient } from '@/components/StudioClient';

export default function StudioPage() {
  return (
    <div className="page studio-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Workflow Studio</h1>
          <p className="page-subtitle">Compose Native RAG, Graph RAG, reranking and LLM calls as an executable flow.</p>
        </div>
      </header>
      <StudioClient />
    </div>
  );
}
