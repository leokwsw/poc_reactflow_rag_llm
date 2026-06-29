import { Injectable, NotFoundException } from '@nestjs/common';
import { IngestionJobStatus } from '@prisma/client';
import { toPrismaJson } from '../common/json';
import { DocumentsService } from '../documents/documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddCollectionDocumentDto, CreateCollectionDto } from './dto';

@Injectable()
export class CollectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: DocumentsService,
  ) {}

  create(dto: CreateCollectionDto) {
    return this.prisma.collection.create({
      data: {
        name: dto.name,
        description: dto.description,
        metadata: toPrismaJson(dto.metadata ?? {}),
      },
    });
  }

  list() {
    return this.prisma.collection.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { documents: true, jobs: true } },
      },
    });
  }

  async get(id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { updatedAt: 'desc' }, include: { chunks: { select: { id: true } } } },
        jobs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!collection) {
      throw new NotFoundException(`Collection ${id} not found`);
    }
    return collection;
  }

  async addDocument(collectionId: string, dto: AddCollectionDocumentDto) {
    await this.get(collectionId);
    const document = await this.documents.create({
      ...dto,
      collectionId,
      metadata: dto.metadata ?? {},
    });

    const job = await this.prisma.ingestionJob.create({
      data: {
        collectionId,
        documentId: document.id,
        sourceType: dto.sourceType,
        sourceUri: dto.sourceUri,
        status: IngestionJobStatus.queued,
      },
    });

    return { document, job };
  }

  async ingestDocument(collectionId: string, documentId: string) {
    await this.get(collectionId);
    const job = await this.prisma.ingestionJob.create({
      data: {
        collectionId,
        documentId,
        sourceType: 'document',
        status: IngestionJobStatus.running,
      },
    });

    try {
      const result = await this.documents.ingest(documentId);
      await this.prisma.ingestionJob.update({
        where: { id: job.id },
        data: {
          status: IngestionJobStatus.completed,
          stats: toPrismaJson({ chunks: result.chunks }),
          finishedAt: new Date(),
        },
      });
      return result;
    } catch (error) {
      await this.prisma.ingestionJob.update({
        where: { id: job.id },
        data: {
          status: IngestionJobStatus.failed,
          error: error instanceof Error ? error.message : String(error),
          finishedAt: new Date(),
        },
      });
      throw error;
    }
  }
}
