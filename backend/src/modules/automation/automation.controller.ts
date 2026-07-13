import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common'

import { AutomationService } from './automation.service'

@Controller('automations')
export class AutomationController {
  constructor(private readonly service: AutomationService) {}
  @Get() async list() { return { automations: await this.service.list() } }
  @Post() create(@Body() body: Record<string, unknown>) { return this.service.create(body) }
  @Get(':id') async get(@Param('id') id: string) { return { automation: await this.service.get(id) } }
  @Patch(':id') update(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.service.update(id, body) }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id) }
  @Post(':id/run') run(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.service.execute(id, body) }
  @Get(':id/runs') async runs(@Param('id') id: string) { return { runs: await this.service.listRuns(id) } }
  @Post(':id/webhook') webhook(
    @Param('id') id: string,
    @Headers('x-automation-secret') secret: string,
    @Body() body: Record<string, unknown>,
  ) { return this.service.executeWebhook(id, secret ?? '', body) }
}
