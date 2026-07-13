import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { AnyFilesInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'

import type { WorkflowDataType } from '@/app/components/workflow/types'
import type { WorkflowTraceItem } from '@/app/components/workflow/nodes/execution-types'
import { runWorkflow } from '@/app/lib/workflow-runner'
import {
  cloneWorkflow,
  createWorkflow,
  deleteWorkflow,
  getWorkflowById,
  listWorkflowRuns,
  listWorkflows,
  saveWorkflowRun,
  updateWorkflowGraph,
} from '@/app/workflow/data'

@Controller('workflows')
export class WorkflowsController {
  @Get()
  async list() {
    return { workflows: await listWorkflows() }
  }

  @Post()
  async create(@Body() body: { title?: string }) {
    const workflow = await createWorkflow(body.title)
    return { workflow, redirect_url: `/workflow/${workflow.id}` }
  }

  @Get(':workflowId')
  async get(@Param('workflowId') workflowId: string) {
    const workflow = await getWorkflowById(workflowId)
    if (!workflow) throw new NotFoundException('Workflow not found.')
    return { workflow }
  }

  @Put(':workflowId')
  async update(
    @Param('workflowId') workflowId: string,
    @Body() body: { graph?: WorkflowDataType; title?: string; description?: string },
  ) {
    if (!body.graph || typeof body.graph !== 'object') {
      throw new BadRequestException('graph is required.')
    }
    const workflow = await updateWorkflowGraph(workflowId, body.graph, body)
    if (!workflow) throw new NotFoundException('Workflow not found.')
    return { workflow }
  }

  @Post(':workflowId/clone')
  async clone(@Param('workflowId') workflowId: string) {
    const workflow = await cloneWorkflow(workflowId)
    if (!workflow) throw new NotFoundException('Workflow not found.')
    return { workflow, redirect_url: `/workflow/${workflow.id}` }
  }

  @Delete(':workflowId')
  async remove(@Param('workflowId') workflowId: string) {
    if (!(await deleteWorkflow(workflowId))) throw new NotFoundException('Workflow not found.')
    return { success: true }
  }

  @Get(':workflowId/runs')
  async runs(@Param('workflowId') workflowId: string, @Query('limit') rawLimit?: string) {
    const limit = Math.min(100, Math.max(1, Number(rawLimit) || 20))
    return { runs: await listWorkflowRuns(workflowId, limit) }
  }

  @Post(':workflowId/run')
  @UseInterceptors(AnyFilesInterceptor())
  async run(
    @Param('workflowId') workflowId: string,
    @Body() body: Record<string, string>,
    @UploadedFiles() files: Express.Multer.File[],
    @Res() response: Response,
  ) {
    response.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    })
    response.flushHeaders()
    const send = (event: string, data: unknown) => {
      response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    let startedAt = new Date().toISOString()
    let latestTrace: WorkflowTraceItem[] = []
    const query = body.query ?? ''
    let runInput: Record<string, unknown> = {}
    try {
      const stored = await getWorkflowById(workflowId)
      if (!stored) throw new NotFoundException('Workflow not found.')
      const graph = body.workflow ? JSON.parse(body.workflow) as WorkflowDataType : stored.graph
      await updateWorkflowGraph(workflowId, graph)
      const conversationHistory = this.parseHistory(body.conversation_history)
      const workflowFiles = (files ?? []).map(file => ({
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        text: this.isTextLike(file) ? file.buffer.toString('utf8') : undefined,
      }))
      startedAt = new Date().toISOString()
      runInput = {
        query,
        conversation_history: conversationHistory,
        files: workflowFiles.map(({ name, type, size }) => ({ name, type, size })),
      }
      send('workflow_started', { success: true })
      const result = await runWorkflow(
        graph,
        { query, files: workflowFiles, conversation_history: conversationHistory },
        {
          onEvent: event => {
            if ('traceItem' in event) {
              const index = latestTrace.findIndex(item => item.nodeId === event.traceItem.nodeId)
              latestTrace = index >= 0
                ? latestTrace.map((item, i) => i === index ? event.traceItem : item)
                : [...latestTrace, event.traceItem]
            }
            send(event.type, event.type === 'workflow_completed'
              ? { success: true, result: event.result }
              : { success: true, ...event })
          },
        },
      )
      await saveWorkflowRun({
        workflow_id: workflowId,
        status: 'completed',
        query,
        input: runInput,
        result: result as unknown as Record<string, unknown>,
        trace: result.trace,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Workflow execution failed.'
      await saveWorkflowRun({
        workflow_id: workflowId,
        status: 'failed',
        query,
        input: runInput,
        trace: latestTrace,
        error: message,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
      }).catch(() => undefined)
      send('workflow_error', { success: false, error: message })
    } finally {
      response.end()
    }
  }

  private parseHistory(raw?: string): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    if (!raw?.trim()) return []
    try {
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) return []
      return parsed
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map(item => ({
          role: (item.role === 'assistant' || item.role === 'system' ? item.role : 'user') as 'user' | 'assistant' | 'system',
          content: String(item.content ?? ''),
        }))
        .filter(item => item.content.trim())
    } catch {
      return []
    }
  }

  private isTextLike(file: Express.Multer.File) {
    return file.mimetype.startsWith('text/') ||
      /\.(md|mdx|txt|json|csv|tsv|js|ts|jsx|tsx|py|java|go|rs|swift|yaml|yml|xml|html|css)$/i.test(file.originalname)
  }
}
