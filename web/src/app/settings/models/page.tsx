import { ModelsClient } from '@/components/ModelsClient';

export default function ModelsPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Model Providers</h1>
          <p className="page-subtitle">Inspect OpenAI-compatible chat, embedding and optional reranking configuration.</p>
        </div>
      </header>
      <ModelsClient />
    </div>
  );
}
