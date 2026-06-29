"use client";

import {useMemo, useState} from "react";
import type {ToolAuthType, ToolBodyType, ToolKeyValueRow, ToolMethod, ToolRecord} from "@/app/tools/data";

type ToolDraft = Omit<ToolRecord, "created_at" | "updated_at" | "type"> & {
  input_schema_text: string;
};

const METHODS: ToolMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const BODY_TYPES: ToolBodyType[] = ["none", "json", "raw", "x-www-form-urlencoded"];

const newTool = (): ToolDraft => ({
  id: "",
  name: "Untitled Tool",
  description: "",
  method: "GET",
  url: "https://api.example.com",
  base_url: "https://api.example.com",
  path: "",
  headers: [],
  params: [],
  body_type: "none",
  body_json: "",
  body_raw: "",
  input_schema: {type: "object", properties: {}},
  input_schema_text: JSON.stringify({type: "object", properties: {}}, null, 2),
  auth_type: "none",
  auth_username: "",
  auth_password: "",
  auth_token: "",
  openapi_import_id: "",
  openapi_operation_id: "",
  enabled: true,
  skip_ssl_verification: false,
});

const toDraft = (tool: ToolRecord): ToolDraft => ({
  ...tool,
  input_schema_text: JSON.stringify(tool.input_schema ?? {type: "object", properties: {}}, null, 2),
});

const draftToPayload = (draft: ToolDraft) => ({
  name: draft.name,
  description: draft.description,
  method: draft.method,
  url: draft.url,
  base_url: draft.base_url,
  path: draft.path,
  headers: draft.headers,
  params: draft.params,
  body_type: draft.body_type,
  body_json: draft.body_json,
  body_raw: draft.body_raw,
  input_schema: JSON.parse(draft.input_schema_text || "{}") as Record<string, unknown>,
  auth_type: draft.auth_type,
  auth_username: draft.auth_username,
  auth_password: draft.auth_password,
  auth_token: draft.auth_token,
  openapi_import_id: draft.openapi_import_id,
  openapi_operation_id: draft.openapi_operation_id,
  enabled: draft.enabled,
  skip_ssl_verification: draft.skip_ssl_verification,
});

const fieldClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";

const textAreaClass =
  "min-h-32 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs leading-5 text-zinc-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";

function createRow(): ToolKeyValueRow {
  return {id: crypto.randomUUID(), enabled: true, name: "", value: ""};
}

function KeyValueEditor({
  rows,
  onChange,
}: {
  rows: ToolKeyValueRow[];
  onChange: (rows: ToolKeyValueRow[]) => void;
}) {
  const updateRow = (index: number, patch: Partial<ToolKeyValueRow>) => {
    const next = [...rows];
    next[index] = {...next[index], ...patch};
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={row.id || index} className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
          <input
            aria-label="Enabled"
            checked={row.enabled ?? true}
            className="mt-2"
            type="checkbox"
            onChange={(event) => updateRow(index, {enabled: event.target.checked})}
          />
          <input
            className={fieldClass}
            placeholder="Name"
            value={row.name ?? ""}
            onChange={(event) => updateRow(index, {name: event.target.value})}
          />
          <input
            className={fieldClass}
            placeholder="Value, supports {{#arg.name#}}"
            value={row.value ?? ""}
            onChange={(event) => updateRow(index, {value: event.target.value})}
          />
          <button
            className="rounded-lg border border-zinc-200 px-2 text-xs text-zinc-600 transition hover:bg-zinc-50"
            type="button"
            onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        className="w-full rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
        type="button"
        onClick={() => onChange([...rows, createRow()])}
      >
        Add row
      </button>
    </div>
  );
}

