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
import { executeIfElseNode } from "@/app/components/workflow/nodes/if-else/execution";
import { executeLlmNode } from "@/app/components/workflow/nodes/llm/execution";
import { executeStartNode } from "@/app/components/workflow/nodes/start/execution";
import { getNodeType, getOutgoingEdges } from "@/app/components/workflow/nodes/execution-utils";

const nodeExecutors: Record<string, (context: NodeExecutionContext) => Promise<NodeExecutionResult>> = {
  start: executeStartNode,
  ifElse: executeIfElseNode,
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

  return {
    output: finalOutput,
    outputs: finalOutputs,
    trace,
  };
}
