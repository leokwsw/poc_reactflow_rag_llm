import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

type KnowledgeBaseNodeData = {
  indexingTechnique?: string;
  retrievalSearchMethod?: string;
};

export async function executeKnowledgeBaseNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as KnowledgeBaseNodeData;

  return {
    output: {
      indexingTechnique: data.indexingTechnique || "high_quality",
      retrievalSearchMethod: data.retrievalSearchMethod || "semantic_search",
    },
    detail: "knowledge-base-ready",
  };
}

