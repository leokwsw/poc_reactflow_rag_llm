import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { getIncomingEdges, resolveExpression } from "@/app/components/workflow/nodes/execution-utils";

export async function executeEndNode({
  node,
  edges,
  nodeOutputs,
  aliasMap,
}: NodeExecutionContext): Promise<NodeExecutionResult> {
  const configuredOutputs = Array.isArray(node.data?.outputs) ? (node.data.outputs as string[]) : [];
  const incomingEdges = getIncomingEdges(node.id, edges);
  const fallbackSourceId = incomingEdges[0]?.source;
  const outputExpressions = configuredOutputs.length > 0
    ? configuredOutputs
    : fallbackSourceId
      ? [`${fallbackSourceId}.text`]
      : [];

  const finalOutputs: Record<string, unknown> = {};
  let finalOutput = "";

  outputExpressions.forEach((expression, index) => {
    finalOutputs[expression] = resolveExpression(expression, nodeOutputs, aliasMap);
    if (index === 0 && typeof finalOutputs[expression] === "string") {
      finalOutput = finalOutputs[expression] as string;
    }
  });

  if (!finalOutput && fallbackSourceId) {
    finalOutput = String(nodeOutputs[fallbackSourceId]?.text ?? "");
  }

  return {
    output: {
      output: finalOutput,
      outputs: finalOutputs,
    },
    detail: `outputs=${outputExpressions.length}`,
    finalOutput,
    finalOutputs,
  };
}

