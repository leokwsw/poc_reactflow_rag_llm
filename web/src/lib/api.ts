const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type RagMode = 'native' | 'graph' | 'hybrid';

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
    return request<Array<{ id: string; name: string; baseUrl: string; kind: string; model: string; enabled: boolean }>>(
      '/models/providers',
      { cache: 'no-store' },
    );
  },
  testProvider() {
    return request('/models/test', { method: 'POST', body: JSON.stringify({}) });
  },
};
