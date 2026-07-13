import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('system')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  getHealth() {
    return {
      status: 'ok',
      service: 'rag-workflow-backend',
      timestamp: new Date().toISOString(),
    }
  }
}
