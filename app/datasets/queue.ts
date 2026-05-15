import {createHash, randomUUID} from "node:crypto";
import {
  dataPath,
  DatasetTask,
  DocumentChunk,
  EmbeddingRecord,
  getDatasetById,
  getDocumentById,
  insertTask,
  ModelConfig,
  readJsonFile,
  readTasks,
  updateDocumentRecord,
  updateTaskRecord,
  upsertChunks,
  upsertEmbeddings,
} from "@/app/datasets/data";
import {extractFileToText} from "@/app/datasets/extract-file-to-text";
import {ensureRagChunksIndex, getElasticsearchClient, RAG_CHUNKS_INDEX} from "@/app/lib/elasticsearch";
import {createTextSplitter} from "@/app/lib/text-splitter";
import {resolveModelConfig} from "@/app/model/data";

const now = () => new Date().toISOString();

const deterministicEmbedding = (text: string) => {
  const hash = createHash("sha256").update(text).digest();
  return Array.from({length: 32}, (_, index) => Number(((hash[index % hash.length] / 255) * 2 - 1).toFixed(6)));
};

export const embedText = async (text: string, config: ModelConfig): Promise<{
  provider: "api" | "local";
  vector: number[]
}> => {
  try {
    const modelConfig = await resolveModelConfig(config.model);
    if (!modelConfig.apiKey || !modelConfig.model) {
      throw new Error(`Model profile "${modelConfig.id}" is missing embedding API configuration.`);
    }

    const response = await fetch(`${modelConfig.apiBaseUrl.replace(/\/$/, "")}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${modelConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        model: modelConfig.model,
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
  const task = (await readTasks()).find((item) => item.id === taskId);
  if (!task) return;

  await updateTaskRecord(task.id, {status: "processing"});

  try {
    const fallbackConfig = readJsonFile<ModelConfig>("model-base.json", {
      api_base_url: "",
      api_key: "",
      model: "local-deterministic",
    });
    const dataset = await getDatasetById(task.dataset_id);
    const embeddingConfig = dataset?.embedding_config ?? fallbackConfig;
    const chunkSize = dataset?.chunk_config?.chunk_size ?? 1024;
    const chunkOverlap = dataset?.chunk_config?.chunk_overlap ?? 50;
    const languageHint = dataset?.language_hint ?? "chinese"
    const separators = dataset?.separators ?? "\n\n"
    const keepSeparators = dataset?.keep_separators ?? true

    const client = getElasticsearchClient();

    if (!client) {
      return false;
    }

    for (const documentId of task.document_ids) {
      const document = await getDocumentById(documentId);
      if (!document) continue;

      await updateDocumentRecord(document.id, {status: "processing"});

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

      await upsertChunks(nextChunks);
      await upsertEmbeddings(nextEmbeddings);
      await updateDocumentRecord(document.id, {status: "ready"});
    }

    await updateTaskRecord(task.id, {status: "ready"});
  } catch (error) {
    for (const documentId of task.document_ids) {
      await updateDocumentRecord(documentId, {status: "failed"});
    }
    await updateTaskRecord(task.id, {
      error: error instanceof Error ? error.message : "Task failed.",
      status: "failed",
    });
  }
};

export const enqueueDatasetTask = async (task: Omit<DatasetTask, "created_at" | "updated_at" | "status">) => {
  const timestamp = now();
  const queuedTask: DatasetTask = {
    ...task,
    status: "queued",
    created_at: timestamp,
    updated_at: timestamp,
  };

  await insertTask(queuedTask);
  setTimeout(() => {
    void processTask(queuedTask.id);
  }, 0);
};

export const createTaskId = () => `task-${randomUUID()}`;
