import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { getIncomingEdges, resolveExpression } from "@/app/components/workflow/nodes/execution-utils";
import { interpolateTemplate } from "@/app/components/workflow/nodes/_base/execution-helpers";

export async function executeEndNode({
  node,
  workflow,
  input,
  edges,
  nodeOutputs,
  aliasMap,
}: NodeExecutionContext): Promise<NodeExecutionResult> {
  const answerExpression = typeof node.data?.answer === "string" ? node.data.answer.trim() : "";
  const configuredOutputs = Array.isArray(node.data?.outputs) ? (node.data.outputs as string[]) : [];
  const incomingEdges = getIncomingEdges(node.id, edges);
  const fallbackSourceId = incomingEdges[0]?.source;
  const outputExpressions = answerExpression
    ? [answerExpression]
    : configuredOutputs.length > 0
      ? configuredOutputs
      : fallbackSourceId
        ? [`${fallbackSourceId}.text`]
        : [];

  const finalOutputs: Record<string, unknown> = {};
  let finalOutput = "";

  outputExpressions.forEach((expression, index) => {
    const resolvedValue = answerExpression
      ? interpolateTemplate(expression, {
          node,
          nodeId: node.id,
          workflow,
          input,
          edges,
          nodeOutputs,
          aliasMap,
        } as NodeExecutionContext)
      : resolveExpression(expression, nodeOutputs, aliasMap);
    finalOutputs[expression] = resolvedValue;
    if (index === 0 && typeof finalOutputs[expression] === "string") {
      finalOutput = finalOutputs[expression] as string;
    }
  });

  if (!finalOutput && fallbackSourceId) {
    finalOutput = String(nodeOutputs[fallbackSourceId]?.text ?? "");
  }

  return {
    output: {
      answer: finalOutput,
      output: finalOutput,
      files: input.files,
      outputs: finalOutputs,
    },
    detail: `outputs=${outputExpressions.length}`,
    finalOutput,
    finalOutputs,
    traceInput: {},
    traceProcessData: {},
    traceOutput: {
      answer: finalOutput,
      files: input.files,
    },
  };
}
