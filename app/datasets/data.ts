import fs from "node:fs";
import path from "node:path";
import {Pool} from "pg";
import {
  DEFAULT_EMBEDDING_MODEL_PROFILE_ID,
  DEFAULT_RERANKING_MODEL_PROFILE_ID,
  isModelProfileId,
} from "@/app/model/profiles";

export type ModelConfig = {
  api_base_url: string;
  api_key: string;
  model: string;
};

export type ChunkConfig = {
  chunk_size: number;
  chunk_overlap: number;
};

export type Dataset = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  embedding_config: ModelConfig;
  reranking_config: ModelConfig & {
    top_k: number;
    score: number;
  };
  chunk_config: ChunkConfig;
  language_hint: string;
  separators: string;
  keep_separators: boolean
};

export type DatasetDocument = {
  id: string;
  file_name: string;
  dataset_id: string;
  file_size: number;
  created_at: string;
  updated_time: string;
  uploaded_time: string;
  deleted: string;
  deleted_at: string;
  upload_source: string;
  mime_type: string;
  ext: string;
  storage_page: string;
  status: string;
  enabled: boolean;
};

export type DocumentChunk = {
  id: string;
  file_id: string;
  text: string;
  position: number;
  metadata: {
    page?: number;
    section?: string;
    source?: string;
  };
  es_document_id: string;
  enabled: boolean;
};

type DatasetsJson = {
  datasets: Dataset[];
};

type DocumentsJson = {
  documents: DatasetDocument[];
};

type ChunksJson = {
  chunks: DocumentChunk[];
};

export type DatasetTask = {
  id: string;
  dataset_id: string;
  document_ids: string[];
  file_paths: string[];
  status: "queued" | "processing" | "ready" | "failed";
  error?: string;
  created_at: string;
  updated_at: string;
};

export type EmbeddingRecord = {
  id: string;
  chunk_id: string;
  dataset_id: string;
  file_id: string;
  vector: number[];
  provider: "api" | "local";
  elasticsearch_saved: boolean;
  created_at: string;
};

type TasksJson = {
  tasks: DatasetTask[];
};

type EmbeddingsJson = {
  embeddings: EmbeddingRecord[];
};

const normalizeDatasetModelConfig = (value: unknown, fallbackModel: string): ModelConfig => {
  const config = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    api_base_url: "",
    api_key: "",
    model: isModelProfileId(config.model) ? config.model : fallbackModel,
  };
};

const normalizeDatasetRerankingConfig = (value: unknown): ModelConfig & {top_k: number; score: number} => {
  const config = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    ...normalizeDatasetModelConfig(config, DEFAULT_RERANKING_MODEL_PROFILE_ID),
    top_k: typeof config.top_k === "number" && Number.isFinite(config.top_k) ? Math.max(1, Math.floor(config.top_k)) : 3,
    score: typeof config.score === "number" && Number.isFinite(config.score) ? Math.min(1, Math.max(0, config.score)) : 0.5,
  };
};

export const dataPath = (...segments: string[]) => path.join(process.cwd(), "data", ...segments);

export const documentGridColumns = "minmax(360px, 1fr) 120px 120px 150px 120px";
export const chunkGridColumns = "90px minmax(520px, 1fr) 160px 180px";

export const readJsonFile = <T,>(fileName: string, fallback: T): T => {
  const filePath = dataPath(fileName);
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
};

const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? "10.0.0.209",
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? "postgres",
  password: process.env.POSTGRES_PASSWORD ?? "password",
  database: process.env.POSTGRES_DATABASE ?? "postgres",
  max: 10,
});

let schemaReady: Promise<void> | null = null;

const quoteIdentifier = (value: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`${value} is not a valid PostgreSQL identifier.`);
  }
  return `"${value}"`;
};

const postgresSchema = quoteIdentifier((process.env.POSTGRES_SCHEMA ?? "public").trim() || "public");
const tableName = (name: "datasets" | "documents" | "chunks" | "tasks" | "embeddings") =>
  `${postgresSchema}.${quoteIdentifier(name)}`;

const toIso = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  return new Date().toISOString();
};

