import { RagService } from './rag.service';

describe('RagService', () => {
  const nativeContext = {
    chunkId: 'native-1',
    documentId: 'doc-1',
    content: 'native context',
    score: 0.8,
    source: 'elasticsearch' as const,
  };
  const graphContext = {
    chunkId: 'graph-1',
    documentId: 'doc-1',
    content: 'graph context',
    score: 1.2,
    source: 'neo4j' as const,
  };

  it('routes native mode to Elasticsearch retrieval', async () => {
    const search = { search: jest.fn().mockResolvedValue([nativeContext]) };
    const graph = { search: jest.fn().mockResolvedValue([graphContext]) };
    const models = { chat: jest.fn().mockResolvedValue('answer') };
    const service = new RagService(search as never, graph as never, models as never);

    const result = await service.query({ query: 'q', mode: 'native' });

    expect(search.search).toHaveBeenCalledWith('q', 5);
    expect(graph.search).not.toHaveBeenCalled();
    expect(result.contexts).toEqual([nativeContext]);
  });

  it('merges native and graph retrieval for hybrid mode', async () => {
    const search = { search: jest.fn().mockResolvedValue([nativeContext]) };
    const graph = { search: jest.fn().mockResolvedValue([graphContext]) };
    const models = { chat: jest.fn().mockResolvedValue('answer') };
    const service = new RagService(search as never, graph as never, models as never);

    const result = await service.query({ query: 'q', mode: 'hybrid', topK: 10 });

    expect(result.contexts.map((context) => context.source)).toEqual(['neo4j', 'elasticsearch']);
    expect(models.chat).toHaveBeenCalledWith('q', ['graph context', 'native context']);
  });
});
