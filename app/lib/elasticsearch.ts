import {Client} from "@elastic/elasticsearch";

export const RAG_CHUNKS_INDEX = "rag_chunks";

const resourceAlreadyExists = (error: unknown): boolean => {
  if (!error || typeof error !== "object" || !("meta" in error)) {
    return false;
  }
  const meta = (error as {meta?: {statusCode?: number; body?: {error?: {type?: string}}}}).meta;
  return meta?.body?.error?.type === "resource_already_exists_exception";
};

/**
 * Creates `rag_chunks` with `vector` as indexed `dense_vector` (required for top-level `knn`).
 * Safe to call repeatedly. If the index already exists (any mapping), this no-ops — delete the index
 * and re-index if mapping was created by dynamic templates without `dense_vector`.
 */
export const ensureRagChunksIndex = async (client: Client, vectorDims: number) => {
  if (!Number.isFinite(vectorDims) || vectorDims < 1) {
    throw new Error("ensureRagChunksIndex: vectorDims must be a positive number.");
  }

  const exists = await client.indices.exists({index: RAG_CHUNKS_INDEX});
  if (exists) {
    return;
  }

  try {
    await client.indices.create({
      index: RAG_CHUNKS_INDEX,
      mappings: {
        properties: {
          text: {type: "text"},
          vector: {
            type: "dense_vector",
            dims: vectorDims,
            index: true,
            similarity: "cosine",
          },
          enabled: {type: "boolean"},
          deleted: {type: "boolean"},
          metadata: {
            type: "object",
            properties: {
              file_id: {type: "keyword"},
              chunk_id: {type: "keyword"},
              dataset_id: {type: "keyword"},
              es_document_id: {type: "keyword"},
              position: {type: "integer"},
              page: {type: "integer"},
              section: {type: "keyword"},
              source: {
                type: "text",
                fields: {keyword: {type: "keyword", ignore_above: 256}},
              },
            },
          },
        },
      },
    });
  } catch (error) {
    if (!resourceAlreadyExists(error)) {
      throw error;
    }
  }
};

type ElasticsearchConfig = {
  node: string;
  username: string;
  password: string;
};

const trimEnv = (name: string) => process.env[name]?.trim() || "";

let client: Client | null = null;
let clientNode = "";

const getConfiguredNode = () => {
  const legacyUrl = trimEnv("ELASTICSEARCH_URL");
  if (legacyUrl) {
    return legacyUrl.replace(/\/$/, "");
  }

  const hostname = trimEnv("ELASTICSEARCH_HOSTNAME");
  const port = trimEnv("ELASTICSEARCH_PORT");
  const protocol = (trimEnv("ELASTICSEARCH_PROTOCOL") || "http").replace(/:$/, "");

  if (!hostname && !port) {
    return "";
  }

  if (!hostname) {
    throw new Error("ELASTICSEARCH_HOSTNAME is required when configuring Elasticsearch.");
  }

  if (!port) {
    throw new Error("ELASTICSEARCH_PORT is required when configuring Elasticsearch.");
  }

  if (!/^\d+$/.test(port)) {
    throw new Error("ELASTICSEARCH_PORT must be a number.");
  }

  if (protocol !== "http" && protocol !== "https") {
    throw new Error("ELASTICSEARCH_PROTOCOL must be http or https.");
  }

  if (/^https?:\/\//i.test(hostname)) {
    const url = new URL(hostname);
    url.port = port;
    return url.toString().replace(/\/$/, "");
  }

  return `${protocol}://${hostname}:${port}`;
};

const getConfig = (): ElasticsearchConfig | null => {
  const node = getConfiguredNode();
  const username = trimEnv("ELASTICSEARCH_USERNAME");
  const password = trimEnv("ELASTICSEARCH_PASSWORD");

  if (!node && !username && !password) {
    return null;
  }

  if (!node) {
    throw new Error("Elasticsearch host and port are required.");
  }

  if (!username) {
    throw new Error("ELASTICSEARCH_USERNAME is required when configuring Elasticsearch.");
  }

  if (!password) {
    throw new Error("ELASTICSEARCH_PASSWORD is required when configuring Elasticsearch.");
  }

  return {node, username, password};
};

export const getElasticsearchClient = () => {
  const config = getConfig();
  if (!config) {
    return null;
  }

  if (!client || clientNode !== config.node) {
    client = new Client({
      node: config.node,
      auth: {
        username: config.username,
        password: config.password,
      },
      requestTimeout: 30_000,
    });
    clientNode = config.node;
  }

  return client;
};

