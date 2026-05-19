"use client";

import Link from "next/link";
import {useCallback, useEffect, useRef, useState} from "react";
import Markdown from "@/app/components/markdown";
import {nodeSettingsPanelMap} from "@/app/components/workflow/nodes/panels";
import {isCustomNodeType} from "@/app/components/workflow/nodes/allowed";
import type {Node} from "reactflow";
import Workflow from "@/app/components/workflow";
import type {WorkflowDataType} from "@/app/components/workflow/types";
import type {WorkflowTraceItem} from "@/app/components/workflow/nodes/execution-types";
import type {WorkflowRunRecord} from "@/app/workflow/data";

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

type WorkflowStudioProps = {
  workflowId: string;
  workflowTitle: string;
  initialData: WorkflowDataType;
  recentRuns: WorkflowRunRecord[];
};

const formatRunTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value))
    : "";

function TraceCard({
  item,
  onFocus,
}: {
  item: WorkflowTraceItem;
  onFocus: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-2xl px-3 py-3 text-xs transition ${
        item.status === "running"
          ? "bg-sky-50 text-sky-700"
          : item.status === "error"
            ? "bg-red-50 text-red-700"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800"
      }`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0 flex-1">
          <div className="font-semibold">
            {item.nodeType} ({item.nodeId})
          </div>
          <div className="mt-1 text-[11px] opacity-80">
            {item.status}
            {item.detail ? ` - ${item.detail}` : ""}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
            title="Focus node"
            onClick={(e) => {
              e.stopPropagation();
              onFocus();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              <path
                fillRule="evenodd"
                d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto">
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
      )}
    </div>
  );
}

function RunHistoryCard({run}: {run: WorkflowRunRecord}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs">
      <button
        className="w-full text-left"
        type="button"
        onClick={() => setExpanded((value) => !value)}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-zinc-800">{run.status}</span>
          <span className="text-zinc-500">{formatRunTime(run.finished_at ?? run.created_at)}</span>
        </div>
        <div className="mt-1 truncate text-zinc-500">{run.query || run.error || run.id}</div>
      </button>
      {expanded && (
        <pre className="mt-3 max-h-72 overflow-auto rounded-2xl bg-zinc-950 p-3 text-[11px] text-zinc-100">
          {JSON.stringify({
            input: run.input,
            result: run.result,
            trace: run.trace,
            error: run.error,
          }, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function WorkflowStudio({workflowId, workflowTitle, initialData, recentRuns}: WorkflowStudioProps) {
  const runStreamAbortRef = useRef<AbortController | null>(null);
  const saveTimerRef = useRef<number | null>(null);
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

  const [data, setData] = useState(initialData);
  const [title, setTitle] = useState(workflowTitle);
  const [renameDraft, setRenameDraft] = useState(workflowTitle);
  const [isRenaming, setIsRenaming] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [runQuery, setRunQuery] = useState("一間本地連鎖餐廳收購另一間同類餐廳，並擴大生產規模。解釋這屬於哪種企業擴張，並分析對成本及短期／長期生產的影響。");
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

  const saveWorkflow = useCallback(async (next: WorkflowDataType, nextTitle = title) => {
    setSaveStatus("saving");
    const response = await fetch(`/api/workflows/${workflowId}`, {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        title: nextTitle,
        graph: next,
      }),
    });
    setSaveStatus(response.ok ? "saved" : "error");
    return response.ok;
  }, [title, workflowId]);

  const handleWorkflowDataChange = useCallback((next: WorkflowDataType) => {
    setData(next);
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void saveWorkflow(next).catch(() => setSaveStatus("error"));
    }, 700);
  }, [saveWorkflow]);

  useEffect(() => () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
  }, []);

  const handleStartRename = useCallback(() => {
    setRenameDraft(title);
    setIsRenaming(true);
  }, [title]);

  const handleCancelRename = useCallback(() => {
    setRenameDraft(title);
    setIsRenaming(false);
  }, [title]);

  const handleSaveRename = useCallback(async () => {
    const nextTitle = renameDraft.trim();
    if (!nextTitle) {
      setSaveStatus("error");
      return;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const ok = await saveWorkflow(data, nextTitle).catch(() => {
      setSaveStatus("error");
      return false;
    });
    if (!ok) {
      return;
    }

    setTitle(nextTitle);
    setRenameDraft(nextTitle);
    setIsRenaming(false);
  }, [data, renameDraft, saveWorkflow]);

  const startNode = data.nodes.find((node) => node.data?.type === "start");
  const startVariables = ((startNode?.data as StartNodeData | undefined)?.variables ?? []);
  const selectedNodeType = typeof selectedNode?.data?.type === "string" ? selectedNode.data.type : "";
  const SelectedNodePanel = isCustomNodeType(selectedNodeType) ? nodeSettingsPanelMap[selectedNodeType] : undefined;

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
      formData.append("workflow_id", workflowId);
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
  }, [data, runFiles, runQuery, workflowId]);

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
              <Link className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 transition hover:text-zinc-900" href="/workflow">
                Workflows
              </Link>
              {isRenaming ? (
                <form
                  className="mt-1 flex items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSaveRename();
                  }}
                >
                  <input
                    className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-950 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    value={renameDraft}
                    onChange={(event) => setRenameDraft(event.target.value)}
                    autoFocus
                  />
                  <button
                    className="rounded-xl bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700"
                    type="submit"
                  >
                    Save
                  </button>
                  <button
                    className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                    type="button"
                    onClick={handleCancelRename}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-zinc-950">{title}</h1>
                  <button
                    className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                    type="button"
                    onClick={handleStartRename}
                  >
                    Rename
                  </button>
                </div>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                {saveStatus === "saving" ? "Saving..." : saveStatus === "error" ? "Save failed" : "Saved"}
              </p>
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
                    <TraceCard
                      key={`${item.nodeId}-${item.status}`}
                      item={item}
                      onFocus={() => {
                        setSelectedNode(item.node);
                        setFocusNodeRequest({
                          id: item.nodeId,
                          nonce: Date.now(),
                        });
                      }}
                    />
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

        {recentRuns.length > 0 && (
          <section className="mb-6 rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-zinc-900">Recent Runs</h2>
            <div className="space-y-2">
              {recentRuns.map((run) => (
                <RunHistoryCard key={run.id} run={run} />
              ))}
            </div>
          </section>
        )}

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

        <div className="mt-6 hidden">
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
