import { Injectable } from '@nestjs/common';
import { CustomToolAuthType } from '@prisma/client';
import { toPrismaJson } from '../common/json';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomToolDto } from './dto';

type OperationCandidate = {
  operationId: string;
  method: string;
  path: string;
  summary?: string;
  schema: Record<string, unknown>;
};

@Injectable()
export class CustomToolsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.customTool.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { operations: { orderBy: { operationId: 'asc' } } },
    });
  }

  async create(dto: CreateCustomToolDto) {
    const operations = this.extractOperations(dto.openapiSpec);
    return this.prisma.customTool.create({
      data: {
        name: dto.name,
        description: dto.description,
        baseUrl: dto.baseUrl,
        authType: dto.authType ?? CustomToolAuthType.none,
        authConfig: toPrismaJson(dto.authConfig ?? {}),
        openapiSpec: toPrismaJson(dto.openapiSpec),
        operations: {
          create: operations.map((operation) => ({
            operationId: operation.operationId,
            method: operation.method,
            path: operation.path,
            summary: operation.summary,
            schema: toPrismaJson(operation.schema),
          })),
        },
      },
      include: { operations: true },
    });
  }

  get(id: string) {
    return this.prisma.customTool.findUniqueOrThrow({
      where: { id },
      include: { operations: true },
    });
  }

  private extractOperations(spec: Record<string, unknown>): OperationCandidate[] {
    const paths = spec.paths;
    if (!paths || typeof paths !== 'object') {
      return [];
    }

    const methods = new Set(['get', 'post', 'put', 'patch', 'delete']);
    const operations: OperationCandidate[] = [];
    for (const [path, pathItem] of Object.entries(paths as Record<string, unknown>)) {
      if (!pathItem || typeof pathItem !== 'object') continue;
      for (const [method, operation] of Object.entries(pathItem as Record<string, unknown>)) {
        if (!methods.has(method.toLowerCase()) || !operation || typeof operation !== 'object') continue;
        const op = operation as Record<string, unknown>;
        operations.push({
          operationId: String(op.operationId ?? `${method}_${path}`.replace(/[^A-Za-z0-9_]+/g, '_')),
          method: method.toUpperCase(),
          path,
          summary: typeof op.summary === 'string' ? op.summary : undefined,
          schema: op,
        });
      }
    }
    return operations;
  }
}
