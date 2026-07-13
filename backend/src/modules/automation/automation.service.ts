import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common'
import { randomBytes, randomUUID, createHash } from 'node:crypto'

import { runWorkflow } from '@/app/lib/workflow-runner'
import { dbQuery } from '@/app/lib/typeorm-query'
import { getWorkflowById, saveWorkflowRun } from '@/app/workflow/data'

type AutomationTrigger = 'manual' | 'webhook' | 'interval'
type AutomationRow = Record<string, unknown>

@Injectable()
export class AutomationService implements OnModuleInit {
  private timer?: NodeJS.Timeout
  private readonly schema = this.identifier(process.env.POSTGRES_SCHEMA ?? 'public')
  private readonly automations = `${this.schema}."automations"`
  private readonly runs = `${this.schema}."automation_runs"`

  async onModuleInit() {
    await this.ensureSchema().catch(() => undefined)
    this.timer = setInterval(() => void this.runDue(), 15_000)
    this.timer.unref()
  }

  async list() {
    await this.ensureSchema()
    const { rows } = await dbQuery(`SELECT * FROM ${this.automations} ORDER BY updated_at DESC`)
    return rows.map(row => this.fromRow(row))
  }

  async get(id: string) {
    await this.ensureSchema()
    const { rows } = await dbQuery(`SELECT * FROM ${this.automations} WHERE id = $1`, [id])
    return rows[0] ? this.fromRow(rows[0]) : undefined
  }

