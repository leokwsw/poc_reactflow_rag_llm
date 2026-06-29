import { CollectionsClient } from '@/components/CollectionsClient';

export default function CollectionsPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Document Collections</h1>
          <p className="page-subtitle">Group files, videos, YouTube links, audio, web links and text sources before indexing Elasticsearch and Neo4j.</p>
        </div>
      </header>
      <CollectionsClient />
    </div>
  );
}
