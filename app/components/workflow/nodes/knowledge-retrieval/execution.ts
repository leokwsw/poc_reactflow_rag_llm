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
type RetrievalSource = "vector" | "bm25";
type SourceRankMap = Partial<Record<RetrievalSource, number>>;
type SourceScoreMap = Partial<Record<RetrievalSource, number>>;

type KnowledgeRetrievalOutputChunk = {
  text: string;
  metadata: Record<string, unknown>;
  score: number;
  rank: number;
  score_ratio: number;
  quality_tier: QualityTier;
  retrieval_sources?: RetrievalSource[];
  source_scores?: SourceScoreMap;
  source_score_ratios?: SourceScoreMap;
  source_ranks?: SourceRankMap;
  rrf_score?: number;
}

type ElasticSearchHitSource = {
  text?: string;
  metadata?: Record<string, unknown>;
  vector?: number[];
  enabled?: boolean;
  deleted?: boolean;
}

const roundToFourDecimals = (value: number) => Math.round(value * 10_000) / 10_000;
const RRF_K = 60;
const BM25_WEIGHT = 0.4;
const VECTOR_WEIGHT = 0.6;

const getHitsTotalValue = (total: estypes.SearchTotalHits | number | undefined) => {
  if (typeof total === "number") return total;
  return total?.value ?? 0;
};

const getQualityTier = (scoreRatio: number): QualityTier => {
  if (scoreRatio >= 0.8) return "high";
  if (scoreRatio >= 0.5) return "medium";
  return "low";
};

const getSourceWeight = (source: RetrievalSource) => source === "bm25" ? BM25_WEIGHT : VECTOR_WEIGHT;

const buildBm25SearchBody = (body: Record<string, unknown>): Record<string, unknown> => ({
  query: body.query,
  size: body.size,
});

const getHitMergeKey = (hit: estypes.SearchHit<ElasticSearchHitSource>) => {
  const metadata = hit._source?.metadata ?? {};
  const fileId = typeof metadata.file_id === "string" ? metadata.file_id : "";
  const chunkIndex = typeof metadata.chunk_index === "number" || typeof metadata.chunk_index === "string"
    ? String(metadata.chunk_index)
    : "";
  return hit._id || `${fileId}:${chunkIndex}:${hit._source?.text ?? ""}`;
};

const createOutputChunk = (
  hit: estypes.SearchHit<ElasticSearchHitSource>,
  rank: number,
  maxScore: number,
  source: RetrievalSource,
): KnowledgeRetrievalOutputChunk => {
  const score = hit._score ?? 0;
  const scoreRatio = maxScore ? score / maxScore : 0;
  const finalScore = getSourceWeight(source) * scoreRatio;

  return {
    text: hit._source?.text ?? "",
    metadata: hit._source?.metadata ?? {},
    score: roundToFourDecimals(finalScore),
    rank,
    score_ratio: roundToFourDecimals(finalScore),
    quality_tier: getQualityTier(finalScore),
    retrieval_sources: [source],
    source_scores: {[source]: score},
    source_score_ratios: {[source]: roundToFourDecimals(scoreRatio)},
    source_ranks: {[source]: rank},
    rrf_score: 1 / (RRF_K + rank),
  };
};

const getScoreStats = (hitsList: estypes.SearchHit<ElasticSearchHitSource>[]) => {
  const scores = hitsList.map((hit) => hit._score ?? 0);
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const avgScore = scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;
  const scoreGap = scores.length > 0 ? Math.max(...scores) - minScore : 0;

  return {
    min_score: minScore,
    avg_score: avgScore,
    score_gap: scoreGap,
  };
};

