import {Client} from "@elastic/elasticsearch";

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

