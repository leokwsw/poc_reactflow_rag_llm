import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateMcpServerDto, UpsertMcpToolDto } from './dto';
import { McpService } from './mcp.service';

@Controller('mcp')
export class McpController {
  constructor(private readonly mcp: McpService) {}

  @Get('servers')
  listServers() {
    return this.mcp.listServers();
  }

  @Post('servers')
  createServer(@Body() dto: CreateMcpServerDto) {
    return this.mcp.createServer(dto);
  }

  @Get('servers/:id/inspect')
  inspect(@Param('id') id: string) {
    return this.mcp.inspect(id);
  }

  @Post('servers/:id/tools')
  upsertTool(@Param('id') id: string, @Body() dto: UpsertMcpToolDto) {
    return this.mcp.upsertTool(id, dto);
  }
}
