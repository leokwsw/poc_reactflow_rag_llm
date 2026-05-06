import { interpolateTemplate } from "@/app/components/workflow/nodes/_base/execution-helpers";
import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import {getDatasetById} from "@/app/datasets/data";
import {mergeModelConfig, mergeRerankingConfig} from "@/app/api/datasets/route";
import {embedText} from "@/app/datasets/queue";

type Dataset = {
  id: string;
  name: string;
};

type KnowledgeRetrievalNodeData = {
  datasets?: Dataset[];
  query?: string;
};

export async function executeKnowledgeRetrievalNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as KnowledgeRetrievalNodeData;
  const datasets = data.datasets ?? [];
  const rawQuery = (data.query ?? "").trim();
  const wrapped = rawQuery.match(/^\{\{#\s*([^#}]+?)\s*#\}\}\s*$/);
  const queryTemplate = wrapped
    ? rawQuery
    : /^[\w.-]+$/.test(rawQuery) && !/\s/.test(rawQuery)
      ? `{{#${rawQuery}#}}`
      : "{{#sys.query#}}";
  const resolvedQuery =
    interpolateTemplate(queryTemplate, context).trim() || context.input.query;

  console.log("query", resolvedQuery)
  console.log("query dataset", datasets.map((dataset) => dataset.id))

  // TODO: 1. Embedding Query
  // TODO: 2. vector search in ElasticSearch
  // TODO: 3. return File Info, Chunk Info

  for (const dataset of datasets) {
    const o = getDatasetById(dataset.id)
    if(o){
      const embedding_config = mergeModelConfig(o.embedding_config);
      const embedded = await embedText(resolvedQuery, embedding_config);

    }

  }

  const result = datasets.map((dataset) => ({
    dataset_id: dataset.id,
    dataset_name: dataset.name,
    content: `Retrieved context for "${resolvedQuery}" from ${dataset.name}.`,
  }));

  return {
    output: {
      result,
      query: resolvedQuery,
    },
    detail: `datasets=${datasets.length}`,
  };
}

