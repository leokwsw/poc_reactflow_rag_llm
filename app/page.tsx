"use client";

import {useCallback, useState} from "react";
import type {Node} from "reactflow";
import Workflow from "@/app/components/workflow";
import {defaultData} from "@/app/components/workflow/default-data";
import type {WorkflowDataType} from "@/app/components/workflow/types";

type WorkflowRunResponse = {
  success: boolean;
  result?: {
    output: string;
    outputs: Record<string, unknown>;
    trace: Array<{
      nodeId: string;
      nodeType: string;
      status: string;
      detail?: string;
      node: Node;
    }>;
  };
  error?: string;
};

type StartVariable = {
  name?: string;
  required?: boolean;
  type?: string;
};

type StartNodeData = {
  type?: string;
  variables?: StartVariable[];
};

type LlmNodeData = {
  type?: string;
  apiBaseUrl?: string;
  apiKey?: string;
  provider?: string;
  model?: string;
  systemPrompt?: string;
};

type IfElseCase = {
  id: string;
  label: string;
  conditions?: string[];
};

type IfElseNodeData = {
  type?: string;
  label?: string;
  cases?: IfElseCase[];
};

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeDataPatch, setNodeDataPatch] = useState<{
    id: string;
    data: Record<string, unknown>;
    nonce: number;
  } | null>(null);

  const patchSelectedNodeData = useCallback(
    (nextData: Record<string, unknown>) => {
      if (!selectedNode) return;
      setSelectedNode({
        ...selectedNode,
        data: {
          ...selectedNode.data,
          ...nextData,
        },
      });
      setNodeDataPatch({
        id: selectedNode.id,
        data: nextData,
        nonce: Date.now(),
      });
    },
    [selectedNode],
  );

  const [data, setData] = useState(defaultData);
  const [runQuery, setRunQuery] = useState("Hello, introduce yourself in one short sentence.");
  const [runFiles, setRunFiles] = useState<File[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<WorkflowRunResponse["result"] | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const handleWorkflowDataChange = useCallback((next: WorkflowDataType) => {
    setData(next);
  }, []);

  const startNode = data.nodes.find((node) => node.data?.type === "start");
  const startVariables = ((startNode?.data as StartNodeData | undefined)?.variables ?? []);
  const selectedStartData = (selectedNode?.data as StartNodeData | undefined) ?? {};
  const selectedLlmData = (selectedNode?.data as LlmNodeData | undefined) ?? {};
  const selectedIfElseData = (selectedNode?.data as IfElseNodeData | undefined) ?? {};

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setRunError(null);
    setRunResult(null);

    try {
      const formData = new FormData();
      formData.append("workflow", JSON.stringify(data));
      formData.append("query", runQuery);
      runFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/workflow/run", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as WorkflowRunResponse;

      if (!response.ok || !payload.success || !payload.result) {
        throw new Error(payload.error ?? "Workflow execution failed.");
      }

      setRunResult(payload.result);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Workflow execution failed.");
    } finally {
      setIsRunning(false);
    }
  }, [data, runFiles, runQuery]);

  return (
    <div className="flex h-screen w-full">
      <div className="min-w-0 flex-1">
        <Workflow
          initData={data}
          onNodeSelect={setSelectedNode}
          nodeDataPatch={nodeDataPatch}
          onDataChange={handleWorkflowDataChange}
        />
      </div>
      <aside className="w-96 overflow-y-auto border-l border-zinc-200 bg-white p-4">
        <section className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Run Workflow</h2>
              <p className="text-xs text-zinc-500">Send current `data` JSON to the backend runner.</p>
            </div>
            <button
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? "Running..." : "Play"}
            </button>
          </div>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs text-zinc-600">
              User Input
              {startVariables[0]?.name ? ` (${startVariables[0].name})` : ""}
            </span>
            <textarea
              className="min-h-28 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              value={runQuery}
              onChange={(event) => setRunQuery(event.target.value)}
              placeholder="Type the start node input here..."
            />
          </label>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs text-zinc-600">
              Uploaded Files
              {startVariables[1]?.name ? ` (${startVariables[1].name})` : ""}
            </span>
            <input
              className="block w-full text-sm text-zinc-600"
              type="file"
              multiple
              onChange={(event) => setRunFiles(Array.from(event.target.files ?? []))}
            />
          </label>

          {runFiles.length > 0 && (
            <div className="mb-3 rounded-lg border border-zinc-200 bg-white p-3">
              <p className="mb-2 text-xs font-medium text-zinc-700">Selected files</p>
              <div className="space-y-1">
                {runFiles.map((file) => (
                  <div key={`${file.name}-${file.lastModified}`} className="text-xs text-zinc-500">
                    {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)
                  </div>
                ))}
              </div>
            </div>
          )}

          {runError && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {runError}
            </div>
          )}

          {runResult && (
            <div className="space-y-3">
              <div className="rounded-lg border border-zinc-200 bg-white p-3">
                <p className="mb-1 text-xs font-medium text-zinc-700">Final Output</p>
                <pre className="whitespace-pre-wrap break-words text-sm text-zinc-800">
                  {runResult.output}
                </pre>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-3">
                <p className="mb-1 text-xs font-medium text-zinc-700">Trace</p>
                <div className="space-y-1">
                  {runResult.trace.map((item) => (
                    <div key={`${item.nodeId}-${item.status}`} className="text-xs text-zinc-500">
                      {item.nodeType} ({item.nodeId}) - {item.status}
                      {item.detail ? ` - ${item.detail}` : ""}
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-semibold text-zinc-900">Trace JSON</h3>
                  <pre className="max-h-96 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100">
                    {JSON.stringify(runResult.trace, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </section>

        <h2 className="mb-3 text-base font-semibold text-zinc-900">Node Settings</h2>

        {!selectedNode && <p className="text-sm text-zinc-500">Select a node to configure.</p>}

        {selectedNode?.data.type === "start" && (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Query Variable</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={selectedStartData.variables?.[0]?.name ?? "query"}
                onChange={(event) => {
                  const variables = [...(selectedStartData.variables ?? [])];
                  variables[0] = {
                    ...(variables[0] ?? {}),
                    name: event.target.value,
                    required: true,
                    type: variables[0]?.type ?? "string",
                  };
                  patchSelectedNodeData({variables});
                }}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Files Variable</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={selectedStartData.variables?.[1]?.name ?? "files"}
                onChange={(event) => {
                  const variables = [...(selectedStartData.variables ?? [])];
                  variables[1] = {
                    ...(variables[1] ?? {}),
                    name: event.target.value,
                    type: variables[1]?.type ?? "file[]",
                  };
                  patchSelectedNodeData({variables});
                }}
              />
            </label>
          </div>
        )}

        {selectedNode?.data.type === "llm" && (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">API Base URL</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={selectedLlmData.apiBaseUrl ?? "https://api.openai.com/v1"}
                onChange={(event) => patchSelectedNodeData({apiBaseUrl: event.target.value})}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">API Key</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                type="password"
                value={selectedLlmData.apiKey ?? ""}
                onChange={(event) => patchSelectedNodeData({apiKey: event.target.value})}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Provider</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={selectedLlmData.provider ?? ""}
                onChange={(event) => patchSelectedNodeData({provider: event.target.value})}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Model</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={selectedLlmData.model ?? ""}
                onChange={(event) => patchSelectedNodeData({model: event.target.value})}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">System Prompt</span>
              <textarea
                className="min-h-28 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={selectedLlmData.systemPrompt ?? ""}
                onChange={(event) => patchSelectedNodeData({systemPrompt: event.target.value})}
              />
            </label>
          </div>
        )}

        {selectedNode?.data.type === "ifElse" && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Label</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={selectedIfElseData.label ?? "If / Else"}
                onChange={(event) => patchSelectedNodeData({label: event.target.value})}
              />
            </label>

            <div className="space-y-3">
              {(selectedIfElseData.cases ?? []).map((caseItem, index) => (
                <div key={caseItem.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-zinc-700">
                      {index === 0 ? "IF Case" : `ELSE IF ${index}`}
                    </p>
                    <button
                      className="text-xs text-red-600 hover:text-red-700"
                      onClick={() => {
                        const cases = (selectedIfElseData.cases ?? []).filter((item) => item.id !== caseItem.id);
                        patchSelectedNodeData({cases});
                      }}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>

                  <label className="mb-2 block">
                    <span className="mb-1 block text-xs text-zinc-600">Branch Label</span>
                    <input
                      className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                      value={caseItem.label}
                      onChange={(event) => {
                        const cases = (selectedIfElseData.cases ?? []).map((item) =>
                          item.id === caseItem.id
                            ? {
                              ...item,
                              label: event.target.value,
                            }
                            : item,
                        );
                        patchSelectedNodeData({cases});
                      }}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs text-zinc-600">Condition</span>
                    <input
                      className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                      value={caseItem.conditions?.[0] ?? ""}
                      placeholder="query contains 'help'"
                      onChange={(event) => {
                        const cases = (selectedIfElseData.cases ?? []).map((item) =>
                          item.id === caseItem.id
                            ? {
                              ...item,
                              conditions: [event.target.value],
                            }
                            : item,
                        );
                        patchSelectedNodeData({cases});
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>

            <button
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              onClick={() => {
                const cases = [...(selectedIfElseData.cases ?? [])];
                const nextIndex = cases.length;
                cases.push({
                  id: `elif-${Date.now()}`,
                  label: `ELSE IF ${nextIndex}`,
                  conditions: [""],
                });
                patchSelectedNodeData({cases});
              }}
              type="button"
            >
              Add Else If Case
            </button>
          </div>
        )}

        {selectedNode && !["start", "llm", "ifElse"].includes(selectedNode.data.type ?? "") && (
          <p className="text-sm text-zinc-500">No configurable fields for this node type yet.</p>
        )}

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-zinc-900">Current Workflow JSON</h3>
          <pre className="max-h-96 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </aside>
    </div>
  );
}
