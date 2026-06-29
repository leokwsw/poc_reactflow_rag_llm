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
  private elasticsearchReady = false;
  private activeIndexName: string;
  private activeVectorDims?: number;

  constructor(
    private readonly config: ConfigService,
    private readonly embeddings: EmbeddingsService,
  ) {
    this.indexName = this.config.get<string>('ELASTICSEARCH_INDEX', 'rag_chunks');
    this.activeIndexName = this.indexName;
    const username = this.config.get<string>('ELASTICSEARCH_USERNAME', '');
    const password = this.config.get<string>('ELASTICSEARCH_PASSWORD', '');
    this.client = new Client({
      node: this.config.get<string>('ELASTICSEARCH_NODE', 'http://localhost:9200'),
      auth: username && password ? { username, password } : undefined,
    });
  }

  async onModuleInit() {
    try {
      try {
        const mapping = await this.client.indices.getMapping({ index: this.indexName });
        const mappingInfo = this.getMappingInfo(mapping, this.indexName);
        if (!mappingInfo.compatible) {
          this.elasticsearchReady = false;
          this.logger.warn(
            `Elasticsearch index "${this.indexName}" has an incompatible mapping. ` +
              'Expected fields content:text and embedding:dense_vector. ' +
              'Using in-memory search fallback.',
          );
          return;
        }

        this.elasticsearchReady = true;
        this.activeVectorDims = mappingInfo.dims;
        return;
      } catch (error) {
        if (!this.isMissingIndexError(error)) {
          throw error;
        }

        await this.client.indices.create({
          index: this.indexName,
          mappings: {
            properties: {
              chunkId: { type: 'keyword' },
              documentId: { type: 'keyword' },
              content: { type: 'text' },
              metadata: { type: 'object', enabled: true },
              embedding: { type: 'dense_vector', dims: this.configuredVectorDims(), index: true, similarity: 'cosine' },
            },
          },
        });
        this.elasticsearchReady = true;
        this.activeVectorDims = this.configuredVectorDims();
        return;
      }
    } catch (error) {
      this.elasticsearchReady = false;
      this.logger.warn(`Elasticsearch unavailable; using in-memory search fallback. ${this.formatError(error)}`);
    }
  }

  async indexChunk(chunk: IndexedChunk) {
    this.memoryIndex.set(chunk.chunkId, chunk);
    const indexName = await this.ensureIndexForVectorDims(chunk.embedding.length);
    if (!this.elasticsearchReady || !indexName) {
      return;
    }

    try {
      await this.client.index({
        index: indexName,
        id: chunk.chunkId,
        document: chunk,
      });
    } catch (error) {
      this.logger.warn(`Could not index chunk ${chunk.chunkId} in Elasticsearch. ${this.formatError(error)}`);
    }
  }

  async search(query: string, topK = 5): Promise<RagContext[]> {
    const embedding = await this.embeddings.embed(query);
    const indexName = await this.ensureIndexForVectorDims(embedding.length);
    if (!this.elasticsearchReady || !indexName) {
      return this.memorySearch(query, embedding, topK);
    }

    try {
      const response = await this.client.search<IndexedChunk>({
        index: indexName,
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
      this.logger.warn(`Elasticsearch query failed; using in-memory search. ${this.formatError(error)}`);
      return this.memorySearch(query, embedding, topK);
    }
  }

  private getMappingInfo(mapping: unknown, indexName: string) {
    const indexMapping = mapping as Record<string, { mappings?: { properties?: Record<string, unknown> } }>;
    const properties = indexMapping[indexName]?.mappings?.properties;
    const content = properties?.content as { type?: string } | undefined;
    const embedding = properties?.embedding as { type?: string; dims?: number } | undefined;

    return {
      compatible: content?.type === 'text' && embedding?.type === 'dense_vector' && typeof embedding?.dims === 'number',
      dims: embedding?.dims,
    };
  }

  private async ensureIndexForVectorDims(dims: number): Promise<string | null> {
    if (this.elasticsearchReady && this.activeVectorDims === dims) {
      return this.activeIndexName;
    }

    try {
      const baseMapping = await this.client.indices.getMapping({ index: this.indexName });
      const baseInfo = this.getMappingInfo(baseMapping, this.indexName);
      if (baseInfo.compatible && baseInfo.dims === dims) {
        this.activeIndexName = this.indexName;
        this.activeVectorDims = dims;
        this.elasticsearchReady = true;
        return this.activeIndexName;
      }

      if (baseInfo.compatible && baseInfo.dims !== dims) {
        const dimensionIndexName = `${this.indexName}_${dims}d`;
        const ready = await this.ensureDimensionIndex(dimensionIndexName, dims);
        if (!ready) {
          return null;
        }
        this.activeIndexName = dimensionIndexName;
        this.activeVectorDims = dims;
        this.elasticsearchReady = true;
        this.logger.warn(
          `Embedding dimension ${dims} does not match "${this.indexName}" mapping dims=${baseInfo.dims}. ` +
            `Using "${dimensionIndexName}" for Elasticsearch vector search.`,
        );
        return this.activeIndexName;
      }

      this.elasticsearchReady = false;
      return null;
    } catch (error) {
      if (!this.isMissingIndexError(error)) {
        this.elasticsearchReady = false;
        this.logger.warn(`Elasticsearch index check failed; using in-memory search. ${this.formatError(error)}`);
        return null;
      }

      const ready = await this.ensureDimensionIndex(this.indexName, dims);
      if (!ready) {
        return null;
      }
      this.activeIndexName = this.indexName;
      this.activeVectorDims = dims;
      this.elasticsearchReady = true;
      return this.activeIndexName;
    }
  }

  private async ensureDimensionIndex(indexName: string, dims: number): Promise<boolean> {
    try {
      const mapping = await this.client.indices.getMapping({ index: indexName });
      const info = this.getMappingInfo(mapping, indexName);
      if (info.compatible && info.dims === dims) {
        return true;
      }
      this.logger.warn(
        `Elasticsearch index "${indexName}" exists but has incompatible vector dims=${info.dims ?? 'unknown'}; using in-memory search fallback.`,
      );
      this.elasticsearchReady = false;
      return false;
    } catch (error) {
      if (!this.isMissingIndexError(error)) {
        throw error;
      }
      await this.client.indices.create({
        index: indexName,
        mappings: {
          properties: {
            chunkId: { type: 'keyword' },
            documentId: { type: 'keyword' },
            content: { type: 'text' },
            metadata: { type: 'object', enabled: true },
            embedding: { type: 'dense_vector', dims, index: true, similarity: 'cosine' },
          },
        },
      });
      return true;
    }
  }

  private configuredVectorDims() {
    return Number(this.config.get<string>('ELASTICSEARCH_VECTOR_DIMS', '1536'));
  }

  private formatError(error: unknown) {
    const elasticError = error as {
      name?: string;
      message?: string;
      meta?: {
        statusCode?: number;
        body?: unknown;
      };
    };

    const parts = [elasticError.name ?? error?.constructor?.name ?? 'Error'];
    if (elasticError.meta?.statusCode) {
      parts.push(`status=${elasticError.meta.statusCode}`);
    }
    if (elasticError.message) {
      parts.push(elasticError.message);
    }
    if (elasticError.meta?.body) {
      parts.push(JSON.stringify(elasticError.meta.body));
    }

    return parts.join(' ');
  }

  private isMissingIndexError(error: unknown) {
    const elasticError = error as { meta?: { statusCode?: number } };
    return elasticError.meta?.statusCode === 404;
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
