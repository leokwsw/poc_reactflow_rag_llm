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

type QuestionClass = {
  id: string;
  name: string;
};

type QuestionClassifierNodeData = {
  type?: string;
  label?: string;
  apiBaseUrl?: string;
  apiKey?: string;
  model?: string;
  instruction?: string;
  classes?: QuestionClass[];
};

type LabelNodeData = {
  type?: string;
  label?: string;
};

type AgentNodeData = LabelNodeData & {
  role?: string;
  tools?: string[];
};

type AssignerNodeData = LabelNodeData & {
  assignments?: Array<{ target: string; value: string }>;
};

type CodeNodeData = LabelNodeData & {
  language?: string;
  code?: string;
};

type DataSourceNodeData = LabelNodeData & {
  sourceType?: string;
  variableName?: string;
};

type DataSourceEmptyNodeData = LabelNodeData & {
  message?: string;
};

type HttpNodeData = LabelNodeData & {
  method?: string;
  url?: string;
};

type IterationNodeData = LabelNodeData & {
  iterator?: string;
  itemName?: string;
};

type ScopeNodeData = LabelNodeData & {
  scopeName?: string;
};

type ListOperatorNodeData = LabelNodeData & {
  operation?: string;
  targetList?: string;
};

type EndNodeData = LabelNodeData & {
  answer?: string;
  outputs?: string[];
};

type LoopNodeData = LabelNodeData & {
  condition?: string;
  maxIterations?: number;
};

type LoopEndNodeData = LabelNodeData & {
  aggregate?: string;
};

type NoteNodeData = {
  type?: string;
  text?: string;
  author?: string;
  theme?: "yellow" | "blue" | "green" | "purple";
};

type ParameterExtractorNodeData = LabelNodeData & {
  parameters?: Array<{ name: string; type?: string }>;
};

type SimpleNodeData = LabelNodeData & {
  description?: string;
};

type TemplateTransformNodeData = LabelNodeData & {
  template?: string;
};

type ToolNodeData = LabelNodeData & {
  toolName?: string;
  outputSchema?: string[];
};

type VariableAssignerNodeData = LabelNodeData & {
  variables?: Array<{ name: string; expression: string }>;
};

type KnowledgeBaseNodeData = LabelNodeData & {
  indexingTechnique?: string;
  retrievalSearchMethod?: string;
};