  async create(input: Record<string, unknown>) {
    await this.ensureSchema()
    const workflowId = String(input.workflow_id ?? '')
    if (!(await getWorkflowById(workflowId))) throw new NotFoundException('Workflow not found.')
    const now = new Date()
    const trigger = this.trigger(input.trigger_type)
    const intervalSeconds = Math.max(30, Number(input.interval_seconds) || 300)
    const record = {
      id: `automation-${randomUUID()}`,
      name: String(input.name ?? '').trim() || 'Untitled automation',
      workflow_id: workflowId,
      trigger_type: trigger,
      interval_seconds: intervalSeconds,
      enabled: input.enabled !== false,
      input: this.object(input.input),
      webhook_secret: trigger === 'webhook' ? randomBytes(24).toString('base64url') : '',
      next_run_at: trigger === 'interval' ? new Date(now.getTime() + intervalSeconds * 1000).toISOString() : null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }
    await dbQuery(
      `INSERT INTO ${this.automations}
       (id, name, workflow_id, trigger_type, interval_seconds, enabled, input, webhook_secret_hash, next_run_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [record.id, record.name, record.workflow_id, record.trigger_type, record.interval_seconds, record.enabled,
        JSON.stringify(record.input), this.hash(record.webhook_secret), record.next_run_at, record.created_at, record.updated_at],
    )
    return { automation: { ...record, webhook_secret: undefined }, webhook_secret: record.webhook_secret || undefined }
  }

  async update(id: string, input: Record<string, unknown>) {
    const current = await this.get(id)
    if (!current) throw new NotFoundException('Automation not found.')
    const trigger = this.trigger(input.trigger_type ?? current.trigger_type)
    const interval = Math.max(30, Number(input.interval_seconds ?? current.interval_seconds) || 300)
    const enabled = input.enabled === undefined ? current.enabled : input.enabled !== false
    const nextRun = trigger === 'interval' && enabled
      ? new Date(Date.now() + interval * 1000).toISOString()
      : null
    await dbQuery(
      `UPDATE ${this.automations} SET name=$2, workflow_id=$3, trigger_type=$4, interval_seconds=$5,
       enabled=$6, input=$7, next_run_at=$8, updated_at=$9 WHERE id=$1`,
      [id, String(input.name ?? current.name).trim(), String(input.workflow_id ?? current.workflow_id), trigger,
        interval, enabled, JSON.stringify(this.object(input.input ?? current.input)), nextRun, new Date().toISOString()],
    )
    return { automation: await this.get(id) }
  }

  async remove(id: string) {
    await this.ensureSchema()
    const { rowCount } = await dbQuery(`DELETE FROM ${this.automations} WHERE id=$1`, [id])
    if (!rowCount) throw new NotFoundException('Automation not found.')
    return { success: true }
  }

  async execute(id: string, override: Record<string, unknown> = {}) {
    const automation = await this.get(id)
    if (!automation) throw new NotFoundException('Automation not found.')
    const workflow = await getWorkflowById(automation.workflow_id)
    if (!workflow) throw new NotFoundException('Workflow not found.')
    const startedAt = new Date().toISOString()
    const input = { ...automation.input, ...override }
    const query = String(input.query ?? '')
    const automationRunId = `automation-run-${randomUUID()}`
    await dbQuery(
      `INSERT INTO ${this.runs} (id, automation_id, status, input, started_at) VALUES ($1,$2,'running',$3,$4)`,
      [automationRunId, id, JSON.stringify(input), startedAt],
    )
    try {
      const result = await runWorkflow(workflow.graph, { query, files: [], conversation_history: [] })
      const workflowRun = await saveWorkflowRun({
        workflow_id: workflow.id,
        status: 'completed',
        query,
        input,
        result: result as unknown as Record<string, unknown>,
        trace: result.trace,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
      })
      await dbQuery(
        `UPDATE ${this.runs} SET status='completed', workflow_run_id=$2, result=$3, finished_at=$4 WHERE id=$1`,
        [automationRunId, workflowRun.id, JSON.stringify(result), new Date().toISOString()],
      )
      return { run_id: automationRunId, workflow_run_id: workflowRun.id, result }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Automation execution failed.'
      await dbQuery(
        `UPDATE ${this.runs} SET status='failed', error=$2, finished_at=$3 WHERE id=$1`,
        [automationRunId, message, new Date().toISOString()],
      )
      throw error
    } finally {
      if (automation.trigger_type === 'interval') {
        await dbQuery(`UPDATE ${this.automations} SET next_run_at=$2 WHERE id=$1`, [
          id,
          new Date(Date.now() + automation.interval_seconds * 1000).toISOString(),
        ])
      }
    }
  }

  async executeWebhook(id: string, secret: string, input: Record<string, unknown>) {
    await this.ensureSchema()
    const { rows } = await dbQuery(`SELECT webhook_secret_hash FROM ${this.automations} WHERE id=$1 AND trigger_type='webhook'`, [id])
    if (!rows[0] || String(rows[0].webhook_secret_hash) !== this.hash(secret)) {
      throw new NotFoundException('Automation webhook not found.')
    }
    return this.execute(id, input)
  }

  async listRuns(id: string) {
    await this.ensureSchema()
    const { rows } = await dbQuery(`SELECT * FROM ${this.runs} WHERE automation_id=$1 ORDER BY started_at DESC LIMIT 100`, [id])
    return rows
  }

  private async runDue() {
    try {
      const { rows } = await dbQuery(
        `SELECT id FROM ${this.automations} WHERE enabled=true AND trigger_type='interval' AND next_run_at <= now()`,
      )
      for (const row of rows) await this.execute(String(row.id)).catch(() => undefined)
    } catch {
      // Database can be unavailable during startup; the next interval retries.
    }
  }

  private async ensureSchema() {
    await dbQuery(`CREATE SCHEMA IF NOT EXISTS ${this.schema}`)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS ${this.automations} (
        id text PRIMARY KEY, name text NOT NULL, workflow_id text NOT NULL,
        trigger_type text NOT NULL, interval_seconds integer NOT NULL DEFAULT 300,
        enabled boolean NOT NULL DEFAULT true, input jsonb NOT NULL DEFAULT '{}',
        webhook_secret_hash text NOT NULL DEFAULT '', next_run_at timestamptz,
        created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL
      );
      CREATE TABLE IF NOT EXISTS ${this.runs} (
        id text PRIMARY KEY, automation_id text NOT NULL REFERENCES ${this.automations}(id) ON DELETE CASCADE,
        status text NOT NULL, input jsonb NOT NULL DEFAULT '{}', result jsonb,
        workflow_run_id text, error text, started_at timestamptz NOT NULL, finished_at timestamptz
      );
    `)
  }

  private fromRow(row: AutomationRow) {
    return {
      id: String(row.id), name: String(row.name), workflow_id: String(row.workflow_id),
      trigger_type: this.trigger(row.trigger_type), interval_seconds: Number(row.interval_seconds),
      enabled: Boolean(row.enabled), input: this.object(row.input),
      next_run_at: row.next_run_at ? new Date(String(row.next_run_at)).toISOString() : null,
      created_at: new Date(String(row.created_at)).toISOString(), updated_at: new Date(String(row.updated_at)).toISOString(),
    }
  }

  private trigger(value: unknown): AutomationTrigger {
    return value === 'webhook' || value === 'interval' ? value : 'manual'
  }
  private object(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  }
  private hash(value: string) { return value ? createHash('sha256').update(value).digest('hex') : '' }
  private identifier(value: string) {
    const normalized = value.trim() || 'public'
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(normalized)) throw new Error('Invalid PostgreSQL schema.')
    return `"${normalized}"`
  }
}
