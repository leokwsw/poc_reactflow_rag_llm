import type { WorkflowDataType } from "@/app/components/workflow/types";
import { executeEndNode } from "@/app/components/workflow/nodes/end/execution";
import type {
  NodeExecutionContext,
  NodeExecutionResult,
  NodeOutputMap,
  WorkflowRunInput,
  WorkflowRunResult,
  WorkflowTraceItem,
} from "@/app/components/workflow/nodes/execution-types";
import { executeLlmNode } from "@/app/components/workflow/nodes/llm/execution";
import { executeStartNode } from "@/app/components/workflow/nodes/start/execution";
import { getNodeType, getOutgoingEdges } from "@/app/components/workflow/nodes/execution-utils";

const nodeExecutors: Record<string, (context: NodeExecutionContext) => Promise<NodeExecutionResult>> = {
  start: executeStartNode,
  llm: executeLlmNode,
  end: executeEndNode,
};

export async function runWorkflow(
  workflow: WorkflowDataType,
  input: WorkflowRunInput,
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

  const startNode = nodes.find((node) => getNodeType(node) === "start");
  if (!startNode) {
    throw new Error("Workflow requires one start node.");
  }

  const reachableNodeIds = new Set<string>();
  const queue = [startNode.id];
  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || reachableNodeIds.has(nodeId)) continue;
    reachableNodeIds.add(nodeId);

    for (const edge of getOutgoingEdges(nodeId, edges)) {
      queue.push(edge.target);
    }
  }

  const inDegree = new Map<string, number>();
  reachableNodeIds.forEach((nodeId) => {
    const degree = edges.filter((edge) => edge.target === nodeId && reachableNodeIds.has(edge.source)).length;
    inDegree.set(nodeId, degree);
  });

  const ready = Array.from(reachableNodeIds).filter((nodeId) => (inDegree.get(nodeId) ?? 0) === 0);
  const executionOrder: string[] = [];
  while (ready.length > 0) {
    const nodeId = ready.shift()!;
    executionOrder.push(nodeId);

    for (const edge of getOutgoingEdges(nodeId, edges)) {
      if (!reachableNodeIds.has(edge.target)) continue;
      const nextDegree = (inDegree.get(edge.target) ?? 0) - 1;
      inDegree.set(edge.target, nextDegree);
      if (nextDegree === 0) ready.push(edge.target);
    }
  }

  if (executionOrder.length !== reachableNodeIds.size) {
    throw new Error("Workflow contains a cycle or unsupported graph structure.");
  }

  let finalOutput = "";
  let finalOutputs: Record<string, unknown> = {};

  for (const nodeId of executionOrder) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const nodeType = getNodeType(node);
    trace.push({ nodeId, nodeType, status: "running" });

    const executor = nodeExecutors[nodeType];
    if (!executor) {
      throw new Error(`Unsupported node type "${nodeType}" in runner. Current runner only supports start -> llm -> end.`);
    }

    const result = await executor({
      node,
      nodeId,
      workflow,
      input,
      edges,
      nodeOutputs,
      aliasMap,
    });

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
    };
  }

  return {
    output: finalOutput,
    outputs: finalOutputs,
    trace,
  };
}