const normalizeChunkConfig = (value: unknown): ChunkConfig => {
  const config = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const chunkSize = config.chunk_size ?? config.chunk_size_words;
  const chunkOverlap = config.chunk_overlap ?? config.overlap_words;
  return {
    chunk_size: typeof chunkSize === "number" ? chunkSize : 1024,
    chunk_overlap: typeof chunkOverlap === "number" ? chunkOverlap : 50,
  };
};

const datasetFromRow = (row: Record<string, unknown>): Dataset => ({
  id: String(row.id),
  title: String(row.title ?? ""),
  description: String(row.description ?? ""),
  created_at: toIso(row.created_at),
  updated_at: toIso(row.updated_at),
  embedding_config: normalizeDatasetModelConfig(row.embedding_config, DEFAULT_EMBEDDING_MODEL_PROFILE_ID),
  reranking_config: normalizeDatasetRerankingConfig(row.reranking_config),
  chunk_config: normalizeChunkConfig(row.chunk_config),
  language_hint: String(row.language_hint ?? "chinese"),
  separators: String(row.separators ?? "\n\n"),
  keep_separators: Boolean(row.keep_separators ?? true),
});

const documentFromRow = (row: Record<string, unknown>): DatasetDocument => ({
  id: String(row.id),
  file_name: String(row.file_name ?? ""),
  dataset_id: String(row.dataset_id ?? ""),
  file_size: Number(row.file_size ?? 0),
  created_at: toIso(row.created_at),
  updated_time: toIso(row.updated_time),
  uploaded_time: toIso(row.uploaded_time),
  deleted: String(row.deleted ?? "false"),
  deleted_at: String(row.deleted_at ?? ""),
  upload_source: String(row.upload_source ?? "file"),
  mime_type: String(row.mime_type ?? ""),
  ext: String(row.ext ?? ""),
  storage_page: String(row.storage_page ?? ""),
  status: String(row.status ?? "queued"),
  enabled: Boolean(row.enabled ?? true),
});

const chunkFromRow = (row: Record<string, unknown>): DocumentChunk => ({
  id: String(row.id),
  file_id: String(row.file_id ?? ""),
  text: String(row.text ?? ""),
  position: Number(row.position ?? 0),
  metadata: (row.metadata ?? {}) as DocumentChunk["metadata"],
  es_document_id: String(row.es_document_id ?? ""),
  enabled: Boolean(row.enabled ?? true),
});

const taskFromRow = (row: Record<string, unknown>): DatasetTask => ({
  id: String(row.id),
  dataset_id: String(row.dataset_id ?? ""),
  document_ids: row.document_ids as string[],
  file_paths: row.file_paths as string[],
  status: row.status as DatasetTask["status"],
  error: typeof row.error === "string" ? row.error : undefined,
  created_at: toIso(row.created_at),
  updated_at: toIso(row.updated_at),
});

