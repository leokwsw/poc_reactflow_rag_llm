import { EmbeddingsService } from './embeddings.service';

describe('EmbeddingsService', () => {
  it('returns deterministic mock embeddings without an API key', async () => {
    const models = {
      getProviderConfig: () => ({ embeddingModel: 'mock-embedding' }),
      createOpenAIClient: () => null,
    };
    const service = new EmbeddingsService(models as never);

    const first = await service.embed('graph rag');
    const second = await service.embed('graph rag');

    expect(first).toHaveLength(1536);
    expect(first).toEqual(second);
  });
});
