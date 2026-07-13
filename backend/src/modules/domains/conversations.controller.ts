import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Res } from '@nestjs/common'
import type { Response } from 'express'

import {
  createConversation,
  createConversationMessage,
  deleteConversation,
  getConversationById,
  getConversationHistory,
  listConversationMessages,
  listConversations,
  maybeTitleConversationFromFirstMessage,
  updateConversation,
  updateConversationMessage,
} from '@/app/chat/data'
import type { WorkflowTraceItem } from '@/app/components/workflow/nodes/execution-types'
import { runWorkflow } from '@/app/lib/workflow-runner'
import { getWorkflowById, saveWorkflowRun } from '@/app/workflow/data'

@Controller('conversations')
export class ConversationsController {
  @Get()
  async list() {
    return { conversations: await listConversations() }
  }

  @Post()
  async create(@Body() body: { workflow_id?: string; title?: string }) {
    const conversation = await createConversation({
      workflow_id: body.workflow_id ?? '',
      title: body.title,
    })
    return { conversation, redirect_url: `/chat/${conversation.id}` }
  }

  @Get(':conversationId')
  async get(@Param('conversationId') id: string) {
    const conversation = await getConversationById(id)
    if (!conversation) throw new NotFoundException('Conversation not found.')
    return { conversation }
  }

  @Patch(':conversationId')
  async update(@Param('conversationId') id: string, @Body() body: { title?: string; status?: 'active' | 'archived' }) {
    const conversation = await updateConversation(id, body)
    if (!conversation) throw new NotFoundException('Conversation not found.')
    return { conversation }
  }

  @Delete(':conversationId')
  async remove(@Param('conversationId') id: string) {
    if (!(await deleteConversation(id))) throw new NotFoundException('Conversation not found.')
    return { success: true }
  }

  @Get(':conversationId/messages')
  async messages(@Param('conversationId') id: string) {
    if (!(await getConversationById(id))) throw new NotFoundException('Conversation not found.')
    return { messages: await listConversationMessages(id, { includeRuns: true }) }
  }

  @Post(':conversationId/messages')
  async send(
    @Param('conversationId') conversationId: string,
    @Body() body: { content?: string },
    @Res() response: Response,
  ) {
    response.set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    })
    response.flushHeaders()
    const emit = (event: string, data: unknown) => response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    let assistantMessageId = ''
    let latestTrace: WorkflowTraceItem[] = []
    const query = body.content?.trim() ?? ''
    const startedAt = new Date().toISOString()
    try {
      const conversation = await getConversationById(conversationId)
      if (!conversation) throw new NotFoundException('Conversation not found.')
      const workflow = await getWorkflowById(conversation.workflow_id)
      if (!workflow) throw new NotFoundException('Workflow not found.')
      if (!query) throw new Error('Message content is required.')
      const history = await getConversationHistory(conversationId)
      const userMessage = await createConversationMessage({ conversation_id: conversationId, role: 'user', content: query })
      await maybeTitleConversationFromFirstMessage(conversationId, query)
      const assistantMessage = await createConversationMessage({
        conversation_id: conversationId,
        role: 'assistant',
        content: '',
        status: 'pending',
        metadata: { events: [] },
      })
      assistantMessageId = assistantMessage.id
      emit('chat_messages_created', { success: true, user_message: userMessage, assistant_message: assistantMessage })
      emit('workflow_started', { success: true })
      const result = await runWorkflow(
        workflow.graph,
        { query, files: [], conversation_history: history },
        {
          onEvent: event => {
            if ('traceItem' in event) {
              const index = latestTrace.findIndex(item => item.nodeId === event.traceItem.nodeId)
              latestTrace = index >= 0
                ? latestTrace.map((item, i) => i === index ? event.traceItem : item)
                : [...latestTrace, event.traceItem]
            }
            emit(event.type, event.type === 'workflow_completed'
              ? { success: true, result: event.result }
              : { success: true, ...event })
          },
        },
      )
      const run = await saveWorkflowRun({
        workflow_id: workflow.id,
        status: 'completed',
        query,
        input: { query, conversation_id: conversationId, conversation_history: history, files: [] },
        result: result as unknown as Record<string, unknown>,
        trace: result.trace,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
      })
      const assistant = await updateConversationMessage(assistantMessage.id, {
        content: result.output || 'Workflow completed without a final answer.',
        status: 'completed',
        workflow_run_id: run.id,
        metadata: { output: result.output, outputs: result.outputs, trace_count: result.trace.length },
      })
      emit('chat_message_completed', { success: true, assistant_message: { ...assistant, workflow_run: run } })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Workflow execution failed.'
      if (assistantMessageId) {
        await updateConversationMessage(assistantMessageId, {
          content: message,
          status: 'failed',
          metadata: { error: message },
        }).catch(() => undefined)
      }
      emit('workflow_error', { success: false, error: message, assistant_message_id: assistantMessageId || null })
    } finally {
      response.end()
    }
  }
}
