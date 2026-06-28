import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentStatus } from '@prisma/client';
import { toPrismaJson } from '../common/json';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { GraphService } from '../graph/graph.service';
import { ModelsService } from '../models/models.service';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { CreateDocumentDto } from './dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingsService,
    private readonly search: SearchService,
    private readonly graph: GraphService,
    private readonly models: ModelsService,
  ) {}

  create(dto: CreateDocumentDto) {
    return this.prisma.document.create({
      data: {
        title: dto.title,
        content: dto.content,
        sourceType: dto.sourceType ?? 'text',
        metadata: toPrismaJson(dto.metadata ?? {}),
      },
    });
  }

  list() {
    return this.prisma.document.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { chunks: { select: { id: true } } },
    });
  }

  async get(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { chunks: true },
    });
    if (!document) {
      throw new NotFoundException(`Document ${id} not found`);
    }
    return document;
  }

  async ingest(id: string) {
    const document = await this.get(id);
    const provider = this.models.getProviderConfig();
    await this.prisma.document.update({
      where: { id },
      data: { status: DocumentStatus.INGESTING },
    });

    try {
      await this.prisma.chunk.deleteMany({ where: { documentId: id } });
      const chunks = this.chunkText(document.content);
      const embeddings = await this.embeddings.embedMany(chunks);
      const createdChunks = [];

      for (const [index, content] of chunks.entries()) {
        const chunk = await this.prisma.chunk.create({
          data: {
            documentId: id,
            content,
            tokenCount: this.estimateTokens(content),
            embeddingModel: provider.embeddingModel,
            metadata: toPrismaJson({ chunkIndex: index }),
          },
        });
        createdChunks.push(chunk);

        await this.search.indexChunk({
          chunkId: chunk.id,
          documentId: id,
          content,
          metadata: { title: document.title, chunkIndex: index },
          embedding: embeddings[index],
        });

        await this.graph.upsertDocumentChunk({
          chunkId: chunk.id,
          documentId: id,
          title: document.title,
          content,
          entities: this.graph.extractEntities(content),
        });
      }

      const updated = await this.prisma.document.update({
        where: { id },
        data: { status: DocumentStatus.READY },
      });

      return {
        document: updated,
        chunks: createdChunks.length,
      };
    } catch (error) {
      await this.prisma.document.update({
        where: { id },
        data: { status: DocumentStatus.FAILED },
      });
      throw error;
    }
  }

  private chunkText(content: string): string[] {
    const normalized = content.replace(/\s+/g, ' ').trim();
    const size = 900;
    const overlap = 120;
    const chunks: string[] = [];
    for (let start = 0; start < normalized.length; start += size - overlap) {
      const chunk = normalized.slice(start, start + size).trim();
      if (chunk) {
        chunks.push(chunk);
      }
    }
    return chunks.length ? chunks : [content];
  }

  private estimateTokens(text: string) {
    return Math.ceil(text.length / 4);
  }
}
