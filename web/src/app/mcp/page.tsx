import { McpClient } from '@/components/McpClient';

export default function McpPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">MCP List</h1>
          <p className="page-subtitle">Register MCP servers and expose their tools to workflow LLM nodes.</p>
        </div>
      </header>
      <McpClient />
    </div>
  );
}
