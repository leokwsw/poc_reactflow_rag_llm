import { Injectable, NotFoundException } from '@nestjs/common'
import { createHash, randomBytes, randomUUID } from 'node:crypto'

import { dbQuery } from '@/app/lib/typeorm-query'
import { getWorkflowById } from '@/app/workflow/data'

@Injectable()
export class WorkflowApiKeysService {
  private readonly schema = this.identifier(process.env.POSTGRES_SCHEMA ?? 'public')
  private readonly table = `${this.schema}."workflow_api_keys"`

  async list(workflowId: string) {
    await this.ensureSchema()
    const { rows } = await dbQuery(
      `SELECT id, workflow_id, name, key_prefix, last_used_at, expires_at, revoked_at, created_at
       FROM ${this.table} WHERE workflow_id=$1 ORDER BY created_at DESC`,
      [workflowId],
    )
    return rows.map(row => ({
      ...row,
      active: !row.revoked_at && (!row.expires_at || new Date(String(row.expires_at)) > new Date()),
    }))
  }

  async create(workflowId: string, input: { name?: string; expires_at?: string | null }) {
    if (!(await getWorkflowById(workflowId))) throw new NotFoundException('Workflow not found.')
    await this.ensureSchema()
    const plainText = `rwf_${randomBytes(32).toString('base64url')}`
    const now = new Date().toISOString()
    const record = {
      id: `workflow-key-${randomUUID()}`,
      workflow_id: workflowId,
      name: input.name?.trim() || 'Workflow API key',
      key_prefix: plainText.slice(0, 12),
      expires_at: input.expires_at ? new Date(input.expires_at).toISOString() : null,
      created_at: now,
    }
    await dbQuery(
      `INSERT INTO ${this.table} (id, workflow_id, name, key_prefix, key_hash, expires_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [record.id, workflowId, record.name, record.key_prefix, this.hash(plainText), record.expires_at, now],
    )
    return { api_key: record, secret: plainText }
  }

  async revoke(workflowId: string, keyId: string) {
    await this.ensureSchema()
    const { rowCount } = await dbQuery(
      `UPDATE ${this.table} SET revoked_at=now() WHERE id=$1 AND workflow_id=$2 AND revoked_at IS NULL`,
      [keyId, workflowId],
    )
    if (!rowCount) throw new NotFoundException('Workflow API key not found.')
    return { success: true }
  }

  async remove(workflowId: string, keyId: string) {
    await this.ensureSchema()
    const { rowCount } = await dbQuery(`DELETE FROM ${this.table} WHERE id=$1 AND workflow_id=$2`, [keyId, workflowId])
    if (!rowCount) throw new NotFoundException('Workflow API key not found.')
    return { success: true }
  }

  async validate(workflowId: string, secret: string) {
    await this.ensureSchema()
    if (!secret.startsWith('rwf_')) return false
    const { rows } = await dbQuery(
      `UPDATE ${this.table} SET last_used_at=now()
       WHERE workflow_id=$1 AND key_hash=$2 AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())
       RETURNING id`,
      [workflowId, this.hash(secret)],
    )
    return Boolean(rows[0])
  }

  private async ensureSchema() {
    await dbQuery(`CREATE SCHEMA IF NOT EXISTS ${this.schema}`)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id text PRIMARY KEY, workflow_id text NOT NULL, name text NOT NULL,
        key_prefix text NOT NULL, key_hash text NOT NULL UNIQUE,
        last_used_at timestamptz, expires_at timestamptz, revoked_at timestamptz,
        created_at timestamptz NOT NULL
      );
      CREATE INDEX IF NOT EXISTS workflow_api_keys_workflow_idx ON ${this.table}(workflow_id, created_at DESC);
    `)
  }

  private hash(value: string) { return createHash('sha256').update(value).digest('hex') }
  private identifier(value: string) {
    const normalized = value.trim() || 'public'
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(normalized)) throw new Error('Invalid PostgreSQL schema.')
    return `"${normalized}"`
  }
}
