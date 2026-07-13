'use client'

import Link from 'next/link'
import {useState} from 'react'
import {backendApiUrl} from '@/app/lib/backend-api'
import type {WorkflowRecord} from '@/app/types/domain'
import type {WorkflowApiKey} from './page'

export default function WorkflowApiKeysClient({workflow, initialKeys}: {workflow: WorkflowRecord; initialKeys: WorkflowApiKey[]}) {
  const [keys, setKeys] = useState(initialKeys)
  const [secret, setSecret] = useState('')
  const refresh = async () => {
    const response = await fetch(backendApiUrl(`/workflows/${workflow.id}/api-keys`))
    const payload = await response.json() as {api_keys: WorkflowApiKey[]}
    setKeys(payload.api_keys)
  }
  const create = async (formData: FormData) => {
    const response = await fetch(backendApiUrl(`/workflows/${workflow.id}/api-keys`), {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: formData.get('name'), expires_at: formData.get('expires_at') || null}),
    })
    const payload = await response.json() as {secret?: string}
    setSecret(payload.secret ?? '')
    await refresh()
  }
  const revoke = async (id: string) => {
    await fetch(backendApiUrl(`/workflows/${workflow.id}/api-keys/${id}/revoke`), {method: 'POST'})
    await refresh()
  }
  const remove = async (id: string) => {
    await fetch(backendApiUrl(`/workflows/${workflow.id}/api-keys/${id}`), {method: 'DELETE'})
    await refresh()
  }
  return <div className="min-h-full bg-[#f5f7fb] px-6 py-6"><div className="mx-auto max-w-5xl space-y-5">
    <div><Link className="text-sm text-zinc-500" href="/workflow">Workflows</Link><h1 className="mt-2 text-2xl font-semibold">{workflow.title} API Keys</h1><p className="mt-2 text-sm text-zinc-600">Keys only authorize the published endpoint for this workflow; they are not user login credentials.</p></div>
    {secret ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><strong className="text-sm">新 API Key（只顯示一次）</strong><code className="mt-2 block break-all text-sm">{secret}</code><p className="mt-3 text-xs">POST {backendApiUrl(`/published/workflows/${workflow.id}/run`)}</p></div> : null}
    <form action={create} className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_220px_auto]">
      <input className="rounded-xl border px-3 py-2" name="name" placeholder="Production integration" required />
      <input className="rounded-xl border px-3 py-2" name="expires_at" type="datetime-local" />
      <button className="rounded-xl bg-zinc-900 px-4 py-2 text-white">Create Key</button>
    </form>
    <div className="overflow-hidden rounded-2xl border bg-white"><table className="w-full text-left text-sm"><thead className="bg-zinc-50"><tr><th className="p-3">Name</th><th>Prefix</th><th>Status</th><th>Last used</th><th></th></tr></thead><tbody>{keys.map(key => <tr className="border-t" key={key.id}><td className="p-3 font-medium">{key.name}</td><td><code>{key.key_prefix}…</code></td><td>{key.active ? 'Active' : 'Inactive'}</td><td>{key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}</td><td className="space-x-2 text-right pr-3"><button className="text-amber-700" disabled={!key.active} onClick={() => void revoke(key.id)}>Revoke</button><button className="text-red-700" onClick={() => void remove(key.id)}>Delete</button></td></tr>)}</tbody></table></div>
  </div></div>
}
