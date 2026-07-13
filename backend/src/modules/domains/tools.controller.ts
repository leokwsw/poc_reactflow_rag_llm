import { Body, Controller, Delete, Get, MethodNotAllowedException, NotFoundException, Param, Post } from '@nestjs/common'

import { deleteToolsByImportId, getToolById, listTools } from '@/app/tools/data'
import { importOpenApiTools, type ImportOpenApiInput } from '@/app/tools/openapi'

@Controller('tools')
export class ToolsController {
  @Get()
  async list() {
    return { tools: await listTools() }
  }

  @Post()
  create() {
    throw new MethodNotAllowedException('Manual tool creation is disabled. Import an OpenAPI specification instead.')
  }

  @Get(':toolId')
  async get(@Param('toolId') id: string) {
    const tool = await getToolById(id)
    if (!tool) throw new NotFoundException('Tool not found.')
    return { tool }
  }

  @Post('openapi-imports')
  async import(@Body() body: ImportOpenApiInput) {
    return importOpenApiTools(body)
  }

  @Delete('openapi-imports/:importId')
  async removeImport(@Param('importId') importId: string) {
    await deleteToolsByImportId(importId)
    return { success: true }
  }
}
