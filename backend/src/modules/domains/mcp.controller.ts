import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put } from '@nestjs/common'

import {
  callMcpTool,
  createMcpServer,
  deleteMcpServer,
  inspectMcpTools,
  listMcpServers,
  refreshMcpServerTools,
  updateMcpServer,
} from '@/app/mcp/data'

type ServerBody = { name: string; server_identifier: string; server_url: string }

@Controller('mcp')
export class McpController {
  @Get('servers')
  async list() {
    return { servers: await listMcpServers() }
  }

  @Post('servers')
  async create(@Body() body: ServerBody) {
    return { server: await createMcpServer(body) }
  }

  @Put('servers/:serverId')
  async update(@Param('serverId') id: string, @Body() body: ServerBody) {
    const server = await updateMcpServer(id, body)
    if (!server) throw new NotFoundException('MCP server not found.')
    return { server }
  }

  @Delete('servers/:serverId')
  async remove(@Param('serverId') id: string) {
    if (!(await deleteMcpServer(id))) throw new NotFoundException('MCP server not found.')
    return { success: true }
  }

  @Post('servers/:serverId/refresh')
  async refresh(@Param('serverId') id: string) {
    return refreshMcpServerTools(id)
  }

  @Get('tools')
  async tools() {
    const servers = await listMcpServers()
    return {
      tools: servers.flatMap(server => server.tools.map(tool => ({
        id: `${server.server_identifier}:${tool.name}`,
        name: tool.name,
        description: tool.description ?? '',
        inputSchema: tool.inputSchema ?? {},
        server_id: server.id,
        server_name: server.name,
        server_identifier: server.server_identifier,
      }))),
    }
  }

  @Post('inspect')
  async inspect(@Body() body: {
    action?: string
    serverUrl?: string
    headers?: Record<string, string>
    toolName?: string
    arguments?: Record<string, unknown>
  }) {
    const serverUrl = body.serverUrl?.trim() ?? ''
    if (!serverUrl) throw new BadRequestException('MCP server URL is required.')
    if (body.action === 'tools/list') {
      return { tools: await inspectMcpTools(serverUrl, body.headers ?? {}) }
    }
    if (body.action === 'tools/call' && body.toolName?.trim()) {
      return {
        result: await callMcpTool({
          serverUrl,
          headers: body.headers ?? {},
          toolName: body.toolName.trim(),
          arguments: body.arguments ?? {},
        }),
      }
    }
    throw new BadRequestException('Unknown MCP inspector action.')
  }
}
