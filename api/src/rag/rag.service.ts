import { Injectable } from '@nestjs/common';
import { RagContext } from '../common/types';
import { GraphService } from '../graph/graph.service';
import { ModelsService } from '../models/models.service';
import { SearchService } from '../search/search.service';
import { RagQueryDto } from './dto';

@Injectable()
export class RagService {
  constructor(
    private readonly search: SearchService,
    private readonly graph: GraphService,
    private readonly models: ModelsService,
  ) {}

  async query(dto: RagQueryDto) {
    const topK = dto.topK ?? 5;
    const trace: Record<string, unknown> = {
      mode: dto.mode,
      query: dto.query,
      workflowId: dto.workflowId,
      retrieval: [],
    };

    const contexts = await this.retrieve(dto.query, dto.mode, topK);
    trace.retrieval = contexts.map((context) => ({
      chunkId: context.chunkId,
      source: context.source,
      score: context.score,
    }));

    const answer = await this.models.chat(
      dto.query,
      contexts.map((context) => context.content),
    );

    return {
      answer,
      contexts,
      trace,
    };
  }

  private async retrieve(query: string, mode: RagQueryDto['mode'], topK: number): Promise<RagContext[]> {
    if (mode === 'native') {
      return this.search.search(query, topK);
    }

    if (mode === 'graph') {
      return this.graph.search(query, topK);
    }

    const [nativeContexts, graphContexts] = await Promise.all([
      this.search.search(query, topK),
      this.graph.search(query, topK),
    ]);

    const merged = new Map<string, RagContext>();
    for (const context of [...nativeContexts, ...graphContexts]) {
      const existing = merged.get(context.chunkId);
      if (!existing || (context.score ?? 0) > (existing.score ?? 0)) {
        merged.set(context.chunkId, context);
      }
    }

    return [...merged.values()]
      .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))
      .slice(0, topK);
  }
}
