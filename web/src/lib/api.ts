const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type RagMode = 'native' | 'graph' | 'hybrid';
export type SourceType = 'text' | 'file' | 'video' | 'youtube' | 'audio' | 'link';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  createDocument(input: { title: string; content: string; sourceType?: string }) {
    return request('/documents', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  listCollections() {
    return request<Array<{ id: string; name: string; description?: string; updatedAt: string; _count: { documents: number; jobs: number } }>>(
      '/collections',
      { cache: 'no-store' },
    );
  },
  createCollection(input: { name: string; description?: string }) {
    return request<{ id: string; name: string }>('/collections', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  addCollectionDocument(
    collectionId: string,
    input: { title: string; content: string; sourceType: SourceType; sourceUri?: string; mimeType?: string },
  ) {
    return request(`/collections/${collectionId}/documents`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  ingestCollectionDocument(collectionId: string, documentId: string) {
    return request(`/collections/${collectionId}/documents/${documentId}/ingest`, { method: 'POST' });
  },
  listDocuments() {
    return request<Array<{ id: string; title: string; status: string; sourceType: string; updatedAt: string; chunks: unknown[] }>>(
      '/documents',
      { cache: 'no-store' },
    );
  },
  ingestDocument(id: string) {
    return request(`/documents/${id}/ingest`, { method: 'POST' });
  },
  queryRag(input: { query: string; mode: RagMode; topK?: number; workflowId?: string }) {
    return request<{
      answer: string;
      contexts: Array<{ chunkId: string; documentId: string; content: string; score?: number; source: string }>;
      trace: unknown;
    }>('/rag/query', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  listWorkflows() {
    return request<Array<{ id: string; name: string; description?: string; nodes: unknown[]; edges: unknown[]; updatedAt: string }>>(
      '/workflows',
      { cache: 'no-store' },
    );
  },
  listConversations() {
    return request<
      Array<{
        id: string;
        title: string;
        updatedAt: string;
        workflow: { id: string; name: string };
        messages: Array<{ content: string; role: string }>;
        _count: { messages: number };
      }>
    >('/conversations', { cache: 'no-store' });
  },
  createConversation(input: { workflowId: string; title: string }) {
    return request<{ id: string }>('/conversations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  getConversation(id: string) {
    return request<{
      id: string;
      title: string;
      workflow: { id: string; name: string };
      messages: Array<{ id: string; role: string; content: string; createdAt: string }>;
      runs: unknown[];
    }>(`/conversations/${id}`, { cache: 'no-store' });
  },
  sendConversationMessage(id: string, input: { content: string; mode?: RagMode }) {
    return request(`/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  createWorkflow(input: { name: string; description?: string; nodes: unknown[]; edges: unknown[] }) {
    return request<{ id: string }>('/workflows', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  updateWorkflow(id: string, input: { name?: string; description?: string; nodes?: unknown[]; edges?: unknown[] }) {
    return request(`/workflows/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  runWorkflow(id: string, input: { query: string; mode: RagMode }) {
    return request(`/workflows/${id}/run`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });
  },
  listProviders() {
    return request<Array<{ id: string; name: string; provider?: string; baseUrl: string; apiKeyRef?: string; kind: string; model: string; enabled: boolean }>>(
      '/models/providers',
      { cache: 'no-store' },
    );
  },
  createProvider(input: {
    name: string;
    provider?: string;
    baseUrl: string;
    apiKeyRef?: string;
    kind: 'llm' | 'embedding' | 'rerank';
    model: string;
  }) {
    return request('/models/providers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  updateProvider(
    id: string,
    input: Partial<{
      name: string;
      provider: string;
      baseUrl: string;
      apiKeyRef: string;
      kind: 'llm' | 'embedding' | 'rerank';
      model: string;
      enabled: boolean;
    }>,
  ) {
    return request(`/models/providers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
  deleteProvider(id: string) {
    return request(`/models/providers/${id}`, { method: 'DELETE' });
  },
  listMcpServers() {
    return request<Array<{ id: string; name: string; identifier: string; serverUrl: string; enabled: boolean; tools: unknown[] }>>(
      '/mcp/servers',
      { cache: 'no-store' },
    );
  },
  createMcpServer(input: { name: string; identifier: string; serverUrl: string }) {
    return request('/mcp/servers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  listCustomTools() {
    return request<Array<{ id: string; name: string; description?: string; baseUrl?: string; operations: unknown[] }>>(
      '/custom-tools',
      { cache: 'no-store' },
    );
  },
  createCustomTool(input: { name: string; description?: string; baseUrl?: string; openapiSpec: Record<string, unknown> }) {
    return request('/custom-tools', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  testProvider() {
    return request('/models/test', { method: 'POST', body: JSON.stringify({}) });
  },
};
