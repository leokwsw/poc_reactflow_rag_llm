import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

type Dataset = {
  id: string;
  name: string;
};

type KnowledgeRetrievalNodeData = {
  datasets?: Dataset[];
};

export async function executeKnowledgeRetrievalNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as KnowledgeRetrievalNodeData;
  const datasets = data.datasets ?? [];
  const result = datasets.map((dataset) => ({
    dataset_id: dataset.id,
    dataset_name: dataset.name,
    content: `Retrieved context for "${context.input.query}" from ${dataset.name}.`,
  }));

  return {
    output: {
      result,
      query: context.input.query,
    },
    detail: `datasets=${datasets.length}`,
  };
}

