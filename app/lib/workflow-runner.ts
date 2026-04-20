import type { WorkflowDataType } from "@/app/components/workflow/types";
import type {
  NodeOutputMap,
  WorkflowRunInput,
  WorkflowRunResult,
  WorkflowTraceItem,
} from "@/app/components/workflow/nodes/execution-types";
import { nodeExecutors } from "@/app/components/workflow/nodes/executors";
import { getNodeType, getOutgoingEdges } from "@/app/components/workflow/nodes/execution-utils";

type WorkflowRunEvent =
  | {
      type: "node_running";
      traceItem: WorkflowTraceItem;
    }
  | {
      type: "node_completed";
      traceItem: WorkflowTraceItem;
    }
  | {
      type: "node_error";
      traceItem: WorkflowTraceItem;
      error: string;
    }
  | {
      type: "workflow_completed";
      result: WorkflowRunResult;
    };

type RunWorkflowOptions = {
  onEvent?: (event: WorkflowRunEvent) => void;
};

export async function runWorkflow(
  workflow: WorkflowDataType,
  input: WorkflowRunInput,
  options: RunWorkflowOptions = {},
): Promise<WorkflowRunResult> {
  const nodes = workflow.nodes;
  const edges = workflow.edges;
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const aliasMap = new Map<string, string>();
  const trace: WorkflowTraceItem[] = [];
  const nodeOutputs: NodeOutputMap = {};

  nodes.forEach((node) => {
    const label = typeof node.data?.label === "string" ? node.data.label : undefined;
    if (label) aliasMap.set(label, node.id);
  });

  const startNode = nodes.find((node) => ["start", "triggerSchedule", "triggerWebhook"].includes(getNodeType(node)));
  if (!startNode) {
    throw new Error("Workflow requires one entry node.");
  }

  let finalOutput = "";
  let finalOutputs: Record<string, unknown> = {};
  const executionQueue: string[] = [startNode.id];
  const queuedNodeIds = new Set<string>([startNode.id]);
  const executedNodeIds = new Set<string>();

  while (executionQueue.length > 0) {
    const nodeId = executionQueue.shift()!;
    const node = nodeMap.get(nodeId);
    if (!node || executedNodeIds.has(nodeId)) continue;

    const nodeType = getNodeType(node);
    trace.push({
      nodeId,
      nodeType,
      status: "running",
      node: structuredClone(node),
    });
    options.onEvent?.({
      type: "node_running",
      traceItem: trace[trace.length - 1],
    });

    const executor = nodeExecutors[nodeType];
    if (!executor) {
      const errorMessage = `Unsupported node type "${nodeType}" in runner.`;
      trace[trace.length - 1] = {
        nodeId,
        nodeType,
        status: "error",
        detail: errorMessage,
        node: structuredClone(node),
      };
      options.onEvent?.({
        type: "node_error",
        traceItem: trace[trace.length - 1],
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }

    let result;
    try {
      result = await executor({
        node,
        nodeId,
        workflow,
        input,
        edges,
        nodeOutputs,
        aliasMap,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Node "${nodeId}" execution failed.`;
      trace[trace.length - 1] = {
        nodeId,
        nodeType,
        status: "error",
        detail: errorMessage,
        node: structuredClone(node),
      };
      options.onEvent?.({
        type: "node_error",
        traceItem: trace[trace.length - 1],
        error: errorMessage,
      });
      throw error;
    }

    nodeOutputs[nodeId] = result.output;
    if (result.finalOutput !== undefined) {
      finalOutput = result.finalOutput;
    }
    if (result.finalOutputs !== undefined) {
      finalOutputs = result.finalOutputs;
    }

    trace[trace.length - 1] = {
      nodeId,
      nodeType,
      status: "completed",
      detail: result.detail,
      node: structuredClone(node),
    };
    options.onEvent?.({
      type: "node_completed",
      traceItem: trace[trace.length - 1],
    });

    executedNodeIds.add(nodeId);

    const allOutgoingEdges = getOutgoingEdges(nodeId, edges);
    const activeOutgoingEdges = result.selectedSourceHandles && result.selectedSourceHandles.length > 0
      ? allOutgoingEdges.filter((edge) => edge.sourceHandle ? result.selectedSourceHandles?.includes(edge.sourceHandle) : false)
      : allOutgoingEdges;

    for (const edge of activeOutgoingEdges) {
      if (!queuedNodeIds.has(edge.target) && !executedNodeIds.has(edge.target)) {
        executionQueue.push(edge.target);
        queuedNodeIds.add(edge.target);
      }
    }
  }

  const workflowResult = {
    output: finalOutput,
    outputs: finalOutputs,
    trace,
  };
  options.onEvent?.({
    type: "workflow_completed",
    result: workflowResult,
  });

  return workflowResult;
}