type KnowledgeRetrievalNodeData = LabelNodeData & {
  datasets?: Array<{ id: string; name: string }>;
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
  const selectedQuestionClassifierData = (selectedNode?.data as QuestionClassifierNodeData | undefined) ?? {};
  const selectedAgentData = (selectedNode?.data as AgentNodeData | undefined) ?? {};
  const selectedAssignerData = (selectedNode?.data as AssignerNodeData | undefined) ?? {};
  const selectedCodeData = (selectedNode?.data as CodeNodeData | undefined) ?? {};
  const selectedDataSourceData = (selectedNode?.data as DataSourceNodeData | undefined) ?? {};
  const selectedDataSourceEmptyData = (selectedNode?.data as DataSourceEmptyNodeData | undefined) ?? {};
  const selectedHttpData = (selectedNode?.data as HttpNodeData | undefined) ?? {};
  const selectedIterationData = (selectedNode?.data as IterationNodeData | undefined) ?? {};
  const selectedIterationStartData = (selectedNode?.data as ScopeNodeData | undefined) ?? {};
  const selectedListOperatorData = (selectedNode?.data as ListOperatorNodeData | undefined) ?? {};
  const selectedEndData = (selectedNode?.data as EndNodeData | undefined) ?? {};
  const selectedLoopData = (selectedNode?.data as LoopNodeData | undefined) ?? {};
  const selectedLoopEndData = (selectedNode?.data as LoopEndNodeData | undefined) ?? {};
  const selectedLoopStartData = (selectedNode?.data as ScopeNodeData | undefined) ?? {};
  const selectedNoteData = (selectedNode?.data as NoteNodeData | undefined) ?? {};
  const selectedParameterExtractorData = (selectedNode?.data as ParameterExtractorNodeData | undefined) ?? {};
  const selectedSimpleData = (selectedNode?.data as SimpleNodeData | undefined) ?? {};
  const selectedTemplateTransformData = (selectedNode?.data as TemplateTransformNodeData | undefined) ?? {};
  const selectedToolData = (selectedNode?.data as ToolNodeData | undefined) ?? {};
  const selectedVariableAssignerData = (selectedNode?.data as VariableAssignerNodeData | undefined) ?? {};
  const selectedKnowledgeBaseData = (selectedNode?.data as KnowledgeBaseNodeData | undefined) ?? {};
  const selectedKnowledgeRetrievalData = (selectedNode?.data as KnowledgeRetrievalNodeData | undefined) ?? {};

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
              <span className="mb-1 block text-xs text-zinc-600">Label</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={(selectedNode.data.label as string | undefined) ?? "Start"}
                onChange={(event) => patchSelectedNodeData({label: event.target.value})}
              />
            </label>
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

        {selectedNode?.data.type === "questionClassifier" && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Label</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={selectedQuestionClassifierData.label ?? "Question Classifier"}
                onChange={(event) => patchSelectedNodeData({label: event.target.value})}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">API Base URL</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={selectedQuestionClassifierData.apiBaseUrl ?? "https://api.openai.com/v1"}
                onChange={(event) => patchSelectedNodeData({apiBaseUrl: event.target.value})}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">API Key</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                type="password"
                value={selectedQuestionClassifierData.apiKey ?? ""}
                onChange={(event) => patchSelectedNodeData({apiKey: event.target.value})}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Model</span>
              <input
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={selectedQuestionClassifierData.model ?? ""}
                onChange={(event) => patchSelectedNodeData({model: event.target.value})}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Instruction</span>
              <textarea
                className="min-h-24 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                value={selectedQuestionClassifierData.instruction ?? ""}
                onChange={(event) => patchSelectedNodeData({instruction: event.target.value})}
              />
            </label>
            <div className="space-y-3">
              {(selectedQuestionClassifierData.classes ?? []).map((classItem, index) => (
                <div key={classItem.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-zinc-700">Class {index + 1}</p>
                    <button
                      className="text-xs text-red-600 hover:text-red-700"
                      type="button"
                      onClick={() => {
                        const classes = (selectedQuestionClassifierData.classes ?? []).filter((item) => item.id !== classItem.id);
                        patchSelectedNodeData({classes});
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <label className="mb-2 block">
                    <span className="mb-1 block text-xs text-zinc-600">Class ID</span>
                    <input
                      className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                      value={classItem.id}
                      onChange={(event) => {
                        const classes = (selectedQuestionClassifierData.classes ?? []).map((item, itemIndex) =>
                          itemIndex === index ? {...item, id: event.target.value} : item,
                        );
                        patchSelectedNodeData({classes});
                      }}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-zinc-600">Class Name</span>
                    <input
                      className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
                      value={classItem.name}
                      onChange={(event) => {
                        const classes = (selectedQuestionClassifierData.classes ?? []).map((item, itemIndex) =>
                          itemIndex === index ? {...item, name: event.target.value} : item,
                        );
                        patchSelectedNodeData({classes});
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
            <button
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              type="button"
              onClick={() => {
                const classes = [...(selectedQuestionClassifierData.classes ?? [])];
                classes.push({
                  id: `class_${Date.now()}`,
                  name: `Class ${classes.length + 1}`,
                });
                patchSelectedNodeData({classes});
              }}
            >
              Add Class
            </button>
          </div>
        )}

        {selectedNode?.data.type === "agent" && (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Label</span>
              <input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedAgentData.label ?? "Agent"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Role</span>
              <input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedAgentData.role ?? ""} onChange={(event) => patchSelectedNodeData({role: event.target.value})} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Tools (comma separated)</span>
              <input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={(selectedAgentData.tools ?? []).join(", ")} onChange={(event) => patchSelectedNodeData({tools: event.target.value.split(",").map(item => item.trim()).filter(Boolean)})} />
            </label>
          </div>
        )}

        {selectedNode?.data.type === "assigner" && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Label</span>
              <input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedAssignerData.label ?? "Assigner"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} />
            </label>
            {(selectedAssignerData.assignments ?? []).map((assignment, index) => (
              <div key={`${assignment.target}-${index}`} className="rounded-lg border border-zinc-200 p-3 space-y-2">
                <div className="flex justify-end">
                  <button
                    className="text-xs text-red-600 hover:text-red-700"
                    type="button"
                    onClick={() => patchSelectedNodeData({assignments: (selectedAssignerData.assignments ?? []).filter((_, itemIndex) => itemIndex !== index)})}
                  >
                    Remove
                  </button>
                </div>
                <input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" placeholder="Target" value={assignment.target} onChange={(event) => patchSelectedNodeData({assignments: (selectedAssignerData.assignments ?? []).map((item, itemIndex) => itemIndex === index ? {...item, target: event.target.value} : item)})} />
                <input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" placeholder="Value" value={assignment.value} onChange={(event) => patchSelectedNodeData({assignments: (selectedAssignerData.assignments ?? []).map((item, itemIndex) => itemIndex === index ? {...item, value: event.target.value} : item)})} />
              </div>
            ))}
            <button
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              type="button"
              onClick={() => patchSelectedNodeData({assignments: [...(selectedAssignerData.assignments ?? []), {target: "", value: ""}]})}
            >
              Add Assignment
            </button>
          </div>
        )}

        {selectedNode?.data.type === "code" && (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Label</span>
              <input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedCodeData.label ?? "Code"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Language</span>
              <input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedCodeData.language ?? "JavaScript"} onChange={(event) => patchSelectedNodeData({language: event.target.value})} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-zinc-600">Code</span>
              <textarea className="min-h-32 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm font-mono" value={selectedCodeData.code ?? ""} onChange={(event) => patchSelectedNodeData({code: event.target.value})} />
            </label>
          </div>
        )}

        {selectedNode?.data.type === "dataSource" && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedDataSourceData.label ?? "Data Source"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Source Type</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedDataSourceData.sourceType ?? ""} onChange={(event) => patchSelectedNodeData({sourceType: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Variable Name</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedDataSourceData.variableName ?? ""} onChange={(event) => patchSelectedNodeData({variableName: event.target.value})} /></label>
          </div>
        )}

        {selectedNode?.data.type === "dataSourceEmpty" && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedDataSourceEmptyData.label ?? "Data Source Empty"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Message</span><textarea className="min-h-24 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedDataSourceEmptyData.message ?? ""} onChange={(event) => patchSelectedNodeData({message: event.target.value})} /></label>
          </div>
        )}

        {selectedNode?.data.type === "http" && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedHttpData.label ?? "HTTP"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Method</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedHttpData.method ?? "GET"} onChange={(event) => patchSelectedNodeData({method: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">URL</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedHttpData.url ?? ""} onChange={(event) => patchSelectedNodeData({url: event.target.value})} /></label>
          </div>
        )}

        {selectedNode?.data.type === "iteration" && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedIterationData.label ?? "Iteration"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Iterator</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedIterationData.iterator ?? ""} onChange={(event) => patchSelectedNodeData({iterator: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Item Name</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedIterationData.itemName ?? ""} onChange={(event) => patchSelectedNodeData({itemName: event.target.value})} /></label>
          </div>
        )}

        {selectedNode?.data.type === "iterationStart" && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedIterationStartData.label ?? "Iteration Start"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Scope Name</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedIterationStartData.scopeName ?? ""} onChange={(event) => patchSelectedNodeData({scopeName: event.target.value})} /></label>
          </div>
        )}

        {selectedNode?.data.type === "listOperator" && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedListOperatorData.label ?? "List Operator"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Operation</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedListOperatorData.operation ?? ""} onChange={(event) => patchSelectedNodeData({operation: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Target List</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedListOperatorData.targetList ?? ""} onChange={(event) => patchSelectedNodeData({targetList: event.target.value})} /></label>
          </div>
        )}

        {selectedNode?.data.type === "end" && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedEndData.label ?? "End"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Answer Expression</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedEndData.answer ?? ""} onChange={(event) => patchSelectedNodeData({answer: event.target.value})} placeholder="{{3.text}}" /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Outputs (comma separated)</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={(selectedEndData.outputs ?? []).join(", ")} onChange={(event) => patchSelectedNodeData({outputs: event.target.value.split(",").map(item => item.trim()).filter(Boolean)})} /></label>
          </div>
        )}

        {selectedNode?.data.type === "loop" && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedLoopData.label ?? "Loop"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Condition</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedLoopData.condition ?? ""} onChange={(event) => patchSelectedNodeData({condition: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Max Iterations</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" type="number" value={selectedLoopData.maxIterations ?? 10} onChange={(event) => patchSelectedNodeData({maxIterations: Number(event.target.value)})} /></label>
          </div>
        )}

        {selectedNode?.data.type === "loopEnd" && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedLoopEndData.label ?? "Loop End"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Aggregate</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedLoopEndData.aggregate ?? ""} onChange={(event) => patchSelectedNodeData({aggregate: event.target.value})} /></label>
          </div>
        )}

        {selectedNode?.data.type === "loopStart" && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedLoopStartData.label ?? "Loop Start"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Scope Name</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedLoopStartData.scopeName ?? ""} onChange={(event) => patchSelectedNodeData({scopeName: event.target.value})} /></label>
          </div>
        )}

        {selectedNode?.data.type === "note" && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Text</span><textarea className="min-h-28 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedNoteData.text ?? ""} onChange={(event) => patchSelectedNodeData({text: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Author</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedNoteData.author ?? ""} onChange={(event) => patchSelectedNodeData({author: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Theme</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedNoteData.theme ?? "yellow"} onChange={(event) => patchSelectedNodeData({theme: event.target.value})} /></label>
          </div>
        )}

        {selectedNode?.data.type === "parameterExtractor" && (
          <div className="space-y-4">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedParameterExtractorData.label ?? "Parameter Extractor"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            {(selectedParameterExtractorData.parameters ?? []).map((parameter, index) => (
              <div key={`${parameter.name}-${index}`} className="rounded-lg border border-zinc-200 p-3 space-y-2">
                <div className="flex justify-end">
                  <button
                    className="text-xs text-red-600 hover:text-red-700"
                    type="button"
                    onClick={() => patchSelectedNodeData({parameters: (selectedParameterExtractorData.parameters ?? []).filter((_, itemIndex) => itemIndex !== index)})}
                  >
                    Remove
                  </button>
                </div>
                <input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" placeholder="Name" value={parameter.name} onChange={(event) => patchSelectedNodeData({parameters: (selectedParameterExtractorData.parameters ?? []).map((item, itemIndex) => itemIndex === index ? {...item, name: event.target.value} : item)})} />
                <input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" placeholder="Type" value={parameter.type ?? ""} onChange={(event) => patchSelectedNodeData({parameters: (selectedParameterExtractorData.parameters ?? []).map((item, itemIndex) => itemIndex === index ? {...item, type: event.target.value} : item)})} />
              </div>
            ))}
            <button
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              type="button"
              onClick={() => patchSelectedNodeData({parameters: [...(selectedParameterExtractorData.parameters ?? []), {name: "", type: "string"}]})}
            >
              Add Parameter
            </button>
          </div>
        )}

        {selectedNode?.data.type === "simple" && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedSimpleData.label ?? "Simple Node"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Description</span><textarea className="min-h-24 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedSimpleData.description ?? ""} onChange={(event) => patchSelectedNodeData({description: event.target.value})} /></label>
          </div>
        )}

        {selectedNode?.data.type === "templateTransform" && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedTemplateTransformData.label ?? "Template Transform"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Template</span><textarea className="min-h-28 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm font-mono" value={selectedTemplateTransformData.template ?? ""} onChange={(event) => patchSelectedNodeData({template: event.target.value})} /></label>
          </div>
        )}

        {selectedNode?.data.type === "tool" && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedToolData.label ?? "Tool"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Tool Name</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedToolData.toolName ?? ""} onChange={(event) => patchSelectedNodeData({toolName: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Output Schema (comma separated)</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={(selectedToolData.outputSchema ?? []).join(", ")} onChange={(event) => patchSelectedNodeData({outputSchema: event.target.value.split(",").map(item => item.trim()).filter(Boolean)})} /></label>
          </div>
        )}

        {selectedNode?.data.type === "variableAssigner" && (
          <div className="space-y-4">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedVariableAssignerData.label ?? "Variable Assigner"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            {(selectedVariableAssignerData.variables ?? []).map((variable, index) => (
              <div key={`${variable.name}-${index}`} className="rounded-lg border border-zinc-200 p-3 space-y-2">
                <div className="flex justify-end">
                  <button
                    className="text-xs text-red-600 hover:text-red-700"
                    type="button"
                    onClick={() => patchSelectedNodeData({variables: (selectedVariableAssignerData.variables ?? []).filter((_, itemIndex) => itemIndex !== index)})}
                  >
                    Remove
                  </button>
                </div>
                <input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" placeholder="Variable Name" value={variable.name} onChange={(event) => patchSelectedNodeData({variables: (selectedVariableAssignerData.variables ?? []).map((item, itemIndex) => itemIndex === index ? {...item, name: event.target.value} : item)})} />
                <input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" placeholder="Expression" value={variable.expression} onChange={(event) => patchSelectedNodeData({variables: (selectedVariableAssignerData.variables ?? []).map((item, itemIndex) => itemIndex === index ? {...item, expression: event.target.value} : item)})} />
              </div>
            ))}
            <button
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              type="button"
              onClick={() => patchSelectedNodeData({variables: [...(selectedVariableAssignerData.variables ?? []), {name: "", expression: ""}]})}
            >
              Add Variable
            </button>
          </div>
        )}

        {selectedNode?.data.type === "knowledgeBase" && (
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedKnowledgeBaseData.label ?? "Knowledge Base"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Indexing Technique</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedKnowledgeBaseData.indexingTechnique ?? ""} onChange={(event) => patchSelectedNodeData({indexingTechnique: event.target.value})} /></label>
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Retrieval Search Method</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedKnowledgeBaseData.retrievalSearchMethod ?? ""} onChange={(event) => patchSelectedNodeData({retrievalSearchMethod: event.target.value})} /></label>
          </div>
        )}

        {selectedNode?.data.type === "knowledgeRetrieval" && (
          <div className="space-y-4">
            <label className="block"><span className="mb-1 block text-xs text-zinc-600">Label</span><input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" value={selectedKnowledgeRetrievalData.label ?? "Knowledge Retrieval"} onChange={(event) => patchSelectedNodeData({label: event.target.value})} /></label>
            {(selectedKnowledgeRetrievalData.datasets ?? []).map((dataset, index) => (
              <div key={`${dataset.id}-${index}`} className="rounded-lg border border-zinc-200 p-3 space-y-2">
                <div className="flex justify-end">
                  <button
                    className="text-xs text-red-600 hover:text-red-700"
                    type="button"
                    onClick={() => patchSelectedNodeData({datasets: (selectedKnowledgeRetrievalData.datasets ?? []).filter((_, itemIndex) => itemIndex !== index)})}
                  >
                    Remove
                  </button>
                </div>
                <input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" placeholder="Dataset ID" value={dataset.id} onChange={(event) => patchSelectedNodeData({datasets: (selectedKnowledgeRetrievalData.datasets ?? []).map((item, itemIndex) => itemIndex === index ? {...item, id: event.target.value} : item)})} />
                <input className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm" placeholder="Dataset Name" value={dataset.name} onChange={(event) => patchSelectedNodeData({datasets: (selectedKnowledgeRetrievalData.datasets ?? []).map((item, itemIndex) => itemIndex === index ? {...item, name: event.target.value} : item)})} />
              </div>
            ))}
            <button
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              type="button"
              onClick={() => patchSelectedNodeData({datasets: [...(selectedKnowledgeRetrievalData.datasets ?? []), {id: "", name: ""}]})}
            >
              Add Dataset
            </button>
          </div>
        )}

        {selectedNode && !["start", "llm", "ifElse", "questionClassifier", "agent", "assigner", "code", "dataSource", "dataSourceEmpty", "http", "iteration", "iterationStart", "listOperator", "end", "loop", "loopEnd", "loopStart", "note", "parameterExtractor", "simple", "templateTransform", "tool", "variableAssigner", "knowledgeBase", "knowledgeRetrieval"].includes(selectedNode.data.type ?? "") && (
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
