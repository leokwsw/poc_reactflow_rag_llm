import path from "node:path";
import {createHash, randomUUID} from "node:crypto";
import type {DatasetDocument, DocumentChunk} from "@/app/datasets/data";
import {dataPath, getChunks, getDatasetById, getDocuments, readJsonFile, writeJsonFile} from "@/app/datasets/data";
import {extractFileToText} from "@/app/datasets/extract-file-to-text";
import {getElasticsearchClient} from "@/app/lib/elasticsearch";

type DatasetTask = {
  id: string;
  dataset_id: string;
  document_ids: string[];
  file_paths: string[];
  status: "queued" | "processing" | "ready" | "failed";
  error?: string;
  created_at: string;
  updated_at: string;
};

type TasksJson = {
  tasks: DatasetTask[];
};

type EmbeddingRecord = {
  id: string;
  chunk_id: string;
  dataset_id: string;
  file_id: string;
  vector: number[];
  provider: "api" | "local";
  elasticsearch_saved: boolean;
  created_at: string;
};

type EmbeddingsJson = {
  embeddings: EmbeddingRecord[];
};

type EmbeddingConfig = {
  apiBaseUrl: string;
  apiKey: string;
  model: string;
};

const readTasks = () => readJsonFile<TasksJson>("3-tasks.json", {tasks: []});
const writeTasks = (value: TasksJson) => writeJsonFile("3-tasks.json", value);
const readEmbeddings = () => readJsonFile<EmbeddingsJson>("4-embeddings.json", {embeddings: []});
const writeEmbeddings = (value: EmbeddingsJson) => writeJsonFile("4-embeddings.json", value);

const now = () => new Date().toISOString();

const updateTask = (taskId: string, patch: Partial<DatasetTask>) => {
  const tasksJson = readTasks();
  writeTasks({
    tasks: tasksJson.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            ...patch,
            updated_at: now(),
          }
        : task,
    ),
  });
};

const updateDocument = (documentId: string, patch: Partial<DatasetDocument>) => {
  const documents = getDocuments();
  writeJsonFile("1-documents.json", {
    documents: documents.map((document) =>
      document.id === documentId
        ? {
            ...document,
            ...patch,
            updated_time: now(),
          }
        : document,
    ),
  });
};

const appendChunks = (nextChunks: DocumentChunk[]) => {
  const chunks = getChunks();
  const chunkIds = new Set(nextChunks.map((chunk) => chunk.id));
  writeJsonFile("2-chunk.json", {
    chunks: [...chunks.filter((chunk) => !chunkIds.has(chunk.id)), ...nextChunks],
  });
};

const appendEmbeddings = (nextEmbeddings: EmbeddingRecord[]) => {
  const embeddingsJson = readEmbeddings();
  const embeddingIds = new Set(nextEmbeddings.map((embedding) => embedding.id));
  writeEmbeddings({
    embeddings: [
      ...embeddingsJson.embeddings.filter((embedding) => !embeddingIds.has(embedding.id)),
      ...nextEmbeddings,
    ],
  });
};

const normalizeText = (text: string) =>
  text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const splitTextIntoChunks = (text: string, chunkSizeWords: number, overlapWords: number) => {
  const chunkSize = Math.max(1, Math.floor(chunkSizeWords));
  const overlap = Math.min(Math.max(0, Math.floor(overlapWords)), chunkSize - 1);
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let start = 0; start < words.length; start += chunkSize - overlap) {
    const chunk = words.slice(start, start + chunkSize).join(" ").trim();
    if (chunk) {
      chunks.push(chunk);
    }
  }

  return chunks.length > 0 ? chunks : ["No extractable text was found in this file."];
};

const deterministicEmbedding = (text: string) => {
  const hash = createHash("sha256").update(text).digest();
  return Array.from({length: 32}, (_, index) => Number(((hash[index % hash.length] / 255) * 2 - 1).toFixed(6)));
};

