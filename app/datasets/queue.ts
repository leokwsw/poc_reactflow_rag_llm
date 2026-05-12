import {createHash, randomUUID} from "node:crypto";
import {DatasetDocument, DocumentChunk, ModelConfig} from "@/app/datasets/data";
import {dataPath, getChunks, getDatasetById, getDocuments, readJsonFile, writeJsonFile} from "@/app/datasets/data";
import {extractFileToText} from "@/app/datasets/extract-file-to-text";
import {ensureRagChunksIndex, getElasticsearchClient, RAG_CHUNKS_INDEX} from "@/app/lib/elasticsearch";
import {createTextSplitter} from "@/app/lib/text-splitter";

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

const deterministicEmbedding = (text: string) => {
  const hash = createHash("sha256").update(text).digest();
  return Array.from({length: 32}, (_, index) => Number(((hash[index % hash.length] / 255) * 2 - 1).toFixed(6)));
};

export const embedText = async (text: string, config: ModelConfig): Promise<{
  provider: "api" | "local";
  vector: number[]
}> => {
  try {
    const response = await fetch(`${config.api_base_url.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.api_key}`,
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

    const payload = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
    const vector = payload.data?.[0]?.embedding;
    if (!vector?.length) {
      throw new Error("Embedding API response did not include a vector.");
    }

    return {provider: "api", vector};
  } catch {
    return {provider: "local", vector: deterministicEmbedding(text)};
  }
};

const processTask = async (taskId: string) => {
  const task = readTasks().tasks.find((item) => item.id === taskId);
  if (!task) return;

  updateTask(task.id, {status: "processing"});

  try {
    const fallbackConfig = readJsonFile<ModelConfig>("model-base.json", {
      api_base_url: "",
      api_key: "",
      model: "local-deterministic",
    });
    const dataset = getDatasetById(task.dataset_id);
    const embeddingConfig = dataset?.embedding_config ?? fallbackConfig;
    const chunkSize = dataset?.chunk_config?.chunk_size ?? 120;
    const chunkOverlap = dataset?.chunk_config?.chunk_overlap ?? 20;
    const languageHint = dataset?.language_hint ?? "chinese"
    const separators = dataset?.separators ?? "\n\n"
    const keepSeparators = dataset?.keep_separators ?? true

    const client = getElasticsearchClient();

    if (!client) {
      return false;
    }

    for (const documentId of task.document_ids) {
      const document = getDocuments().find((item) => item.id === documentId);
      if (!document) continue;

      updateDocument(document.id, {status: "processing"});

      const raw = await extractFileToText(dataPath(document.storage_page)); // TODO : To Each Page string array
      const texts = raw.replace("\r\n", "")
      const textSplitter = createTextSplitter(
        texts,
        chunkSize,
        chunkOverlap,
        languageHint,
        [separators],
        keepSeparators,
      );
      const docs = await textSplitter.createDocuments([texts])

      const nextChunks: DocumentChunk[] = [];
      const nextEmbeddings: EmbeddingRecord[] = [];

      for (const [i, doc] of docs.entries()) {

        const createdAt = now();
        const chunkId = `chunk-${document.id}-${i + 1}`;

        const chunkMetaData = doc.metadata
        chunkMetaData["chunk_index"] = i + 1

        const embeddedVector = await embedText(doc.pageContent, embeddingConfig);
        const indexStatus = await ensureRagChunksIndex(client, embeddedVector.vector.length);
        if (!indexStatus.isDenseVector) {
          throw new Error(
            `${indexStatus.reason} Recreate the Elasticsearch index and re-run dataset ingestion.`,
          );
        }

        const extra_metadata = {...chunkMetaData}

        extra_metadata["file_id"] = documentId
        extra_metadata["file_name"] = document.file_name
        // extra_metadata["file_url"] = "File Access Url"
        // extra_metadata["file_category"] = "File Category"

        const esBody = {
          "text": doc.pageContent,
          "metadata": extra_metadata,
          "vector": embeddedVector.vector,
          "enabled": true,
          "deleted": false,
        }

        const esResponse = await client.index({
          index: RAG_CHUNKS_INDEX,
          document: esBody,
        })

        const chunk: DocumentChunk = {
          id: chunkId,
          file_id: document.id,
          text: doc.pageContent,
          position: i,
          metadata: {
            page: i + 1,
            section: "Uploaded content",
            source: document.file_name,
          },
          es_document_id: esResponse._id,
          enabled: true,
        };

        const embedding: EmbeddingRecord = {
          id: esResponse._id,
          chunk_id: chunkId,
          dataset_id: task.dataset_id,
          file_id: document.id,
          vector: embeddedVector.vector,
          provider: embeddedVector.provider,
          elasticsearch_saved: true,
          created_at: createdAt,
        };

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
