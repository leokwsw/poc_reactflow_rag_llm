import { Injectable } from '@nestjs/common';
import { toPrismaJson } from '../common/json';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMcpServerDto, UpsertMcpToolDto } from './dto';

@Injectable()
export class McpService {
  constructor(private readonly prisma: PrismaService) {}

  listServers() {
    return this.prisma.mcpServer.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { tools: { orderBy: { name: 'asc' } } },
    });
  }

  createServer(dto: CreateMcpServerDto) {
    return this.prisma.mcpServer.create({
      data: {
        name: dto.name,
        identifier: dto.identifier,
        serverUrl: dto.serverUrl,
        headers: toPrismaJson(dto.headers ?? {}),
        enabled: dto.enabled ?? true,
      },
    });
  }

  upsertTool(serverId: string, dto: UpsertMcpToolDto) {
    return this.prisma.mcpTool.upsert({
      where: { serverId_name: { serverId, name: dto.name } },
      create: {
        serverId,
        name: dto.name,
        description: dto.description,
        inputSchema: toPrismaJson(dto.inputSchema ?? {}),
      },
      update: {
        description: dto.description,
        inputSchema: toPrismaJson(dto.inputSchema ?? {}),
      },
    });
  }

  inspect(serverId: string) {
    return this.prisma.mcpServer.findUniqueOrThrow({
      where: { id: serverId },
      include: { tools: true },
    });
  }
}
