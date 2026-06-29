import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { toPrismaJson } from '../common/json';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { CreateConversationDto, SendMessageDto } from './dto';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflows: WorkflowsService,
  ) {}

  create(dto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        workflowId: dto.workflowId,
        title: dto.title,
        metadata: toPrismaJson(dto.metadata ?? {}),
      },
    });
  }

  list() {
    return this.prisma.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        workflow: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
    });
  }

  async get(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        workflow: true,
        messages: { orderBy: { createdAt: 'asc' } },
        runs: { orderBy: { startedAt: 'desc' }, take: 10, include: { nodeRuns: true, logs: true } },
      },
    });
    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }
    return conversation;
  }

  async sendMessage(id: string, dto: SendMessageDto) {
    const conversation = await this.get(id);
    const userMessage = await this.prisma.message.create({
      data: {
        conversationId: id,
        role: MessageRole.user,
        content: dto.content,
      },
    });

    const run = await this.workflows.run(
      conversation.workflowId,
      { input: { query: dto.content, mode: dto.mode ?? 'hybrid' } },
      { conversationId: id, messageId: userMessage.id },
    );
    const output = run.output as { answer?: string } | null;
    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId: id,
        role: MessageRole.assistant,
        content: output?.answer ?? 'Workflow did not return an answer.',
        metadata: toPrismaJson({ workflowRunId: run.id }),
      },
    });

    await this.prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return { userMessage, assistantMessage, run };
  }
}
