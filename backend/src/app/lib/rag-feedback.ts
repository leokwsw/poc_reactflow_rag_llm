import {dbQuery} from "@/app/lib/typeorm-query";

export type RagFeedbackRating = "positive" | "negative";

export type RagFeedbackInput = {
  dataset_id: string;
  chunk_id?: string;
  query: string;
  rating: RagFeedbackRating;
  note?: string;
};

export type RagFeedbackHint = {
  chunk_id: string;
  positive_count: number;
  negative_count: number;
};

let schemaReady: Promise<void> | null = null;

const quoteIdentifier = (value: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`${value} is not a valid PostgreSQL identifier.`);
  }
  return `"${value}"`;
};

const postgresSchema = quoteIdentifier((process.env.POSTGRES_SCHEMA ?? "public").trim() || "public");
const tableName = `${postgresSchema}.${quoteIdentifier("rag_feedback")}`;

const ensureFeedbackSchema = async () => {
  schemaReady ??= (async () => {
    await dbQuery(`CREATE SCHEMA IF NOT EXISTS ${postgresSchema}`);
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id text PRIMARY KEY,
        dataset_id text NOT NULL,
        chunk_id text NOT NULL DEFAULT '',
        query text NOT NULL,
        rating text NOT NULL,
        note text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL
      );
      CREATE INDEX IF NOT EXISTS rag_feedback_dataset_chunk_idx ON ${tableName}(dataset_id, chunk_id);
      CREATE INDEX IF NOT EXISTS rag_feedback_query_idx ON ${tableName}(dataset_id, query);
    `);
  })();

  await schemaReady;
};

export async function saveRagFeedback(input: RagFeedbackInput) {
  await ensureFeedbackSchema();
  const id = `feedback-${crypto.randomUUID()}`;
  await dbQuery(
    `INSERT INTO ${tableName} (id, dataset_id, chunk_id, query, rating, note, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      id,
      input.dataset_id,
      input.chunk_id ?? "",
      input.query,
      input.rating,
      input.note ?? "",
      new Date().toISOString(),
    ],
  );
  return {id};
}

export async function getRagFeedbackHints(datasetIds: string[], query: string): Promise<RagFeedbackHint[]> {
  if (datasetIds.length === 0) return [];
  await ensureFeedbackSchema();
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2)
    .slice(0, 8);

  const {rows} = await dbQuery(
    `
    SELECT
      chunk_id,
      SUM(CASE WHEN rating = 'positive' THEN 1 ELSE 0 END)::int AS positive_count,
      SUM(CASE WHEN rating = 'negative' THEN 1 ELSE 0 END)::int AS negative_count
    FROM ${tableName}
    WHERE dataset_id = ANY($1)
      AND chunk_id <> ''
      AND (
        query ILIKE $2
        OR EXISTS (
          SELECT 1 FROM unnest($3::text[]) AS term
          WHERE lower(query) LIKE '%' || lower(term) || '%'
        )
      )
    GROUP BY chunk_id
    ORDER BY positive_count DESC, negative_count ASC
    LIMIT 50
    `,
    [datasetIds, `%${query}%`, terms],
  );

  return rows.map((row) => ({
    chunk_id: String(row.chunk_id),
    positive_count: Number(row.positive_count ?? 0),
    negative_count: Number(row.negative_count ?? 0),
  }));
}

