import { Body, Controller, Delete, Get, Headers, Param, Post, Res, UnauthorizedException } from '@nestjs/common'
import type { Response } from 'express'

import { runWorkflow } from '@/app/lib/workflow-runner'
import { getWorkflowById, saveWorkflowRun } from '@/app/workflow/data'

import { WorkflowApiKeysService } from './workflow-api-keys.service'

@Controller()
export class WorkflowApiKeysController {
  constructor(private readonly service: WorkflowApiKeysService) {}

  @Get('workflows/:workflowId/api-keys')
  async list(@Param('workflowId') workflowId: string) {
    return { api_keys: await this.service.list(workflowId) }
  }

  @Post('workflows/:workflowId/api-keys')
  create(@Param('workflowId') workflowId: string, @Body() body: { name?: string; expires_at?: string | null }) {
    return this.service.create(workflowId, body)
  }

  @Post('workflows/:workflowId/api-keys/:keyId/revoke')
  revoke(@Param('workflowId') workflowId: string, @Param('keyId') keyId: string) {
    return this.service.revoke(workflowId, keyId)
  }

  @Delete('workflows/:workflowId/api-keys/:keyId')
  remove(@Param('workflowId') workflowId: string, @Param('keyId') keyId: string) {
    return this.service.remove(workflowId, keyId)
  }

  @Post('published/workflows/:workflowId/run')
  async runPublished(
    @Param('workflowId') workflowId: string,
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-api-key') apiKey: string | undefined,
    @Body() body: { query?: string; inputs?: Record<string, unknown> },
    @Res() response: Response,
  ) {
    const secret = apiKey || (authorization?.startsWith('Bearer ') ? authorization.slice(7) : '')
    if (!(await this.service.validate(workflowId, secret))) throw new UnauthorizedException('Invalid workflow API key.')
    const workflow = await getWorkflowById(workflowId)
    if (!workflow) throw new UnauthorizedException('Invalid workflow API key.')
    const startedAt = new Date().toISOString()
    const query = body.query ?? ''
    const input = { query, ...(body.inputs ?? {}) }
    try {
      const result = await runWorkflow(workflow.graph, { query, files: [], conversation_history: [] })
      const run = await saveWorkflowRun({
        workflow_id: workflowId,
        status: 'completed',
        query,
        input,
        result: result as unknown as Record<string, unknown>,
        trace: result.trace,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
      })
      response.json({ success: true, run_id: run.id, result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Workflow execution failed.'
      const run = await saveWorkflowRun({
        workflow_id: workflowId,
        status: 'failed',
        query,
        input,
        error: message,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
      })
      response.status(500).json({ success: false, run_id: run.id, error: message })
    }
  }
}
