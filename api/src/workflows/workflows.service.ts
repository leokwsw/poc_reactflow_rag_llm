import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkflowRunStatus } from '@prisma/client';
import { toPrismaJson } from '../common/json';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from '../rag/rag.service';
import { CreateWorkflowDto, RunWorkflowDto, UpdateWorkflowDto } from './dto';

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rag: RagService,
  ) {}

  create(dto: CreateWorkflowDto) {
    return this.prisma.workflow.create({
      data: {
        name: dto.name,
        description: dto.description,
        nodes: toPrismaJson(dto.nodes),
        edges: toPrismaJson(dto.edges),
      },
    });
  }

  list() {
    return this.prisma.workflow.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async get(id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
      include: { runs: { orderBy: { startedAt: 'desc' }, take: 10 } },
    });
    if (!workflow) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }
    return workflow;
  }

  update(id: string, dto: UpdateWorkflowDto) {
    return this.prisma.workflow.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.nodes ? { nodes: toPrismaJson(dto.nodes) } : {}),
        ...(dto.edges ? { edges: toPrismaJson(dto.edges) } : {}),
      },
    });
  }

  async run(id: string, dto: RunWorkflowDto) {
    const workflow = await this.get(id);
    const run = await this.prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        input: toPrismaJson(dto.input),
        status: WorkflowRunStatus.running,
      },
    });

    try {
      const output = await this.rag.query({
        query: dto.input.query ?? '',
        mode: dto.input.mode ?? 'hybrid',
        workflowId: id,
      });

      return this.prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          output: toPrismaJson(output),
          trace: toPrismaJson(output.trace),
          status: WorkflowRunStatus.completed,
          finishedAt: new Date(),
        },
      });
    } catch (error) {
      return this.prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: WorkflowRunStatus.failed,
          trace: toPrismaJson({ error: String(error) }),
          finishedAt: new Date(),
        },
      });
    }
  }
}
