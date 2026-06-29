import { CustomToolsClient } from '@/components/CustomToolsClient';

export default function ToolsPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Custom Tool List</h1>
          <p className="page-subtitle">Import OpenAPI / Swagger rules and turn operations into workflow tool actions.</p>
        </div>
      </header>
      <CustomToolsClient />
    </div>
  );
}
