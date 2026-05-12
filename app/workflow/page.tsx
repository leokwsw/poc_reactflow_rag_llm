"use client";

import {useCallback, useRef, useState} from "react";
import Markdown from "../components/markdown";
import {nodeSettingsPanelMap} from "@/app/components/workflow/nodes/panels";
import type {Node} from "reactflow";
import Workflow from "@/app/components/workflow";
import {defaultData} from "@/app/components/workflow/default-data";
import type {WorkflowDataType} from "@/app/components/workflow/types";
import type {WorkflowTraceItem} from "@/app/components/workflow/nodes/execution-types";

type WorkflowRunResponse = {
  success: boolean;
  result?: {
    output: string;
    outputs: Record<string, unknown>;
    trace: WorkflowTraceItem[];
  };
  error?: string;
};

type StartVariable = {
  name?: string;
};

type StartNodeData = {
  variables?: StartVariable[];
};

export default function WorkflowPage() {
  const runStreamAbortRef = useRef<AbortController | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeDataPatch, setNodeDataPatch] = useState<{
    id: string;
    data: Record<string, unknown>;
    nonce: number;
  } | null>(null);
  const [focusNodeRequest, setFocusNodeRequest] = useState<{
    id: string;
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
  const [runQuery, setRunQuery] = useState("What is Econ?");
  const [runFiles, setRunFiles] = useState<File[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<WorkflowRunResponse["result"] | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [liveTrace, setLiveTrace] = useState<NonNullable<WorkflowRunResponse["result"]>["trace"]>([]);
  const [runNodeState, setRunNodeState] = useState<{
    activeNodeId?: string | null;
    errorNodeId?: string | null;
    completedNodeIds?: string[];
  } | null>(null);
  const [isJsonCopied, setIsJsonCopied] = useState(false);
  const [isTraceCopied, setIsTraceCopied] = useState(false);

  const handleWorkflowDataChange = useCallback((next: WorkflowDataType) => {
    setData(next);
  }, []);

  const startNode = data.nodes.find((node) => node.data?.type === "start");
  const startVariables = ((startNode?.data as StartNodeData | undefined)?.variables ?? []);
  const selectedNodeType = typeof selectedNode?.data?.type === "string" ? selectedNode.data.type : "";
  const SelectedNodePanel = selectedNodeType ? nodeSettingsPanelMap[selectedNodeType] : undefined;

  const handleRun = useCallback(async () => {
    runStreamAbortRef.current?.abort();
    const abortController = new AbortController();
    runStreamAbortRef.current = abortController;
    setIsRunning(true);
    setRunError(null);
    setRunResult(null);
    setLiveTrace([]);
    setRunNodeState({
      activeNodeId: null,
      errorNodeId: null,
      completedNodeIds: [],
    });

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
        headers: {
          Accept: "text/event-stream",
        },
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Workflow stream failed to start.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const applyTraceItem = (traceItem: NonNullable<WorkflowRunResponse["result"]>["trace"][number]) => {
        setLiveTrace((prev) => {
          const next = [...prev];
          const index = next.findIndex((item) => item.nodeId === traceItem.nodeId);
          if (index >= 0) {
            next[index] = traceItem;
          } else {
            next.push(traceItem);
          }
          return next;
        });
      };

      const processEvent = (eventType: string, payload: Record<string, unknown>) => {
        if (eventType === "node_running" && payload.traceItem) {
          const traceItem = payload.traceItem as NonNullable<WorkflowRunResponse["result"]>["trace"][number];
          applyTraceItem(traceItem);
          setRunNodeState((prev) => ({
            activeNodeId: traceItem.nodeId,
            errorNodeId: prev?.errorNodeId ?? null,
            completedNodeIds: prev?.completedNodeIds ?? [],
          }));
          return;
        }

        if (eventType === "node_completed" && payload.traceItem) {
          const traceItem = payload.traceItem as NonNullable<WorkflowRunResponse["result"]>["trace"][number];
          applyTraceItem(traceItem);
          setRunNodeState((prev) => ({
            activeNodeId: null,
            errorNodeId: prev?.errorNodeId ?? null,
            completedNodeIds: Array.from(new Set([...(prev?.completedNodeIds ?? []), traceItem.nodeId])),
          }));
          return;
        }

        if (eventType === "node_error" && payload.traceItem) {
          const traceItem = payload.traceItem as NonNullable<WorkflowRunResponse["result"]>["trace"][number];
          applyTraceItem(traceItem);
          setRunNodeState((prev) => ({
            activeNodeId: null,
            errorNodeId: traceItem.nodeId,
            completedNodeIds: prev?.completedNodeIds ?? [],
          }));
          setSelectedNode(traceItem.node);
          setFocusNodeRequest({
            id: traceItem.nodeId,
            nonce: Date.now(),
          });
          setRunError(String(payload.error ?? traceItem.detail ?? "Workflow execution failed."));
          return;
        }

        if (eventType === "workflow_completed" && payload.result) {
          const result = payload.result as NonNullable<WorkflowRunResponse["result"]>;
          setRunResult(result);
          setLiveTrace(result.trace);
          setRunNodeState((prev) => ({
            activeNodeId: null,
            errorNodeId: prev?.errorNodeId ?? null,
            completedNodeIds: result.trace.filter((item) => item.status === "completed").map((item) => item.nodeId),
          }));
          return;
        }

        if (eventType === "workflow_error") {
          setRunError(String(payload.error ?? "Workflow execution failed."));
        }
      };

      while (true) {
        const {value, done} = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, {stream: true});

        while (buffer.includes("\n\n")) {
          const boundaryIndex = buffer.indexOf("\n\n");
          const rawEvent = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + 2);

          const eventLine = rawEvent.split("\n").find((line) => line.startsWith("event:"));
          const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data:"));
          if (!eventLine || !dataLine) {
            continue;
          }

          const eventType = eventLine.slice(6).trim();
          const payload = JSON.parse(dataLine.slice(5).trim()) as Record<string, unknown>;
          processEvent(eventType, payload);
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setRunError(error instanceof Error ? error.message : "Workflow execution failed.");
    } finally {
      runStreamAbortRef.current = null;
      setIsRunning(false);
    }
  }, [data, runFiles, runQuery]);

  const handleCopyWorkflowJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({graph: data}, null, 2));
      setIsJsonCopied(true);
      window.setTimeout(() => setIsJsonCopied(false), 1500);
    } catch {
      setIsJsonCopied(false);
    }
  }, [data]);

  const handleCopyTraceJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(runResult?.trace ?? liveTrace, null, 2));
      setIsTraceCopied(true);
      window.setTimeout(() => setIsTraceCopied(false), 1500);
    } catch {
      setIsTraceCopied(false);
    }
  }, [liveTrace, runResult?.trace]);

  return (
    <div className="flex h-full min-h-0 w-full bg-[#f5f7fb]">
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <Workflow
          initData={data}
          onNodeSelect={setSelectedNode}
          nodeDataPatch={nodeDataPatch}
          focusNodeRequest={focusNodeRequest}
          onDataChange={handleWorkflowDataChange}
          runNodeState={runNodeState}
        />
      </div>
      <aside
        className="h-full min-h-0 w-[500px] shrink-0 overflow-y-auto border-l border-zinc-200/80 bg-white/96 px-4 py-5 shadow-[-20px_0_40px_-32px_rgba(15,23,42,0.25)] backdrop-blur">
        <div
          className="sticky top-0 z-10 -mx-4 mb-4 border-b border-zinc-200/80 bg-white/92 px-4 pb-4 pt-1 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Workflow Studio</p>
            </div>
          </div>
        </div>

        <section
          className="mb-6 rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 to-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Run Workflow</h2>
            </div>
            <button
              className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
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
              className="min-h-28 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              value={runQuery}
              onChange={(event) => setRunQuery(event.target.value)}
              placeholder="Type the start node input here..."
              suppressHydrationWarning
            />
          </label>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs text-zinc-600">
              Uploaded Files
              {startVariables[1]?.name ? ` (${startVariables[1].name})` : ""}
            </span>
            <input
              className="block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 shadow-sm"
              type="file"
              multiple
              onChange={(event) => setRunFiles(Array.from(event.target.files ?? []))}
              suppressHydrationWarning
            />
          </label>

          {runFiles.length > 0 && (
            <div className="mb-3 rounded-2xl border border-zinc-200 bg-white p-3">
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
            <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {runError}
            </div>
          )}

          {(runResult || liveTrace.length > 0) && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                <p className="mb-1 text-xs font-medium text-zinc-700">Final Output</p>
                {runResult?.output ? (
                  <Markdown content={runResult.output}/>
                ) : (
                  <pre className="whitespace-pre-wrap break-words text-sm text-zinc-800">
                    {isRunning ? "Running..." : ""}
                  </pre>
                )}
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                <p className="mb-1 text-xs font-medium text-zinc-700">Trace</p>
                <div className="space-y-1">
                  {(runResult?.trace ?? liveTrace).map((item) => (
                    <button
                      key={`${item.nodeId}-${item.status}`}
                      className={`block w-full rounded-2xl px-3 py-3 text-left text-xs transition hover:bg-zinc-100 hover:text-zinc-800 ${
                        item.status === "running"
                          ? "bg-sky-50 text-sky-700"
                          : item.status === "error"
                            ? "bg-red-50 text-red-700"
                            : "text-zinc-600"
                      }`}
                      type="button"
                      onClick={() => {
                        setSelectedNode(item.node);
                        setFocusNodeRequest({
                          id: item.nodeId,
                          nonce: Date.now(),
                        });
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">
                            {item.nodeType} ({item.nodeId})
                          </div>
                          <div className="mt-1 text-[11px] opacity-80">
                            {item.status}
                            {item.detail ? ` - ${item.detail}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2">
                        <div className="rounded-xl border border-zinc-200/70 bg-white/80 p-2">
                          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Input
                          </div>
                          <pre className="whitespace-pre-wrap break-words text-[11px] text-zinc-700">
                            {JSON.stringify(item.input, null, 2)}
                          </pre>
                        </div>
                        <div className="rounded-xl border border-zinc-200/70 bg-white/80 p-2">
                          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Process Data
                          </div>
                          <pre className="whitespace-pre-wrap break-words text-[11px] text-zinc-700">
                            {JSON.stringify(item.processData, null, 2)}
                          </pre>
                        </div>
                        <div className="rounded-xl border border-zinc-200/70 bg-white/80 p-2">
                          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Output
                          </div>
                          <pre className="whitespace-pre-wrap break-words text-[11px] text-zinc-700">
                            {JSON.stringify(item.output, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-zinc-900">Trace JSON</h3>
                    <button
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                      type="button"
                      onClick={handleCopyTraceJson}
                    >
                      {isTraceCopied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="max-h-96 overflow-auto rounded-2xl bg-zinc-950 p-3 text-xs text-zinc-100">
                    {JSON.stringify(runResult?.trace ?? liveTrace, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </section>

          <section className="rounded-3xl border border-zinc-200/80 bg-zinc-50/70 p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Node Settings</h2>
                <p className="text-xs text-zinc-500">Configure the selected workflow block.</p>
              </div>
            </div>

            {!selectedNode && <p className="text-sm text-zinc-500">Select a node to configure.</p>}

            {selectedNode && SelectedNodePanel && (
              <SelectedNodePanel
                node={selectedNode}
                patchNodeData={patchSelectedNodeData}
                allNodes={data.nodes}
                allEdges={data.edges}
              />
            )}

            {selectedNode && !SelectedNodePanel && (
              <p className="text-sm text-zinc-500">No configurable fields for this node type yet.</p>
            )}
          </section>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-900">Current Workflow JSON</h3>
            <button
              className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
              type="button"
              onClick={handleCopyWorkflowJson}
            >
              {isJsonCopied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="max-h-96 overflow-auto rounded-2xl bg-zinc-950 p-3 text-xs text-zinc-100">
            {JSON.stringify({graph: data}, null, 2)}
          </pre>
        </div>
      </aside>
    </div>
  );
}
