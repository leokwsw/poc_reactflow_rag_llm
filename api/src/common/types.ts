export type RagMode = 'native' | 'graph' | 'hybrid';

export interface RagContext {
  chunkId: string;
  documentId: string;
  content: string;
  score?: number;
  source: 'elasticsearch' | 'neo4j';
  metadata?: Record<string, unknown>;
}
