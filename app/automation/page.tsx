import AutomationClient from './automation-client'
import {backendFetch} from '@/app/lib/backend-api'
import type {WorkflowRecord} from '@/app/types/domain'

export const dynamic = 'force-dynamic'

export default async function AutomationPage() {
  const [{workflows}, {automations}] = await Promise.all([
    backendFetch<{workflows: WorkflowRecord[]}>('/workflows'),
    backendFetch<{automations: AutomationRecord[]}>('/automations'),
  ])
  return <AutomationClient initialAutomations={automations} workflows={workflows} />
}

export type AutomationRecord = {
  id: string
  name: string
  workflow_id: string
  trigger_type: 'manual' | 'webhook' | 'interval'
  interval_seconds: number
  enabled: boolean
  input: Record<string, unknown>
  next_run_at: string | null
  created_at: string
  updated_at: string
}
