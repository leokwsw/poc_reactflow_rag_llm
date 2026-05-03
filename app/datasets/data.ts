import fs from "node:fs";
import path from "node:path";

type ModelConfig = {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
};

export type ChunkConfig = {
  chunk_size_words: number;
  overlap_words: number;
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

export const dataPath = (...segments: string[]) => path.join(process.cwd(), "data", ...segments);

export const datasetGridColumns = "minmax(360px, 1fr) 110px 110px 120px 150px 120px";
export const documentGridColumns = "minmax(360px, 1fr) 120px 120px 150px 120px";
export const chunkGridColumns = "90px minmax(520px, 1fr) 160px 180px";

export const readJsonFile = <T,>(fileName: string, fallback: T): T => {
  const filePath = dataPath(fileName);
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
};

export const writeJsonFile = (fileName: string, value: unknown) => {
  fs.mkdirSync(dataPath(), {recursive: true});
  fs.writeFileSync(dataPath(fileName), `${JSON.stringify(value, null, 2)}\n`);
};

export const getDatasets = () => readJsonFile<DatasetsJson>("0-datasets.json", {datasets: []}).datasets;

export const getDocuments = () => readJsonFile<DocumentsJson>("1-documents.json", {documents: []}).documents;

export const getChunks = () => readJsonFile<ChunksJson>("2-chunk.json", {chunks: []}).chunks;

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

export const getDatasetById = (datasetId: string) => getDatasets().find((dataset) => dataset.id === datasetId);

export const getDocumentById = (fileId: string) => getDocuments().find((document) => document.id === fileId);

export const getDocumentsForDataset = (datasetId: string) =>
  getDocuments().filter((document) => document.dataset_id === datasetId && document.enabled);

export const getChunksForDocument = (fileId: string) =>
  getChunks().filter((chunk) => chunk.file_id === fileId && chunk.enabled).sort((a, b) => a.position - b.position);

export const getDatasetStats = (dataset: Dataset) => {
  const datasetDocuments = getDocumentsForDataset(dataset.id);
  const documentIds = new Set(datasetDocuments.map((document) => document.id));
  const datasetChunks = getChunks().filter((chunk) => documentIds.has(chunk.file_id) && chunk.enabled);
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
