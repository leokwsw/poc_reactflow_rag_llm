import { interpolateTemplate } from "@/app/components/workflow/nodes/_base/execution-helpers";
import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import {getDatasetById, getDocuments} from "@/app/datasets/data";
import {mergeModelConfig, mergeRerankingConfig} from "@/app/api/datasets/route";
import {embedText} from "@/app/datasets/queue";
import {generateRagElasticsearchQuery} from "@/app/components/workflow/nodes/knowledge-retrieval/generate-es-query";
import {getElasticsearchClient, RAG_CHUNKS_INDEX} from "@/app/lib/elasticsearch";

type Dataset = {
  id: string;
  name: string;
};

type KnowledgeRetrievalInputData = {
  datasets?: Dataset[];
  query?: string;
};

type KnowledgeRetrievalOutputChunk = {
  content: string;
  title: string;
  url: string
  icon: string
}

export async function executeKnowledgeRetrievalNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as KnowledgeRetrievalInputData;
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

  const esQueries: Record<string, Record<string, unknown>> = {};

  for (const dataset of datasets) {
    const o = getDatasetById(dataset.id);
    if (o) {
      const embedding_config = mergeModelConfig(o.embedding_config);
      const embedded = await embedText(resolvedQuery, embedding_config);
      const rerankCfg = mergeRerankingConfig(o.reranking_config);
      const k = Math.max(10, rerankCfg.top_k);
      const allowedFileIds = getDocuments()
        .filter(
          (doc) => doc.dataset_id === dataset.id && doc.enabled && doc.deleted !== "true",
        )
        .map((doc) => doc.id);

      esQueries[dataset.id] = generateRagElasticsearchQuery({
        question: resolvedQuery,
        queryVector: embedded.vector,
        allowedFileIds,
        k,
        numCandidates: Math.max(k * 10, 100),
      });
    }
  }

  // const client = getElasticsearchClient();
  // if (client && Object.keys(esQueries).length > 0) {
  //   for (const [datasetId, body] of Object.entries(esQueries)) {
  //     const esResult = await client.search({
  //       index: RAG_CHUNKS_INDEX,
  //       ...body,
  //     });
  //     console.log("esResult", datasetId, esResult);
  //   }
  // }

  console.log("esQueries", JSON.stringify(esQueries, null, 2))

  const objResult:KnowledgeRetrievalOutputChunk[] = []

  return {
    output: {
      result: objResult,
      //
      query: resolvedQuery,
      ...(Object.keys(esQueries).length > 0 ? {es_queries: esQueries} : {}),
    },
    detail: `datasets=${datasets.length}`,
  };
}

