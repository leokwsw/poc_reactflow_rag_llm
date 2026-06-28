import { DocumentsClient } from '@/components/DocumentsClient';

export default function DocumentsPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">Create text sources, chunk them, embed them, index Elasticsearch and write Neo4j graph relationships.</p>
        </div>
      </header>
      <DocumentsClient />
    </div>
  );
}
