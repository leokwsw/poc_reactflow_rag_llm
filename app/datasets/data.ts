import chunksSource from "@/data/2-chunk.json";
import datasetsSource from "@/data/0-datasets.json";
import documentsSource from "@/data/1-documents.json";

export type Dataset = (typeof datasetsSource.datasets)[number];
export type DatasetDocument = (typeof documentsSource.documents)[number];
export type DocumentChunk = (typeof chunksSource.chunks)[number];

export const datasetGridColumns = "minmax(360px, 1fr) 110px 110px 120px 150px 120px";
export const documentGridColumns = "minmax(360px, 1fr) 120px 120px 150px 120px";
export const chunkGridColumns = "90px minmax(520px, 1fr) 160px 180px";

export const datasets = datasetsSource.datasets;
export const documents = documentsSource.documents;
export const chunks = chunksSource.chunks;

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

export const getDatasetById = (datasetId: string) => datasets.find((dataset) => dataset.id === datasetId);

export const getDocumentById = (fileId: string) => documents.find((document) => document.id === fileId);

export const getDocumentsForDataset = (datasetId: string) =>
  documents.filter((document) => document.dataset_id === datasetId && document.enabled);

export const getChunksForDocument = (fileId: string) =>
  chunks.filter((chunk) => chunk.file_id === fileId && chunk.enabled).sort((a, b) => a.position - b.position);

export const getDatasetStats = (dataset: Dataset) => {
  const datasetDocuments = getDocumentsForDataset(dataset.id);
  const documentIds = new Set(datasetDocuments.map((document) => document.id));
  const datasetChunks = chunks.filter((chunk) => documentIds.has(chunk.file_id) && chunk.enabled);
  const totalSize = datasetDocuments.reduce((sum, document) => sum + document.file_size, 0);

  return {
    chunkCount: datasetChunks.length,
    documentCount: datasetDocuments.length,
    documents: datasetDocuments,
    status: datasetDocuments.every((document) => document.status === "indexed") ? "Ready" : "Indexing",
    totalSize,
  };
};
