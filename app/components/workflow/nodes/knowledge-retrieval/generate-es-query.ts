/**
 * Builds an Elasticsearch body with top-level `knn`, hybrid `bool` filters, and `match` on text —
 * same shape as ezchat_rag_sys `service.py` `_generate_es_query`.
 * Indexed docs: `{ text, metadata, vector, enabled, deleted }` (see `queue.ts` / Python RAG index).
 */
export type GenerateRagEsQueryParams = {
  question: string;
  queryVector: number[];
  /** Active, non-deleted documents in the dataset (filters `metadata.file_id`). */
  allowedFileIds: string[];
  k?: number;
  numCandidates?: number;
  knnBoosts?: Record<string, number>;
  /** Dense vector field name in the index. */
  vectorField?: string;
  /** Text field for hybrid BM25-style `match` (logical key in boosts is still `text`). */
  textField?: string;
};

export function generateRagElasticsearchQuery(params: GenerateRagEsQueryParams): Record<string, unknown> {
  const {
    question,
    queryVector,
    allowedFileIds,
    k = 10,
    numCandidates = 100,
    knnBoosts: rawBoosts,
    vectorField = "vector",
    textField = "text",
  } = params;

  const knnBoosts: Record<string, number> = {vector: 0.07, ...rawBoosts};

  const queryTexts: Record<string, string> = {
    text: question,
  };

  const queryVectors: Record<string, number[]> = {
    vector: queryVector,
  };

  const esQuery: Record<string, unknown> = {
    knn: Object.entries(queryVectors).map(([fieldName, fieldVector]) => ({
      field: fieldName === "vector" ? vectorField : fieldName,
      query_vector: fieldVector,
      k,
      num_candidates: numCandidates,
      boost: knnBoosts[fieldName] ?? 1.0,
    })),
    size: k,
  };

  const queryBool: Record<string, unknown> = {
    must_not: [{term: {deleted: true}}, {term: {enabled: false}}],
  };

  queryBool.must =
    allowedFileIds.length > 0
      ? [{terms: {"metadata.file_id": allowedFileIds}}]
      : [{match_none: {}}];

  const should: unknown[] = [];
  for (const [fieldName, fieldText] of Object.entries(queryTexts)) {
    const matchField = fieldName === "text" ? textField : fieldName;
    should.push({
      match: {
        [matchField]: {
          query: fieldText,
          boost: knnBoosts[fieldName] ?? 1.0,
        },
      },
    });
  }
  queryBool.should = should;

  esQuery.query = {
    bool: queryBool,
  };

  return esQuery;
}