export default function ToolsClient({initialTools}: {initialTools: ToolRecord[]}) {
  const [tools, setTools] = useState<ToolRecord[]>(initialTools);
  const [selectedId, setSelectedId] = useState(initialTools[0]?.id ?? "");
  const selectedTool = useMemo(() => tools.find((tool) => tool.id === selectedId), [selectedId, tools]);
  const [draft, setDraft] = useState<ToolDraft>(() => selectedTool ? toDraft(selectedTool) : newTool());
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [importSpecUrl, setImportSpecUrl] = useState("");
  const [importSpecText, setImportSpecText] = useState("");
  const [importBaseUrl, setImportBaseUrl] = useState("");
  const [importAuthType, setImportAuthType] = useState<ToolAuthType>("none");
  const [importUsername, setImportUsername] = useState("");
  const [importPassword, setImportPassword] = useState("");
  const [importToken, setImportToken] = useState("");

  const selectTool = (tool: ToolRecord) => {
    setSelectedId(tool.id);
    setDraft(toDraft(tool));
    setStatus("");
    setError("");
  };

  const refreshTools = async (nextSelectedId?: string) => {
    const response = await fetch("/api/tools");
    const payload = (await response.json()) as {tools?: ToolRecord[]};
    const nextTools = payload.tools ?? [];
    setTools(nextTools);
    if (nextSelectedId) {
      const tool = nextTools.find((item) => item.id === nextSelectedId);
      if (tool) {
        setSelectedId(tool.id);
        setDraft(toDraft(tool));
      }
    }
  };

  const saveTool = async () => {
    setStatus("Saving...");
    setError("");
    try {
      const payload = draftToPayload(draft);
      const isUpdate = Boolean(draft.id);
      const response = await fetch(isUpdate ? `/api/tools/${draft.id}` : "/api/tools", {
        method: isUpdate ? "PUT" : "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as {tool?: ToolRecord; error?: string};
      if (!response.ok || !result.tool) {
        throw new Error(result.error ?? `Save failed with status ${response.status}.`);
      }
      await refreshTools(result.tool.id);
      setStatus("Saved");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Save failed.");
      setStatus("");
    }
  };

  const deleteSelected = async () => {
    if (!draft.id) return;
    setStatus("Deleting...");
    setError("");
    const response = await fetch(`/api/tools/${draft.id}`, {method: "DELETE"});
    if (!response.ok) {
      setError(`Delete failed with status ${response.status}.`);
      setStatus("");
      return;
    }
    const nextTools = tools.filter((tool) => tool.id !== draft.id);
    setTools(nextTools);
    const next = nextTools[0];
    setSelectedId(next?.id ?? "");
    setDraft(next ? toDraft(next) : newTool());
    setStatus("Deleted");
  };

  const importOpenApi = async () => {
    setStatus("Importing OpenAPI...");
    setError("");
    try {
      const spec = importSpecText.trim() ? JSON.parse(importSpecText) as unknown : undefined;
      const response = await fetch("/api/tools/import-openapi", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          spec,
          spec_url: importSpecUrl.trim() || undefined,
          base_url: importBaseUrl.trim() || undefined,
          auth_type: importAuthType,
          auth_username: importUsername,
          auth_password: importPassword,
          auth_token: importToken,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {count?: number; tools?: ToolRecord[]; error?: string};
      if (!response.ok) throw new Error(result.error ?? `Import failed with status ${response.status}.`);
      await refreshTools(result.tools?.[0]?.id);
      setStatus(`Imported ${result.count ?? 0} tools`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "OpenAPI import failed.");
      setStatus("");
    }
  };

  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto grid max-w-7xl grid-cols-[320px_minmax(0,1fr)] gap-5">
        <aside className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Workspace</p>
              <h1 className="text-xl font-semibold text-zinc-950">Tools</h1>
            </div>
            <button
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
              type="button"
              onClick={() => {
                setSelectedId("");
                setDraft(newTool());
                setStatus("");
                setError("");
              }}
            >
              New
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {tools.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-8 text-center text-sm text-zinc-500">
                No tools yet.
              </p>
            ) : tools.map((tool) => (
              <button
                key={tool.id}
                className={`block w-full rounded-lg border px-3 py-2 text-left transition ${
                  selectedId === tool.id ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:bg-zinc-50"
                }`}
                type="button"
                onClick={() => selectTool(tool)}
              >
                <span className="block truncate text-sm font-semibold text-zinc-900">{tool.name}</span>
                <span className="mt-1 block truncate text-xs text-zinc-500">{tool.method} {tool.url}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <h2 className="text-sm font-semibold text-zinc-900">Import OpenAPI</h2>
            <div className="mt-3 space-y-2">
              <input
                className={fieldClass}
                placeholder="Swagger / OpenAPI JSON URL"
                value={importSpecUrl}
                onChange={(event) => setImportSpecUrl(event.target.value)}
              />
              <textarea
                className={`${textAreaClass} min-h-28`}
                placeholder="Or paste OpenAPI JSON"
                value={importSpecText}
                onChange={(event) => setImportSpecText(event.target.value)}
              />
              <input
                className={fieldClass}
                placeholder="Override base URL"
                value={importBaseUrl}
                onChange={(event) => setImportBaseUrl(event.target.value)}
              />
              <select
                className={fieldClass}
                value={importAuthType}
                onChange={(event) => setImportAuthType(event.target.value as ToolAuthType)}
              >
                <option value="none">Auth: None</option>
                <option value="basic">Auth: Basic</option>
                <option value="bearer">Auth: Bearer</option>
              </select>
              {importAuthType === "basic" ? (
                <div className="grid grid-cols-2 gap-2">
                  <input className={fieldClass} placeholder="Username" value={importUsername} onChange={(event) => setImportUsername(event.target.value)} />
                  <input className={fieldClass} placeholder="Password" type="password" value={importPassword} onChange={(event) => setImportPassword(event.target.value)} />
                </div>
              ) : null}
              {importAuthType === "bearer" ? (
                <input className={fieldClass} placeholder="Bearer token or {{#arg.token#}}" value={importToken} onChange={(event) => setImportToken(event.target.value)} />
              ) : null}
              <button
                className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                type="button"
                onClick={() => void importOpenApi()}
              >
                Import APIs
              </button>
            </div>
          </div>
        </aside>

        <main className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Custom HTTP Tool</p>
              <h2 className="text-xl font-semibold text-zinc-950">{draft.id ? draft.name : "New Tool"}</h2>
              {status ? <p className="mt-1 text-sm text-zinc-500">{status}</p> : null}
              {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
            </div>
            <div className="flex gap-2">
              {draft.id ? (
                <button
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  type="button"
                  onClick={() => void deleteSelected()}
                >
                  Delete
                </button>
              ) : null}
              <button
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                type="button"
                onClick={() => void saveTool()}
              >
                Save
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-5">
            <section className="grid grid-cols-2 gap-4">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Name</span>
                <input className={fieldClass} value={draft.name} onChange={(event) => setDraft({...draft, name: event.target.value})} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Enabled</span>
                <div className="flex h-10 items-center rounded-lg border border-zinc-200 px-3">
                  <input
                    checked={draft.enabled}
                    type="checkbox"
                    onChange={(event) => setDraft({...draft, enabled: event.target.checked})}
                  />
                </div>
              </label>
              <label className="col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Description</span>
                <input className={fieldClass} value={draft.description} onChange={(event) => setDraft({...draft, description: event.target.value})} />
              </label>
            </section>

            <section className="grid grid-cols-[140px_minmax(0,1fr)] gap-4">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Method</span>
                <select className={fieldClass} value={draft.method} onChange={(event) => setDraft({...draft, method: event.target.value as ToolMethod})}>
                  {METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-500">URL</span>
                <input className={fieldClass} value={draft.url} onChange={(event) => setDraft({...draft, url: event.target.value})} />
              </label>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Base URL</span>
                <input className={fieldClass} value={draft.base_url} onChange={(event) => setDraft({...draft, base_url: event.target.value})} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-500">OpenAPI Path</span>
                <input className={fieldClass} value={draft.path} onChange={(event) => setDraft({...draft, path: event.target.value})} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Operation ID</span>
                <input className={fieldClass} value={draft.openapi_operation_id} onChange={(event) => setDraft({...draft, openapi_operation_id: event.target.value})} />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Import ID</span>
                <input className={fieldClass} value={draft.openapi_import_id} onChange={(event) => setDraft({...draft, openapi_import_id: event.target.value})} />
              </label>
            </section>

            <section className="grid gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold text-zinc-800">Authentication</h3>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Auth Type</span>
                <select className={fieldClass} value={draft.auth_type} onChange={(event) => setDraft({...draft, auth_type: event.target.value as ToolAuthType})}>
                  <option value="none">None</option>
                  <option value="basic">Basic</option>
                  <option value="bearer">Bearer</option>
                </select>
              </label>
              {draft.auth_type === "basic" ? (
                <div className="grid grid-cols-2 gap-4">
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Username</span>
                    <input className={fieldClass} value={draft.auth_username} onChange={(event) => setDraft({...draft, auth_username: event.target.value})} />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Password</span>
                    <input className={fieldClass} type="password" value={draft.auth_password} onChange={(event) => setDraft({...draft, auth_password: event.target.value})} />
                  </label>
                </div>
              ) : null}
              {draft.auth_type === "bearer" ? (
                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Bearer Token</span>
                  <input className={fieldClass} value={draft.auth_token} onChange={(event) => setDraft({...draft, auth_token: event.target.value})} />
                </label>
              ) : null}
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-zinc-800">Headers</h3>
                <KeyValueEditor rows={draft.headers} onChange={(headers) => setDraft({...draft, headers})} />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-zinc-800">Params</h3>
                <KeyValueEditor rows={draft.params} onChange={(params) => setDraft({...draft, params})} />
              </div>
            </section>

            <section className="grid gap-4">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Body Type</span>
                <select className={fieldClass} value={draft.body_type} onChange={(event) => setDraft({...draft, body_type: event.target.value as ToolBodyType})}>
                  {BODY_TYPES.map((bodyType) => <option key={bodyType} value={bodyType}>{bodyType}</option>)}
                </select>
              </label>
              {draft.body_type === "json" ? (
                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-zinc-500">JSON Body</span>
                  <textarea className={textAreaClass} value={draft.body_json} onChange={(event) => setDraft({...draft, body_json: event.target.value})} />
                </label>
              ) : null}
              {draft.body_type === "raw" ? (
                <label>
                  <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Raw Body</span>
                  <textarea className={textAreaClass} value={draft.body_raw} onChange={(event) => setDraft({...draft, body_raw: event.target.value})} />
                </label>
              ) : null}
            </section>

            <section>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Input Schema JSON</span>
                <textarea
                  className={textAreaClass}
                  value={draft.input_schema_text}
                  onChange={(event) => setDraft({...draft, input_schema_text: event.target.value})}
                />
              </label>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
