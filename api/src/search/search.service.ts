import { Client } from '@elastic/elasticsearch';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RagContext } from '../common/types';
import { EmbeddingsService } from '../embeddings/embeddings.service';

interface IndexedChunk {
  chunkId: string;
  documentId: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private readonly indexName: string;
  private readonly client: Client;
  private readonly memoryIndex = new Map<string, IndexedChunk>();

  constructor(
    private readonly config: ConfigService,
    private readonly embeddings: EmbeddingsService,
  ) {
    this.indexName = this.config.get<string>('ELASTICSEARCH_INDEX', 'rag_chunks');
    const username = this.config.get<string>('ELASTICSEARCH_USERNAME', '');
    const password = this.config.get<string>('ELASTICSEARCH_PASSWORD', '');
    this.client = new Client({
      node: this.config.get<string>('ELASTICSEARCH_NODE', 'http://localhost:9200'),
      auth: username && password ? { username, password } : undefined,
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          mappings: {
            properties: {
              chunkId: { type: 'keyword' },
              documentId: { type: 'keyword' },
              content: { type: 'text' },
              metadata: { type: 'object', enabled: true },
              embedding: { type: 'dense_vector', dims: 1536, index: true, similarity: 'cosine' },
            },
          },
        });
      }
    } catch (error) {
      this.logger.warn(`Elasticsearch unavailable; using in-memory search fallback. ${String(error)}`);
    }
  }

  async indexChunk(chunk: IndexedChunk) {
    this.memoryIndex.set(chunk.chunkId, chunk);
    try {
      await this.client.index({
        index: this.indexName,
        id: chunk.chunkId,
        document: chunk,
      });
    } catch (error) {
      this.logger.warn(`Could not index chunk ${chunk.chunkId} in Elasticsearch. ${String(error)}`);
    }
  }

  async search(query: string, topK = 5): Promise<RagContext[]> {
    const embedding = await this.embeddings.embed(query);
    try {
      const response = await this.client.search<IndexedChunk>({
        index: this.indexName,
        size: topK,
        query: {
          bool: {
            should: [
              { match: { content: query } },
              {
                script_score: {
                  query: { match_all: {} },
                  script: {
                    source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                    params: { query_vector: embedding },
                  },
                },
              },
            ],
          },
        },
      });

      return response.hits.hits.map((hit) => ({
        chunkId: hit._source?.chunkId ?? hit._id ?? '',
        documentId: hit._source?.documentId ?? '',
        content: hit._source?.content ?? '',
        score: hit._score ?? undefined,
        source: 'elasticsearch' as const,
        metadata: hit._source?.metadata,
      }));
    } catch (error) {
      this.logger.warn(`Elasticsearch query failed; using in-memory search. ${String(error)}`);
      return this.memorySearch(query, embedding, topK);
    }
  }

  private memorySearch(query: string, embedding: number[], topK: number): RagContext[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return [...this.memoryIndex.values()]
      .map((chunk) => {
        const content = chunk.content.toLowerCase();
        const keywordScore = terms.reduce((score, term) => score + (content.includes(term) ? 1 : 0), 0);
        const vectorScore = this.cosine(embedding, chunk.embedding);
        return { chunk, score: keywordScore + vectorScore };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, topK)
      .map(({ chunk, score }) => ({
        chunkId: chunk.chunkId,
        documentId: chunk.documentId,
        content: chunk.content,
        score,
        source: 'elasticsearch' as const,
        metadata: chunk.metadata,
      }));
  }

  private cosine(left: number[], right: number[]) {
    let dot = 0;
    let leftNorm = 0;
    let rightNorm = 0;
    for (let index = 0; index < left.length; index += 1) {
      dot += left[index] * right[index];
      leftNorm += left[index] * left[index];
      rightNorm += right[index] * right[index];
    }
    return dot / ((Math.sqrt(leftNorm) || 1) * (Math.sqrt(rightNorm) || 1));
  }
}
