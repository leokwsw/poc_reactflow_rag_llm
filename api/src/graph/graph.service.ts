import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';
import { RagContext } from '../common/types';

interface GraphChunk {
  chunkId: string;
  documentId: string;
  title: string;
  content: string;
  entities: string[];
}

@Injectable()
export class GraphService implements OnModuleDestroy {
  private readonly logger = new Logger(GraphService.name);
  private readonly driver: Driver;
  private readonly memoryGraph = new Map<string, GraphChunk>();

  constructor(private readonly config: ConfigService) {
    this.driver = neo4j.driver(
      this.config.get<string>('NEO4J_URI', 'bolt://localhost:7687'),
      neo4j.auth.basic(
        this.config.get<string>('NEO4J_USERNAME', 'neo4j'),
        this.config.get<string>('NEO4J_PASSWORD', 'ragpassword'),
      ),
    );
  }

  async onModuleDestroy() {
    await this.driver.close();
  }

  async upsertDocumentChunk(input: GraphChunk) {
    this.memoryGraph.set(input.chunkId, input);
    const session = this.driver.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MERGE (d:Document {id: $documentId})
          SET d.title = $title
          MERGE (c:Chunk {id: $chunkId})
          SET c.content = $content, c.documentId = $documentId
          MERGE (d)-[:DOCUMENT_HAS_CHUNK]->(c)
          WITH c
          UNWIND $entities AS entityName
          MERGE (e:Entity {name: entityName})
          MERGE (c)-[:CHUNK_MENTIONS_ENTITY]->(e)
          `,
          input,
        ),
      );
    } catch (error) {
      this.logger.warn(`Neo4j write failed; using in-memory graph fallback. ${String(error)}`);
    } finally {
      await session.close();
    }
  }

  async search(query: string, topK = 5): Promise<RagContext[]> {
    const terms = this.extractEntities(query);
    const session = this.driver.session();
    try {
      const result = await session.executeRead((tx) =>
        tx.run(
          `
          MATCH (c:Chunk)-[:CHUNK_MENTIONS_ENTITY]->(e:Entity)
          WHERE toLower(e.name) IN $terms OR toLower(c.content) CONTAINS $query
          WITH c, collect(DISTINCT e.name) AS entities, count(e) AS score
          RETURN c.id AS chunkId, c.documentId AS documentId, c.content AS content, entities, score
          ORDER BY score DESC
          LIMIT $topK
          `,
          { query: query.toLowerCase(), terms, topK: neo4j.int(topK) },
        ),
      );

      return result.records.map((record) => ({
        chunkId: record.get('chunkId'),
        documentId: record.get('documentId'),
        content: record.get('content'),
        score: Number(record.get('score')),
        source: 'neo4j' as const,
        metadata: { entities: record.get('entities') },
      }));
    } catch (error) {
      this.logger.warn(`Neo4j query failed; using in-memory graph search. ${String(error)}`);
      return this.memorySearch(query, topK);
    } finally {
      await session.close();
    }
  }

  extractEntities(text: string): string[] {
    const words = text.match(/[A-Za-z][A-Za-z0-9_-]{2,}|[\u4e00-\u9fff]{2,}/g) ?? [];
    return [...new Set(words.map((word) => word.toLowerCase()))].slice(0, 20);
  }

  private memorySearch(query: string, topK: number): RagContext[] {
    const terms = this.extractEntities(query);
    return [...this.memoryGraph.values()]
      .map((chunk) => {
        const content = chunk.content.toLowerCase();
        const entityScore = chunk.entities.filter((entity) => terms.includes(entity.toLowerCase())).length;
        const textScore = terms.reduce((score, term) => score + (content.includes(term) ? 1 : 0), 0);
        return { chunk, score: entityScore * 2 + textScore };
      })
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, topK)
      .map(({ chunk, score }) => ({
        chunkId: chunk.chunkId,
        documentId: chunk.documentId,
        content: chunk.content,
        score,
        source: 'neo4j' as const,
        metadata: { entities: chunk.entities },
      }));
  }
}
