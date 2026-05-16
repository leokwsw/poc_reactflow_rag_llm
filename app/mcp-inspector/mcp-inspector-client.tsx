"use client";

import {useMemo, useState} from "react";
import type {McpTool} from "@/app/mcp/data";

type InspectorResponse = {
  tools?: McpTool[];
  result?: unknown;
  error?: string;
};

const parseJsonObject = (value: string, label: string) => {
  if (!value.trim()) return {};

  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }

  return parsed as Record<string, unknown>;
};

const sampleValueFromSchema = (schema: unknown): unknown => {
  if (!schema || typeof schema !== "object") return "";

  const record = schema as Record<string, unknown>;
  const type = record.type;
  if (type === "string") return "";
  if (type === "number" || type === "integer") return 0;
  if (type === "boolean") return false;
  if (type === "array") return [];

  if (type === "object" && record.properties && typeof record.properties === "object") {
    return Object.fromEntries(
      Object.entries(record.properties as Record<string, unknown>).map(([key, propertySchema]) => [
        key,
        sampleValueFromSchema(propertySchema),
      ]),
    );
  }

  return "";
};

const buildArgumentTemplate = (tool?: McpTool) => {
  const sample = sampleValueFromSchema(tool?.inputSchema);
  return JSON.stringify(sample && typeof sample === "object" && !Array.isArray(sample) ? sample : {}, null, 2);
};

export default function McpInspectorClient() {
  const [serverUrl, setServerUrl] = useState("");
  const [headersText, setHeadersText] = useState("{}");
  const [tools, setTools] = useState<McpTool[]>([]);
  const [selectedToolName, setSelectedToolName] = useState("");
  const [argumentsText, setArgumentsText] = useState("{}");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  const selectedTool = useMemo(
    () => tools.find((tool) => tool.name === selectedToolName),
    [selectedToolName, tools],
  );

  const requestInspector = async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/mcp/inspect", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({})) as InspectorResponse;
    if (!response.ok) {
      throw new Error(body.error || `Request failed with HTTP ${response.status}.`);
    }
    return body;
  };

  const connect = async () => {
    setError("");
    setResult(null);
    setIsConnecting(true);

    try {
      const headers = parseJsonObject(headersText, "Headers");
      const body = await requestInspector({
        action: "tools/list",
        serverUrl,
        headers,
      });
      const nextTools = body.tools ?? [];
      setTools(nextTools);
      const firstTool = nextTools[0];
      setSelectedToolName(firstTool?.name ?? "");
      setArgumentsText(buildArgumentTemplate(firstTool));
      setResult({tools: nextTools});
    } catch (nextError) {
      setTools([]);
      setSelectedToolName("");
      setError(nextError instanceof Error ? nextError.message : "Could not connect to MCP server.");
    } finally {
      setIsConnecting(false);
    }
  };

  const selectTool = (tool: McpTool) => {
    setSelectedToolName(tool.name);
    setArgumentsText(buildArgumentTemplate(tool));
    setResult(null);
    setError("");
  };

  const callTool = async () => {
    if (!selectedTool) return;

    setError("");
    setResult(null);
    setIsCalling(true);

    try {
      const headers = parseJsonObject(headersText, "Headers");
      const args = parseJsonObject(argumentsText, "Arguments");
      const body = await requestInspector({
        action: "tools/call",
        serverUrl,
        headers,
        toolName: selectedTool.name,
        arguments: args,
      });
      setResult(body.result);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not call MCP tool.");
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">MCP Inspector</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950">測試 MCP 伺服器</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            連接 MCP HTTP 端點，查看可用工具，並用 JSON 參數即時試行工具呼叫。
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                MCP Server URL
              </span>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                onChange={(event) => setServerUrl(event.target.value)}
                placeholder="https://example.com/mcp"
                type="url"
                value={serverUrl}
              />
            </label>

            <div className="flex items-end">
              <button
                className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
                disabled={!serverUrl.trim() || isConnecting}
                onClick={() => void connect()}
                type="button"
              >
                {isConnecting ? "Connecting..." : "Connect & List Tools"}
              </button>
            </div>
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Headers JSON
            </span>
            <textarea
              className="min-h-24 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-xs leading-5 text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              onChange={(event) => setHeadersText(event.target.value)}
              spellCheck={false}
              value={headersText}
            />
          </label>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <section className="grid min-h-[560px] grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_420px]">
          <aside className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-zinc-950">Tools</h2>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">{tools.length}</span>
            </div>

            <div className="mt-4 max-h-[480px] space-y-2 overflow-y-auto pr-1">
              {tools.map((tool) => (
                <button
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    selectedToolName === tool.name
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                  }`}
                  key={tool.name}
                  onClick={() => selectTool(tool)}
                  type="button"
                >
                  <span className="block break-words text-sm font-semibold">{tool.name}</span>
                  {tool.description ? (
                    <span className={`mt-1 line-clamp-2 block text-xs ${selectedToolName === tool.name ? "text-zinc-200" : "text-zinc-500"}`}>
                      {tool.description}
                    </span>
                  ) : null}
                </button>
              ))}
              {!tools.length ? (
                <p className="rounded-xl border border-dashed border-zinc-200 px-3 py-8 text-center text-sm text-zinc-500">
                  Connect to a server to list tools.
                </p>
              ) : null}
            </div>
          </aside>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="break-words text-base font-semibold text-zinc-950">{selectedTool?.name ?? "Select a tool"}</h2>
                {selectedTool?.description ? (
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{selectedTool.description}</p>
                ) : null}
              </div>
            </div>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Arguments JSON
              </span>
              <textarea
                className="min-h-56 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-xs leading-5 text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                disabled={!selectedTool}
                onChange={(event) => setArgumentsText(event.target.value)}
                spellCheck={false}
                value={argumentsText}
              />
            </label>

            <button
              className="mt-4 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
              disabled={!selectedTool || isCalling}
              onClick={() => void callTool()}
              type="button"
            >
              {isCalling ? "Calling..." : "Call Tool"}
            </button>

            <div className="mt-5">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Tool Schema</p>
              <pre className="max-h-80 overflow-auto rounded-xl bg-zinc-950 p-3 text-xs leading-5 text-zinc-100">
                {JSON.stringify(selectedTool?.inputSchema ?? selectedTool ?? {}, null, 2)}
              </pre>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-950">Result</h2>
            <pre className="mt-4 max-h-[520px] overflow-auto rounded-xl bg-zinc-950 p-3 text-xs leading-5 text-zinc-100">
              {JSON.stringify(result ?? {status: "No result yet"}, null, 2)}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
