import {notFound} from 'next/navigation'
import {backendFetch} from '@/app/lib/backend-api'
import type {WorkflowRecord} from '@/app/types/domain'
import WorkflowApiKeysClient from './workflow-api-keys-client'

export const dynamic = 'force-dynamic'

export default async function WorkflowApiKeysPage({params}: {params: Promise<{workflowId: string}>}) {
  const {workflowId} = await params
  const result = await backendFetch<{workflow: WorkflowRecord}>(`/workflows/${workflowId}`).catch(() => null)
  if (!result) notFound()
  const {api_keys} = await backendFetch<{api_keys: WorkflowApiKey[]}>(`/workflows/${workflowId}/api-keys`)
  return <WorkflowApiKeysClient initialKeys={api_keys} workflow={result.workflow} />
}

export type WorkflowApiKey = {
  id: string; workflow_id: string; name: string; key_prefix: string; active: boolean;
  last_used_at: string | null; expires_at: string | null; revoked_at: string | null; created_at: string;
}
