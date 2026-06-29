"use client";

import {useMemo, useState} from "react";
import type {ToolRecord} from "@/app/tools/data";

type AuthMethod = "none" | "header" | "query";
type HeaderAuthType = "basic" | "bearer" | "custom";

const fieldClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";

const textAreaClass =
  "min-h-80 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs leading-5 text-zinc-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";

const authSummary = (tool: ToolRecord) => {
  if (tool.auth_type === "basic") return "Header Basic";
  if (tool.auth_type === "bearer") return "Header Bearer";
  const customHeader = tool.headers.find((row) => row.name && row.name.toLowerCase() !== "content-type");
  if (customHeader) return `Header ${customHeader.name}`;
  const authParam = tool.params.find((row) => row.value && !row.value.includes("{{#arg."));
  if (authParam) return `Query ${authParam.name}`;
  return "None";
};

export default function ToolsClient({initialTools}: {initialTools: ToolRecord[]}) {
  const [tools, setTools] = useState<ToolRecord[]>(initialTools);
  const [name, setName] = useState("");
  const [specText, setSpecText] = useState("");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("none");
  const [headerAuthType, setHeaderAuthType] = useState<HeaderAuthType>("bearer");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [customHeaderName, setCustomHeaderName] = useState("");
  const [customHeaderValue, setCustomHeaderValue] = useState("");
  const [queryName, setQueryName] = useState("");
  const [queryValue, setQueryValue] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [editingImportId, setEditingImportId] = useState("");

  const importGroups = useMemo(() => {
    const groups = new Map<string, ToolRecord[]>();
    for (const tool of tools) {
      const key = tool.openapi_import_id || "manual";
      groups.set(key, [...(groups.get(key) ?? []), tool]);
    }
    return Array.from(groups.entries()).map(([importId, groupTools]) => ({
      importId,
      isOpenApiGroup: groupTools.some((tool) => tool.openapi_import_id),
      tools: groupTools.sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [tools]);

  const refreshTools = async () => {
    const response = await fetch("/api/tools");
    const payload = (await response.json()) as {tools?: ToolRecord[]};
    setTools(payload.tools ?? []);
  };

  const validateImport = () => {
    if (!name.trim()) return "Name is required.";
    if (!specText.trim()) return "OpenAPI Swagger JSON/YAML is required.";
    if (authMethod === "header" && headerAuthType === "basic" && !username.trim()) return "Basic username is required.";
    if (authMethod === "header" && headerAuthType === "bearer" && !token.trim()) return "Bearer token is required.";
    if (authMethod === "header" && headerAuthType === "custom" && !customHeaderName.trim()) return "Custom header name is required.";
    if (authMethod === "header" && headerAuthType === "custom" && !customHeaderValue.trim()) return "Custom header value is required.";
    if (authMethod === "query" && !queryName.trim()) return "Query auth name is required.";
    if (authMethod === "query" && !queryValue.trim()) return "Query auth value is required.";
    return "";
  };

  const importOpenApi = async () => {
    const validationError = validateImport();
    if (validationError) {
      setError(validationError);
      setStatus("");
      return;
    }

    setStatus("Importing OpenAPI...");
    setError("");
    try {
      const response = await fetch("/api/tools/import-openapi", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          name: name.trim(),
          import_id: editingImportId || undefined,
          replace: Boolean(editingImportId),
          spec_text: specText.trim(),
          auth_method: authMethod,
          header_auth_type: authMethod === "header" ? headerAuthType : undefined,
          auth_username: authMethod === "header" && headerAuthType === "basic" ? username : "",
          auth_password: authMethod === "header" && headerAuthType === "basic" ? password : "",
          auth_token: authMethod === "header" && headerAuthType === "bearer" ? token : "",
          auth_header_name: authMethod === "header" && headerAuthType === "custom" ? customHeaderName : "",
          auth_header_value: authMethod === "header" && headerAuthType === "custom" ? customHeaderValue : "",
          query_auth_name: authMethod === "query" ? queryName : "",
          query_auth_value: authMethod === "query" ? queryValue : "",
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {count?: number; error?: string};
      if (!response.ok) throw new Error(result.error ?? `Import failed with status ${response.status}.`);
      await refreshTools();
      setStatus(`${editingImportId ? "Updated" : "Imported"} ${result.count ?? 0} tools`);
      setEditingImportId("");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "OpenAPI import failed.");
      setStatus("");
    }
  };

  const startUpdate = (importId: string) => {
    setEditingImportId(importId);
    setName(importId);
    setSpecText("");
    setStatus(`Update ${importId}: paste the latest OpenAPI Swagger JSON/YAML.`);
    setError("");
  };

  const cancelUpdate = () => {
    setEditingImportId("");
    setName("");
    setSpecText("");
    setStatus("");
    setError("");
  };

  const deleteImportGroup = async (importId: string) => {
    if (!window.confirm(`Delete all tools in ${importId}?`)) return;
    setStatus(`Deleting ${importId}...`);
    setError("");
    try {
      const response = await fetch("/api/tools/import-openapi", {
        method: "DELETE",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({import_id: importId}),
      });
      const result = (await response.json().catch(() => ({}))) as {error?: string};
      if (!response.ok) throw new Error(result.error ?? `Delete failed with status ${response.status}.`);
      await refreshTools();
      if (editingImportId === importId) cancelUpdate();
      setStatus(`Deleted ${importId}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Delete failed.");
      setStatus("");
    }
  };

  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(360px,460px)_minmax(0,1fr)] gap-5">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Tools</p>
            <h1 className="text-xl font-semibold text-zinc-950">{editingImportId ? "Update OpenAPI Swagger" : "Import OpenAPI Swagger"}</h1>
            {status ? <p className="mt-1 text-sm text-zinc-500">{status}</p> : null}
            {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
          </div>

          <div className="mt-5 grid gap-4">
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Name</span>
              <input
                className={fieldClass}
                disabled={Boolean(editingImportId)}
                placeholder="Internal API"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label>
              <span className="mb-1.5 block text-xs font-semibold text-zinc-500">OpenAPI Swagger JSON/YAML</span>
              <textarea
                className={textAreaClass}
                placeholder="openapi: 3.0.0&#10;info:&#10;  title: Internal API&#10;paths:"
                value={specText}
                onChange={(event) => setSpecText(event.target.value)}
              />
            </label>

            <div className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Auth Method</span>
                <select className={fieldClass} value={authMethod} onChange={(event) => setAuthMethod(event.target.value as AuthMethod)}>
                  <option value="none">None</option>
                  <option value="header">Header</option>
                  <option value="query">Query</option>
                </select>
              </label>

              {authMethod === "header" ? (
                <>
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold text-zinc-500">Header Auth</span>
                    <select className={fieldClass} value={headerAuthType} onChange={(event) => setHeaderAuthType(event.target.value as HeaderAuthType)}>
                      <option value="basic">Basic</option>
                      <option value="bearer">Bearer</option>
                      <option value="custom">Custom</option>
                    </select>
                  </label>
                  {headerAuthType === "basic" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input className={fieldClass} placeholder="Username" value={username} onChange={(event) => setUsername(event.target.value)} />
                      <input className={fieldClass} placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                    </div>
                  ) : null}
                  {headerAuthType === "bearer" ? (
                    <input className={fieldClass} placeholder="Bearer token or {{#arg.token#}}" value={token} onChange={(event) => setToken(event.target.value)} />
                  ) : null}
                  {headerAuthType === "custom" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input className={fieldClass} placeholder="Header name" value={customHeaderName} onChange={(event) => setCustomHeaderName(event.target.value)} />
                      <input className={fieldClass} placeholder="Header value" value={customHeaderValue} onChange={(event) => setCustomHeaderValue(event.target.value)} />
                    </div>
                  ) : null}
                </>
              ) : null}

              {authMethod === "query" ? (
                <div className="grid grid-cols-2 gap-2">
                  <input className={fieldClass} placeholder="Query name" value={queryName} onChange={(event) => setQueryName(event.target.value)} />
                  <input className={fieldClass} placeholder="Query value" value={queryValue} onChange={(event) => setQueryValue(event.target.value)} />
                </div>
              ) : null}
            </div>

            <button
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
              type="button"
              onClick={() => void importOpenApi()}
            >
              {editingImportId ? "Update APIs" : "Import APIs"}
            </button>
            {editingImportId ? (
              <button
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                type="button"
                onClick={cancelUpdate}
              >
                Cancel Update
              </button>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Generated</p>
              <h2 className="text-xl font-semibold text-zinc-950">OpenAPI Tools</h2>
            </div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">{tools.length} tools</span>
          </div>

          <div className="mt-4 space-y-5">
            {importGroups.length === 0 ? (
              <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-12 text-center text-sm text-zinc-500">
                No OpenAPI tools imported yet.
              </p>
            ) : importGroups.map((group) => (
              <div key={group.importId}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="truncate text-sm font-semibold text-zinc-900">{group.importId}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{group.tools.length} APIs</span>
                    {group.isOpenApiGroup ? (
                      <>
                        <button
                          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
                          type="button"
                          onClick={() => startUpdate(group.importId)}
                        >
                          Update
                        </button>
                        <button
                          className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                          type="button"
                          onClick={() => void deleteImportGroup(group.importId)}
                        >
                          Delete Group
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-zinc-200">
                  <table className="w-full table-fixed text-left text-sm">
                    <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                      <tr>
                        <th className="w-24 px-3 py-2">Method</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Path</th>
                        <th className="w-32 px-3 py-2">Auth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {group.tools.map((tool) => (
                        <tr key={tool.id}>
                          <td className="px-3 py-2 font-mono text-xs font-semibold text-zinc-700">{tool.method}</td>
                          <td className="truncate px-3 py-2 text-zinc-900">{tool.name}</td>
                          <td className="truncate px-3 py-2 font-mono text-xs text-zinc-600">{tool.path}</td>
                          <td className="truncate px-3 py-2 text-xs text-zinc-500">{authSummary(tool)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