const migrateJsonIfEmpty = async () => {
  const {rows} = await pool.query<{count: string}>(`SELECT COUNT(*)::text AS count FROM ${tableName("datasets")}`);
  if (Number(rows[0]?.count ?? 0) > 0) return;

  const datasets = readJsonFile<DatasetsJson>("0-datasets.json", {datasets: []}).datasets;
  const documents = readJsonFile<DocumentsJson>("1-documents.json", {documents: []}).documents;
  const chunks = readJsonFile<ChunksJson>("2-chunk.json", {chunks: []}).chunks;
  const tasks = readJsonFile<TasksJson>("3-tasks.json", {tasks: []}).tasks;
  const embeddings = readJsonFile<EmbeddingsJson>("4-embeddings.json", {embeddings: []}).embeddings;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const dataset of datasets) {
      await client.query(
        `INSERT INTO ${tableName("datasets")}
          (id, title, description, created_at, updated_at, embedding_config, reranking_config, chunk_config, language_hint, separators, keep_separators)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          dataset.id,
          dataset.title,
          dataset.description,
          dataset.created_at,
          dataset.updated_at,
          JSON.stringify(normalizeDatasetModelConfig(dataset.embedding_config, DEFAULT_EMBEDDING_MODEL_PROFILE_ID)),
          JSON.stringify(normalizeDatasetRerankingConfig(dataset.reranking_config)),
          JSON.stringify(dataset.chunk_config),
          dataset.language_hint ?? "chinese",
          dataset.separators ?? "\n\n",
          dataset.keep_separators ?? true,
        ],
      );
    }
    for (const document of documents) {
      await client.query(
        `INSERT INTO ${tableName("documents")}
          (id, file_name, dataset_id, file_size, created_at, updated_time, uploaded_time, deleted, deleted_at, upload_source, mime_type, ext, storage_page, status, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO NOTHING`,
        [
          document.id,
          document.file_name,
          document.dataset_id,
          document.file_size,
          document.created_at,
          document.updated_time,
          document.uploaded_time,
          document.deleted,
          document.deleted_at || null,
          document.upload_source,
          document.mime_type,
          document.ext,
          document.storage_page,
          document.status,
          document.enabled,
        ],
      );
    }
    for (const chunk of chunks) {
      await client.query(
        `INSERT INTO ${tableName("chunks")} (id, file_id, text, position, metadata, es_document_id, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, metadata = EXCLUDED.metadata, es_document_id = EXCLUDED.es_document_id`,
        [chunk.id, chunk.file_id, chunk.text, chunk.position, JSON.stringify(chunk.metadata), chunk.es_document_id, chunk.enabled],
      );
    }
    for (const task of tasks) {
      await client.query(
        `INSERT INTO ${tableName("tasks")} (id, dataset_id, document_ids, file_paths, status, error, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [task.id, task.dataset_id, task.document_ids, task.file_paths, task.status, task.error ?? null, task.created_at, task.updated_at],
      );
    }
    for (const embedding of embeddings) {
      await client.query(
        `INSERT INTO ${tableName("embeddings")} (id, chunk_id, dataset_id, file_id, vector, provider, elasticsearch_saved, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET vector = EXCLUDED.vector, elasticsearch_saved = EXCLUDED.elasticsearch_saved`,
        [
          embedding.id,
          embedding.chunk_id,
          embedding.dataset_id,
          embedding.file_id,
          JSON.stringify(embedding.vector),
          embedding.provider,
          embedding.elasticsearch_saved,
          embedding.created_at,
        ],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const ensureDatasetSchema = async () => {
  schemaReady ??= (async () => {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${postgresSchema}`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${tableName("datasets")} (
        id text PRIMARY KEY,
        title text NOT NULL,
        description text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        embedding_config jsonb NOT NULL,
        reranking_config jsonb NOT NULL,
        chunk_config jsonb NOT NULL,
        language_hint text NOT NULL DEFAULT 'chinese',
        separators text NOT NULL DEFAULT E'\\n\\n',
        keep_separators boolean NOT NULL DEFAULT true
      );
      CREATE TABLE IF NOT EXISTS ${tableName("documents")} (
        id text PRIMARY KEY,
        file_name text NOT NULL,
        dataset_id text NOT NULL REFERENCES ${tableName("datasets")}(id) ON DELETE CASCADE,
        file_size bigint NOT NULL,
        created_at timestamptz NOT NULL,
        updated_time timestamptz NOT NULL,
        uploaded_time timestamptz NOT NULL,
        deleted text NOT NULL DEFAULT 'false',
        deleted_at text NOT NULL DEFAULT '',
        upload_source text NOT NULL DEFAULT 'file',
        mime_type text NOT NULL DEFAULT '',
        ext text NOT NULL DEFAULT '',
        storage_page text NOT NULL,
        status text NOT NULL,
        enabled boolean NOT NULL DEFAULT true
      );
      CREATE INDEX IF NOT EXISTS documents_dataset_id_idx ON ${tableName("documents")}(dataset_id);
      CREATE TABLE IF NOT EXISTS ${tableName("chunks")} (
        id text PRIMARY KEY,
        file_id text NOT NULL REFERENCES ${tableName("documents")}(id) ON DELETE CASCADE,
        text text NOT NULL,
        position integer NOT NULL,
        metadata jsonb NOT NULL DEFAULT '{}',
        es_document_id text NOT NULL DEFAULT '',
        enabled boolean NOT NULL DEFAULT true
      );
      CREATE INDEX IF NOT EXISTS chunks_file_id_position_idx ON ${tableName("chunks")}(file_id, position);
      CREATE TABLE IF NOT EXISTS ${tableName("tasks")} (
        id text PRIMARY KEY,
        dataset_id text NOT NULL,
        document_ids text[] NOT NULL,
        file_paths text[] NOT NULL,
        status text NOT NULL,
        error text,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      );
      CREATE TABLE IF NOT EXISTS ${tableName("embeddings")} (
        id text PRIMARY KEY,
        chunk_id text NOT NULL,
        dataset_id text NOT NULL,
        file_id text NOT NULL,
        vector jsonb NOT NULL,
        provider text NOT NULL,
        elasticsearch_saved boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL
      );
      CREATE INDEX IF NOT EXISTS embeddings_chunk_id_idx ON ${tableName("embeddings")}(chunk_id);
      CREATE INDEX IF NOT EXISTS embeddings_dataset_id_idx ON ${tableName("embeddings")}(dataset_id);
    `);
    await migrateJsonIfEmpty();
  })();

  await schemaReady;
};

export const getDatasets = async () => {
  await ensureDatasetSchema();
  const {rows} = await pool.query(`SELECT * FROM ${tableName("datasets")} ORDER BY created_at DESC`);
  return rows.map(datasetFromRow);
};

export const getDocuments = async () => {
  await ensureDatasetSchema();
  const {rows} = await pool.query(`SELECT * FROM ${tableName("documents")} ORDER BY uploaded_time DESC`);
  return rows.map(documentFromRow);
};

export const getChunks = async () => {
  await ensureDatasetSchema();
  const {rows} = await pool.query(`SELECT * FROM ${tableName("chunks")} ORDER BY file_id, position`);
  return rows.map(chunkFromRow);
};

export const createDatasetWithDocuments = async (dataset: Dataset, documents: DatasetDocument[]) => {
  await ensureDatasetSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO ${tableName("datasets")}
        (id, title, description, created_at, updated_at, embedding_config, reranking_config, chunk_config, language_hint, separators, keep_separators)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        dataset.id,
        dataset.title,
        dataset.description,
        dataset.created_at,
        dataset.updated_at,
        JSON.stringify(normalizeDatasetModelConfig(dataset.embedding_config, DEFAULT_EMBEDDING_MODEL_PROFILE_ID)),
        JSON.stringify(normalizeDatasetRerankingConfig(dataset.reranking_config)),
        JSON.stringify(dataset.chunk_config),
        dataset.language_hint ?? "chinese",
        dataset.separators ?? "\n\n",
        dataset.keep_separators ?? true,
      ],
    );
    for (const document of documents) {
      await client.query(
        `INSERT INTO ${tableName("documents")}
          (id, file_name, dataset_id, file_size, created_at, updated_time, uploaded_time, deleted, deleted_at, upload_source, mime_type, ext, storage_page, status, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          document.id,
          document.file_name,
          document.dataset_id,
          document.file_size,
          document.created_at,
          document.updated_time,
          document.uploaded_time,
          document.deleted,
          document.deleted_at,
          document.upload_source,
          document.mime_type,
          document.ext,
          document.storage_page,
          document.status,
          document.enabled,
        ],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const readTasks = async () => {
  await ensureDatasetSchema();
  const {rows} = await pool.query(`SELECT * FROM ${tableName("tasks")} ORDER BY created_at DESC`);
  return rows.map(taskFromRow);
};

export const insertTask = async (task: DatasetTask) => {
  await ensureDatasetSchema();
  await pool.query(
    `INSERT INTO ${tableName("tasks")} (id, dataset_id, document_ids, file_paths, status, error, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [task.id, task.dataset_id, task.document_ids, task.file_paths, task.status, task.error ?? null, task.created_at, task.updated_at],
  );
};

export const updateTaskRecord = async (taskId: string, patch: Partial<DatasetTask>) => {
  await ensureDatasetSchema();
  const current = (await readTasks()).find((task) => task.id === taskId);
  if (!current) return;
  const next = {...current, ...patch, updated_at: new Date().toISOString()};
  await pool.query(
    `UPDATE ${tableName("tasks")}
     SET dataset_id = $2, document_ids = $3, file_paths = $4, status = $5, error = $6, updated_at = $7
     WHERE id = $1`,
    [next.id, next.dataset_id, next.document_ids, next.file_paths, next.status, next.error ?? null, next.updated_at],
  );
};

export const updateDocumentRecord = async (documentId: string, patch: Partial<DatasetDocument>) => {
  await ensureDatasetSchema();
  const current = (await getDocuments()).find((document) => document.id === documentId);
  if (!current) return;
  const next = {...current, ...patch, updated_time: new Date().toISOString()};
  await pool.query(
    `UPDATE ${tableName("documents")}
     SET file_name = $2, dataset_id = $3, file_size = $4, created_at = $5, updated_time = $6, uploaded_time = $7,
         deleted = $8, deleted_at = $9, upload_source = $10, mime_type = $11, ext = $12, storage_page = $13,
         status = $14, enabled = $15
     WHERE id = $1`,
    [
      next.id,
      next.file_name,
      next.dataset_id,
      next.file_size,
      next.created_at,
      next.updated_time,
      next.uploaded_time,
      next.deleted,
      next.deleted_at,
      next.upload_source,
      next.mime_type,
      next.ext,
      next.storage_page,
      next.status,
      next.enabled,
    ],
  );
};

export const upsertChunks = async (nextChunks: DocumentChunk[]) => {
  await ensureDatasetSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const chunk of nextChunks) {
      await client.query(
        `INSERT INTO ${tableName("chunks")} (id, file_id, text, position, metadata, es_document_id, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE
         SET file_id = EXCLUDED.file_id, text = EXCLUDED.text, position = EXCLUDED.position,
             metadata = EXCLUDED.metadata, es_document_id = EXCLUDED.es_document_id, enabled = EXCLUDED.enabled`,
        [chunk.id, chunk.file_id, chunk.text, chunk.position, JSON.stringify(chunk.metadata), chunk.es_document_id, chunk.enabled],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const upsertEmbeddings = async (nextEmbeddings: EmbeddingRecord[]) => {
  await ensureDatasetSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const embedding of nextEmbeddings) {
      await client.query(
        `INSERT INTO ${tableName("embeddings")} (id, chunk_id, dataset_id, file_id, vector, provider, elasticsearch_saved, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE
         SET chunk_id = EXCLUDED.chunk_id, dataset_id = EXCLUDED.dataset_id, file_id = EXCLUDED.file_id,
             vector = EXCLUDED.vector, provider = EXCLUDED.provider, elasticsearch_saved = EXCLUDED.elasticsearch_saved`,
        [
          embedding.id,
          embedding.chunk_id,
          embedding.dataset_id,
          embedding.file_id,
          JSON.stringify(embedding.vector),
          embedding.provider,
          embedding.elasticsearch_saved,
          embedding.created_at,
        ],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

export const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

export const getDatasetById = async (datasetId: string) => {
  await ensureDatasetSchema();
  const {rows} = await pool.query(`SELECT * FROM ${tableName("datasets")} WHERE id = $1`, [datasetId]);
  return rows[0] ? datasetFromRow(rows[0]) : undefined;
};

export const getDocumentById = async (fileId: string) => {
  await ensureDatasetSchema();
  const {rows} = await pool.query(`SELECT * FROM ${tableName("documents")} WHERE id = $1`, [fileId]);
  return rows[0] ? documentFromRow(rows[0]) : undefined;
};

export const getDocumentsForDataset = (datasetId: string) =>
  getDocuments().then((documents) => documents.filter((document) => document.dataset_id === datasetId && document.enabled));

export const getChunksForDocument = (fileId: string) =>
  getChunks().then((chunks) => chunks.filter((chunk) => chunk.file_id === fileId && chunk.enabled).sort((a, b) => a.position - b.position));

export const getDatasetStats = async (dataset: Dataset) => {
  const datasetDocuments = await getDocumentsForDataset(dataset.id);
  const documentIds = new Set(datasetDocuments.map((document) => document.id));
  const datasetChunks = (await getChunks()).filter((chunk) => documentIds.has(chunk.file_id) && chunk.enabled);
  const totalSize = datasetDocuments.reduce((sum, document) => sum + document.file_size, 0);

  const statuses = new Set(datasetDocuments.map((document) => document.status));
  const status = statuses.has("failed")
    ? "Failed"
    : datasetDocuments.length > 0 && datasetDocuments.every((document) => ["indexed", "ready"].includes(document.status))
      ? "Ready"
      : statuses.has("processing")
        ? "Processing"
        : "Queued";

  return {
    chunkCount: datasetChunks.length,
    documentCount: datasetDocuments.length,
    documents: datasetDocuments,
    status,
    totalSize,
  };
};