const embedText = async (text: string, config: EmbeddingConfig): Promise<{provider: "api" | "local"; vector: number[]}> => {
  try {
    const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        model: config.model,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding API returned ${response.status}`);
    }

    const payload = (await response.json()) as {data?: Array<{embedding?: number[]}>};
    const vector = payload.data?.[0]?.embedding;
    if (!vector?.length) {
      throw new Error("Embedding API response did not include a vector.");
    }

    return {provider: "api", vector};
  } catch {
    return {provider: "local", vector: deterministicEmbedding(text)};
  }
};

const saveEmbeddingToElasticsearch = async (embedding: EmbeddingRecord, chunk: DocumentChunk) => {
  const client = getElasticsearchClient();
  if (!client) {
    return false;
  }

  try {
    const response = await client.index({
      index: "rag_chunks",
      id: embedding.id,
      document: {
        chunk,
        embedding: embedding.vector,
      },
    });
    return response.result === "created" || response.result === "updated";
  } catch {
    return false;
  }
};

const processTask = async (taskId: string) => {
  const task = readTasks().tasks.find((item) => item.id === taskId);
  if (!task) return;

  updateTask(task.id, {status: "processing"});

  try {
    const fallbackConfig = readJsonFile<EmbeddingConfig>("model-base.json", {
      apiBaseUrl: "",
      apiKey: "",
      model: "local-deterministic",
    });
    const dataset = getDatasetById(task.dataset_id);
    const embeddingCfg = dataset?.embedding_config ?? fallbackConfig;
    const chunkSizeWords = dataset?.chunk_config?.chunk_size_words ?? 120;
    const overlapWords = dataset?.chunk_config?.overlap_words ?? 20;

    for (const documentId of task.document_ids) {
      const document = getDocuments().find((item) => item.id === documentId);
      if (!document) continue;

      updateDocument(document.id, {status: "processing"});

      const raw = await extractFileToText(dataPath(document.storage_page));
      const text = normalizeText(raw) || `Uploaded file ${path.basename(document.storage_page)} had no extractable text.`;
      const chunkTexts = splitTextIntoChunks(text, chunkSizeWords, overlapWords);
      const createdAt = now();
      const nextChunks: DocumentChunk[] = [];
      const nextEmbeddings: EmbeddingRecord[] = [];

      for (const [position, chunkText] of chunkTexts.entries()) {
        const chunkId = `chunk-${document.id}-${position + 1}`;
        const esDocumentId = `es-${document.id}-${position + 1}`;
        const chunk: DocumentChunk = {
          id: chunkId,
          file_id: document.id,
          text: chunkText,
          position,
          metadata: {
            page: position + 1,
            section: "Uploaded content",
            source: document.file_name,
          },
          es_document_id: esDocumentId,
          enabled: true,
        };
        const embedded = await embedText(chunkText, embeddingCfg);
        const embedding: EmbeddingRecord = {
          id: esDocumentId,
          chunk_id: chunkId,
          dataset_id: task.dataset_id,
          file_id: document.id,
          vector: embedded.vector,
          provider: embedded.provider,
          elasticsearch_saved: false,
          created_at: createdAt,
        };

        embedding.elasticsearch_saved = await saveEmbeddingToElasticsearch(embedding, chunk);
        nextChunks.push(chunk);
        nextEmbeddings.push(embedding);
      }

      appendChunks(nextChunks);
      appendEmbeddings(nextEmbeddings);
      updateDocument(document.id, {status: "ready"});
    }

    updateTask(task.id, {status: "ready"});
  } catch (error) {
    for (const documentId of task.document_ids) {
      updateDocument(documentId, {status: "failed"});
    }
    updateTask(task.id, {
      error: error instanceof Error ? error.message : "Task failed.",
      status: "failed",
    });
  }
};

export const enqueueDatasetTask = (task: Omit<DatasetTask, "created_at" | "updated_at" | "status">) => {
  const timestamp = now();
  const tasksJson = readTasks();
  const queuedTask: DatasetTask = {
    ...task,
    status: "queued",
    created_at: timestamp,
    updated_at: timestamp,
  };

  writeTasks({tasks: [...tasksJson.tasks, queuedTask]});
  setTimeout(() => {
    void processTask(queuedTask.id);
  }, 0);
};

export const createTaskId = () => `task-${randomUUID()}`;