const mergeRetrievalResults = (
  results: Array<{key: string; chunk: KnowledgeRetrievalOutputChunk}>,
): KnowledgeRetrievalOutputChunk[] => {
  const merged = new Map<string, KnowledgeRetrievalOutputChunk>();

  for (const {key, chunk} of results) {
    const current = merged.get(key);
    if (!current) {
      merged.set(key, {...chunk});
      continue;
    }

    const retrievalSources = new Set([...(current.retrieval_sources ?? []), ...(chunk.retrieval_sources ?? [])]);
    const sourceScores = {...current.source_scores, ...chunk.source_scores};
    const sourceScoreRatios = {...current.source_score_ratios, ...chunk.source_score_ratios};
    const sourceRanks = {...current.source_ranks, ...chunk.source_ranks};
    const rrfScore = (current.rrf_score ?? 0) + (chunk.rrf_score ?? 0);
    const bm25ScoreRatio = sourceScoreRatios.bm25 ?? 0;
    const vectorScoreRatio = sourceScoreRatios.vector ?? 0;
    const scoreRatio = (BM25_WEIGHT * bm25ScoreRatio) + (VECTOR_WEIGHT * vectorScoreRatio);

    merged.set(key, {
      ...current,
      score: roundToFourDecimals(scoreRatio),
      score_ratio: roundToFourDecimals(scoreRatio),
      quality_tier: getQualityTier(scoreRatio),
      retrieval_sources: Array.from(retrievalSources),
      source_scores: sourceScores,
      source_score_ratios: sourceScoreRatios,
      source_ranks: sourceRanks,
      rrf_score: roundToFourDecimals(rrfScore),
    });
  }

  return Array.from(merged.values())
    .sort((a, b) => (b.rrf_score ?? 0) - (a.rrf_score ?? 0) || b.score - a.score)
    .map((chunk, index) => ({
      ...chunk,
      rank: index + 1,
      rrf_score: roundToFourDecimals(chunk.rrf_score ?? 0),
    }));
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
  const allDocuments = await getDocuments();

  for (const dataset of datasets) {
    const o = await getDatasetById(dataset.id);
    if (o) {
      const embedding_config = mergeModelConfig(o.embedding_config);
      const embedded = await embedText(resolvedQuery, embedding_config);
      queryVectorDimensions[dataset.id] = embedded.vector.length;
      const rerankCfg = mergeRerankingConfig(o.reranking_config);
      const k = Math.max(10, rerankCfg.top_k);
      const allowedFileIds = allDocuments
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

  const vectorObjResult: Array<{key: string; chunk: KnowledgeRetrievalOutputChunk}> = [];
  const bm25ObjResult: Array<{key: string; chunk: KnowledgeRetrievalOutputChunk}> = [];
  let hitsTotal = 0;
  let hitsMaxScore = 1.0;
  const scoreStats: Record<string, {min_score: number; avg_score: number; score_gap: number}> = {};

  if (client && Object.keys(esQueries).length > 0) {
    for (const [datasetId, body] of Object.entries(esQueries)) {
      const indexStatus = await ensureRagChunksIndex(client, queryVectorDimensions[datasetId] ?? 0);
      if (!indexStatus.isDenseVector) {
        console.warn(
          `Skipping Elasticsearch KNN search for dataset ${datasetId}: ${indexStatus.reason} Recreate the index to enable vector search.`,
        );
      }

      if (indexStatus.isDenseVector) {
        const esResult = await client.search<ElasticSearchHitSource>({
          index: RAG_CHUNKS_INDEX,
          ...body,
        });
        const hitsList = esResult.hits.hits;
        hitsTotal += getHitsTotalValue(esResult.hits.total);
        const vectorMaxScore = esResult.hits.max_score ?? 1.0;
        hitsMaxScore = Math.max(hitsMaxScore, vectorMaxScore);
        scoreStats[`${datasetId}:vector`] = getScoreStats(hitsList);

        for (const [index, hit] of hitsList.entries()) {
          vectorObjResult.push({
            key: getHitMergeKey(hit),
            chunk: createOutputChunk(hit, index + 1, vectorMaxScore, "vector"),
          });
        }
      }

      const bm25Result = await client.search<ElasticSearchHitSource>({
        index: RAG_CHUNKS_INDEX,
        ...buildBm25SearchBody(body),
      });
      const bm25HitsList = bm25Result.hits.hits;
      hitsTotal += getHitsTotalValue(bm25Result.hits.total);
      const bm25MaxScore = bm25Result.hits.max_score ?? 1.0;
      hitsMaxScore = Math.max(hitsMaxScore, bm25MaxScore);
      scoreStats[`${datasetId}:bm25`] = getScoreStats(bm25HitsList);

      for (const [index, hit] of bm25HitsList.entries()) {
        bm25ObjResult.push({
          key: getHitMergeKey(hit),
          chunk: createOutputChunk(hit, index + 1, bm25MaxScore, "bm25"),
        });
      }
    }
  }

  const mergedResult = mergeRetrievalResults([...vectorObjResult, ...bm25ObjResult]);

  return {
    output: {
      result: mergedResult,
      query: resolvedQuery,
      hits_total: hitsTotal,
      hits_max_score: hitsMaxScore,
      score_stats: scoreStats,
      vector_result_count: vectorObjResult.length,
      bm25_result_count: bm25ObjResult.length,
    },
    detail: `datasets=${datasets.length}`,
  };
}
