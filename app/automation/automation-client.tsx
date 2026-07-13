'use client'

import {useState} from 'react'
import {backendApiUrl} from '@/app/lib/backend-api'
import type {WorkflowRecord} from '@/app/types/domain'
import type {AutomationRecord} from './page'

export default function AutomationClient({initialAutomations, workflows}: {
  initialAutomations: AutomationRecord[]
  workflows: WorkflowRecord[]
}) {
  const [automations, setAutomations] = useState(initialAutomations)
  const [message, setMessage] = useState('')
  const [secret, setSecret] = useState('')

  const refresh = async () => {
    const response = await fetch(backendApiUrl('/automations'))
    const payload = await response.json() as {automations: AutomationRecord[]}
    setAutomations(payload.automations)
  }
  const create = async (formData: FormData) => {
    const response = await fetch(backendApiUrl('/automations'), {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        name: formData.get('name'), workflow_id: formData.get('workflow_id'),
        trigger_type: formData.get('trigger_type'), interval_seconds: Number(formData.get('interval_seconds')),
        input: {query: String(formData.get('query') ?? '')},
      }),
    })
    const payload = await response.json() as {webhook_secret?: string; message?: string}
    if (!response.ok) return setMessage(payload.message ?? 'Could not create automation.')
    setSecret(payload.webhook_secret ?? '')
    setMessage('Automation created.')
    await refresh()
  }
  const run = async (id: string) => {
    setMessage('Running automation...')
    const response = await fetch(backendApiUrl(`/automations/${id}/run`), {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{}',
    })
    const payload = await response.json() as {run_id?: string; message?: string}
    setMessage(response.ok ? `Completed run ${payload.run_id}` : payload.message ?? 'Automation failed.')
  }
  const remove = async (id: string) => {
    await fetch(backendApiUrl(`/automations/${id}`), {method: 'DELETE'})
    await refresh()
  }

  return <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
    <div className="mx-auto max-w-6xl space-y-5">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Automation</p><h1 className="text-2xl font-semibold">Workflow Automations</h1></div>
      {message ? <p className="rounded-xl border bg-white p-3 text-sm">{message}</p> : null}
      {secret ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><strong>Webhook secret（只顯示一次）</strong><code className="mt-2 block break-all">{secret}</code></div> : null}
      <form action={create} className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-5">
        <input className="rounded-xl border px-3 py-2" name="name" placeholder="Automation name" required />
        <select className="rounded-xl border px-3 py-2" name="workflow_id" required>{workflows.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        <select className="rounded-xl border px-3 py-2" name="trigger_type"><option value="manual">Manual</option><option value="webhook">Webhook</option><option value="interval">Interval</option></select>
        <input className="rounded-xl border px-3 py-2" min="30" name="interval_seconds" type="number" defaultValue="300" />
        <button className="rounded-xl bg-zinc-900 px-4 py-2 text-white">Create</button>
        <input className="rounded-xl border px-3 py-2 md:col-span-5" name="query" placeholder="Default workflow query" />
      </form>
      <div className="grid gap-4 md:grid-cols-2">{automations.map(item => <article className="rounded-2xl border bg-white p-4" key={item.id}>
        <div className="flex justify-between gap-3"><div><h2 className="font-semibold">{item.name}</h2><p className="text-sm text-zinc-500">{item.trigger_type}{item.trigger_type === 'interval' ? ` · ${item.interval_seconds}s` : ''}</p></div><span className="text-xs">{item.enabled ? 'Enabled' : 'Disabled'}</span></div>
        <pre className="mt-4 overflow-auto rounded-xl bg-zinc-950 p-3 text-xs text-white">{JSON.stringify(item.input, null, 2)}</pre>
        <div className="mt-4 flex gap-2"><button className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white" onClick={() => void run(item.id)}>Run</button><button className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700" onClick={() => void remove(item.id)}>Delete</button></div>
      </article>)}</div>
    </div>
  </div>
}
