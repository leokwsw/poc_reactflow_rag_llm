import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

const capabilities = [
  'ai-models',
  'rag',
  'workflows',
  'datasets',
  'mcp',
  'workflow-conversations',
  'conversation-messages',
  'automations',
  'workflow-api-keys',
] as const

@ApiTags('system')
@Controller('capabilities')
export class CapabilitiesController {
  @Get()
  @ApiOperation({ summary: 'List the backend bounded contexts' })
  listCapabilities() {
    return { capabilities }
  }
}
