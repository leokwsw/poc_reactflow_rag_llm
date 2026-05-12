import {interpolateTemplate} from "@/app/components/workflow/nodes/_base/execution-helpers";
import type {NodeExecutionContext, NodeExecutionResult} from "@/app/components/workflow/nodes/execution-types";
import {getDatasetById, getDocuments} from "@/app/datasets/data";
import {mergeModelConfig, mergeRerankingConfig} from "@/app/api/datasets/route";
import {embedText} from "@/app/datasets/queue";
import {generateRagElasticsearchQuery} from "@/app/components/workflow/nodes/knowledge-retrieval/generate-es-query";
import {ensureRagChunksIndex, getElasticsearchClient, RAG_CHUNKS_INDEX} from "@/app/lib/elasticsearch";
import type {estypes} from "@elastic/elasticsearch"

type Dataset = {
  id: string;
  name: string;
};

type KnowledgeRetrievalInputData = {
  datasets?: Dataset[];
  query?: string;
};

type QualityTier = "high" | "medium" | "low";

type KnowledgeRetrievalOutputChunk = {
  text: string;
  metadata: Record<string, unknown>;
  score: number;
  rank: number;
  score_ratio: number;
  quality_tier: QualityTier;
}

type ElasticSearchHitSource = {
  text?: string;
  metadata?: Record<string, unknown>;
  vector?: number[];
  enabled?: boolean;
  deleted?: boolean;
}

const roundToFourDecimals = (value: number) => Math.round(value * 10_000) / 10_000;

const getHitsTotalValue = (total: estypes.SearchTotalHits | number | undefined) => {
  if (typeof total === "number") return total;
  return total?.value ?? 0;
};

const getQualityTier = (scoreRatio: number): QualityTier => {
  if (scoreRatio >= 0.8) return "high";
  if (scoreRatio >= 0.5) return "medium";
  return "low";
};

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

  const esQueries: Record<string, Record<string, unknown>> = {};
  const queryVectorDimensions: Record<string, number> = {};

  for (const dataset of datasets) {
    const o = getDatasetById(dataset.id);
    if (o) {
      const embedding_config = mergeModelConfig(o.embedding_config);
      const embedded = await embedText(resolvedQuery, embedding_config);
      queryVectorDimensions[dataset.id] = embedded.vector.length;
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

  const client = getElasticsearchClient();

  const objResult: KnowledgeRetrievalOutputChunk[] = []
  let hitsTotal = 0;
  let hitsMaxScore = 1.0;

  if (client && Object.keys(esQueries).length > 0) {
    for (const [datasetId, body] of Object.entries(esQueries)) {
      const indexStatus = await ensureRagChunksIndex(client, queryVectorDimensions[datasetId] ?? 0);
      const searchBody = indexStatus.isDenseVector
        ? body
        : {
          query: body.query,
          size: body.size,
        };
      if (!indexStatus.isDenseVector) {
        console.warn(
          `Skipping Elasticsearch KNN search for dataset ${datasetId}: ${indexStatus.reason} Recreate the index to enable vector search.`,
        );
      }
      const esResult = await client.search<ElasticSearchHitSource>({
        index: RAG_CHUNKS_INDEX,
        ...searchBody,
      });
      const hitsList = esResult.hits.hits;
      hitsTotal += getHitsTotalValue(esResult.hits.total);
      hitsMaxScore = esResult.hits.max_score ?? 1.0;

      const scores = hitsList.map((hit) => hit._score ?? 0);
      const minScore = scores.length > 0 ? Math.min(...scores) : 0;
      const avgScore = scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;
      const scoreGap = scores.length > 0 ? Math.max(...scores) - minScore : 0;

      for (const [index, hit] of hitsList.entries()) {
        const score = hit._score ?? 0;
        const scoreRatio = hitsMaxScore ? score / hitsMaxScore : 0;

        objResult.push({
          text: hit._source?.text ?? "",
          metadata: hit._source?.metadata ?? {},
          score,
          rank: index + 1,
          score_ratio: roundToFourDecimals(scoreRatio),
          quality_tier: getQualityTier(scoreRatio),
        });
      }
    }
  }

  return {
    output: {
      result: objResult,
      query: resolvedQuery,
    },
    detail: `datasets=${datasets.length}`,
  };
}
