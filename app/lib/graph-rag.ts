type GraphEngine = "neo4j" | "arangodb";

export type GraphTriple = {
  subject: string;
  predicate: string;
  object: string;
};

export type GraphChunkInput = {
  id: string;
  datasetId: string;
  fileId: string;
  fileName: string;
  text: string;
  position: number;
};

export type GraphRagResult = {
  engine: GraphEngine;
  subject: string;
  predicate: string;
  object: string;
  chunk_id?: string;
  file_id?: string;
  file_name?: string;
  text?: string;
  score: number;
};

type GraphRagConfig = {
  enabled: boolean;
  neo4j: {
    enabled: boolean;
    endpoint: string;
    username: string;
    password: string;
    database: string;
  };
  arango: {
    enabled: boolean;
    endpoint: string;
    username: string;
    password: string;
    database: string;
    entityCollection: string;
    edgeCollection: string;
    chunkCollection: string;
  };
};

type Neo4jValue = {
  row?: unknown[];
};

type Neo4jResponse = {
  results?: Array<{
    data?: Neo4jValue[];
  }>;
  errors?: Array<{message?: string}>;
};

type ArangoCursorResponse<T> = {
  result?: T[];
  error?: boolean;
  errorMessage?: string;
};

const DEFAULT_ENTITY_COLLECTION = "kg_entities";
const DEFAULT_EDGE_COLLECTION = "kg_edges";
const DEFAULT_CHUNK_COLLECTION = "kg_chunks";

const normalizeEndpoint = (value: string, fallback: string) =>
  (value.trim() || fallback).replace(/\/$/, "");

export function getGraphRagConfig(): GraphRagConfig {
  const neo4jEndpoint = normalizeEndpoint(process.env.NEO4J_URI ?? "", "http://localhost:7474");
  const arangoEndpoint = normalizeEndpoint(process.env.ARANGODB_URL ?? "", "http://localhost:8529");
  const neo4jEnabled = (process.env.GRAPH_RAG_NEO4J_ENABLED ?? "false").toLowerCase() === "true";
  const arangoEnabled = (process.env.GRAPH_RAG_ARANGODB_ENABLED ?? "false").toLowerCase() === "true";

  return {
    enabled: neo4jEnabled || arangoEnabled,
    neo4j: {
      enabled: neo4jEnabled,
      endpoint: neo4jEndpoint,
      username: process.env.NEO4J_USERNAME ?? "neo4j",
      password: process.env.NEO4J_PASSWORD ?? "",
      database: process.env.NEO4J_DATABASE ?? "neo4j",
    },
    arango: {
      enabled: arangoEnabled,
      endpoint: arangoEndpoint,
      username: process.env.ARANGODB_USERNAME ?? "root",
      password: process.env.ARANGODB_PASSWORD ?? "",
      database: process.env.ARANGODB_DATABASE ?? "_system",
      entityCollection: process.env.ARANGODB_ENTITY_COLLECTION ?? DEFAULT_ENTITY_COLLECTION,
      edgeCollection: process.env.ARANGODB_EDGE_COLLECTION ?? DEFAULT_EDGE_COLLECTION,
      chunkCollection: process.env.ARANGODB_CHUNK_COLLECTION ?? DEFAULT_CHUNK_COLLECTION,
    },
  };
}

function authHeader(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function cleanGraphText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[{}[\]()"“”‘’]/g, "")
    .trim()
    .slice(0, 180);
}

function makeEntityKey(datasetId: string, value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "");
  const base = normalized || Buffer.from(value).toString("hex").slice(0, 32);
  return `${datasetId.replace(/[^a-zA-Z0-9_-]/g, "_")}__${base}`.slice(0, 240);
}

function makeEdgeKey(chunkId: string, index: number) {
  return `${chunkId.replace(/[^a-zA-Z0-9_-]/g, "_")}__${index}`.slice(0, 240);
}

const RELATION_PATTERNS: Array<{predicate: string; pattern: RegExp}> = [
  {predicate: "is", pattern: /(.{2,80}?)(?:\s+is\s+|\s+are\s+|\s+was\s+|\s+were\s+)(.{2,120})/i},
  {predicate: "includes", pattern: /(.{2,80}?)(?:\s+includes\s+|\s+contains\s+|\s+has\s+)(.{2,120})/i},
  {predicate: "causes", pattern: /(.{2,80}?)(?:\s+causes\s+|\s+leads to\s+|\s+results in\s+)(.{2,120})/i},
  {predicate: "屬於", pattern: /(.{2,80}?)(?:屬於|是|為)(.{2,120})/},
  {predicate: "包含", pattern: /(.{2,80}?)(?:包含|包括|具有)(.{2,120})/},
  {predicate: "導致", pattern: /(.{2,80}?)(?:導致|造成|引致|影響)(.{2,120})/},
];

export function extractGraphTriples(text: string, limit = 8): GraphTriple[] {
  const triples: GraphTriple[] = [];
  const seen = new Set<string>();
  const sentences = text
    .split(/(?<=[。！？!?.;；])|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 24);

  for (const sentence of sentences) {
    for (const {predicate, pattern} of RELATION_PATTERNS) {
      const match = sentence.match(pattern);
      if (!match) continue;

      const subject = cleanGraphText(match[1] ?? "");
      const object = cleanGraphText(match[2] ?? "");
      if (subject.length < 2 || object.length < 2) continue;

      const key = `${subject}|${predicate}|${object}`.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      triples.push({subject, predicate, object});
      if (triples.length >= limit) return triples;
    }
  }

  return triples;
}

async function neo4jQuery(statement: string, parameters: Record<string, unknown>) {
  const config = getGraphRagConfig().neo4j;
  const response = await fetch(`${config.endpoint}/db/${encodeURIComponent(config.database)}/tx/commit`, {
    method: "POST",
    headers: {
      Authorization: authHeader(config.username, config.password),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({statements: [{statement, parameters}]}),
  });
  const payload = (await response.json().catch(() => ({}))) as Neo4jResponse;
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? `Neo4j request failed with status ${response.status}.`);
  }
  return payload;
}

async function arangoRequest<T>(path: string, body: Record<string, unknown>) {
  const config = getGraphRagConfig().arango;
  const response = await fetch(`${config.endpoint}/_db/${encodeURIComponent(config.database)}${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(config.username, config.password),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as ArangoCursorResponse<T>;
  if (!response.ok || payload.error) {
    throw new Error(payload.errorMessage ?? `ArangoDB request failed with status ${response.status}.`);
  }
  return payload;
}

async function ensureArangoCollection(name: string, type: 2 | 3) {
  const config = getGraphRagConfig().arango;
  const response = await fetch(`${config.endpoint}/_db/${encodeURIComponent(config.database)}/_api/collection`, {
    method: "POST",
    headers: {
      Authorization: authHeader(config.username, config.password),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({name, type}),
  });
  if (response.ok || response.status === 409) return;
  const payload = (await response.json().catch(() => ({}))) as {errorMessage?: string};
  throw new Error(payload.errorMessage ?? `Could not create ArangoDB collection "${name}".`);
}

async function upsertNeo4jGraphChunk(chunk: GraphChunkInput, triples: GraphTriple[]) {
  if (triples.length === 0) return;
  await neo4jQuery(
    `
    MERGE (c:Chunk {id: $chunk.id})
    SET c.dataset_id = $chunk.datasetId,
        c.file_id = $chunk.fileId,
        c.file_name = $chunk.fileName,
        c.text = $chunk.text,
        c.position = $chunk.position
    WITH c
    UNWIND $triples AS triple
    MERGE (s:Entity {key: triple.subjectKey})
    SET s.name = triple.subject, s.dataset_id = $chunk.datasetId
    MERGE (o:Entity {key: triple.objectKey})
    SET o.name = triple.object, o.dataset_id = $chunk.datasetId
    MERGE (s)-[r:RELATED_TO {dataset_id: $chunk.datasetId, chunk_id: $chunk.id, predicate: triple.predicate}]->(o)
    SET r.file_id = $chunk.fileId, r.file_name = $chunk.fileName, r.text = $chunk.text
    MERGE (c)-[:MENTIONS]->(s)
    MERGE (c)-[:MENTIONS]->(o)
    `,
    {
      chunk,
      triples: triples.map((triple) => ({
        ...triple,
        subjectKey: makeEntityKey(chunk.datasetId, triple.subject),
        objectKey: makeEntityKey(chunk.datasetId, triple.object),
      })),
    },
  );
}

async function upsertArangoGraphChunk(chunk: GraphChunkInput, triples: GraphTriple[]) {
  if (triples.length === 0) return;
  const config = getGraphRagConfig().arango;
  await ensureArangoCollection(config.entityCollection, 2);
  await ensureArangoCollection(config.chunkCollection, 2);
  await ensureArangoCollection(config.edgeCollection, 3);

  await arangoRequest("/_api/cursor", {
    query: `
      UPSERT {_key: @chunk.id}
      INSERT {_key: @chunk.id, dataset_id: @chunk.datasetId, file_id: @chunk.fileId, file_name: @chunk.fileName, text: @chunk.text, position: @chunk.position}
      UPDATE {dataset_id: @chunk.datasetId, file_id: @chunk.fileId, file_name: @chunk.fileName, text: @chunk.text, position: @chunk.position}
      IN @@chunkCollection
      FOR triple IN @triples
        UPSERT {_key: triple.subjectKey}
        INSERT {_key: triple.subjectKey, name: triple.subject, dataset_id: @chunk.datasetId}
        UPDATE {name: triple.subject, dataset_id: @chunk.datasetId}
        IN @@entityCollection
        UPSERT {_key: triple.objectKey}
        INSERT {_key: triple.objectKey, name: triple.object, dataset_id: @chunk.datasetId}
        UPDATE {name: triple.object, dataset_id: @chunk.datasetId}
        IN @@entityCollection
        UPSERT {_key: triple.edgeKey}
        INSERT {
          _key: triple.edgeKey,
          _from: CONCAT(@entityCollection, "/", triple.subjectKey),
          _to: CONCAT(@entityCollection, "/", triple.objectKey),
          dataset_id: @chunk.datasetId,
          chunk_id: @chunk.id,
          file_id: @chunk.fileId,
          file_name: @chunk.fileName,
          predicate: triple.predicate,
          text: @chunk.text
        }
        UPDATE {predicate: triple.predicate, text: @chunk.text, file_name: @chunk.fileName}
        IN @@edgeCollection
    `,
    bindVars: {
      "@entityCollection": config.entityCollection,
      "@edgeCollection": config.edgeCollection,
      "@chunkCollection": config.chunkCollection,
      entityCollection: config.entityCollection,
      chunk,
      triples: triples.map((triple, index) => ({
        ...triple,
        subjectKey: makeEntityKey(chunk.datasetId, triple.subject),
        objectKey: makeEntityKey(chunk.datasetId, triple.object),
        edgeKey: makeEdgeKey(chunk.id, index + 1),
      })),
    },
  });
}

export async function upsertGraphChunk(chunk: GraphChunkInput) {
  const config = getGraphRagConfig();
  if (!config.enabled) return {triples: [], warnings: [] as string[]};

  const triples = extractGraphTriples(chunk.text);
  const warnings: string[] = [];

  if (config.neo4j.enabled) {
    try {
      await upsertNeo4jGraphChunk(chunk, triples);
    } catch (error) {
      warnings.push(`Neo4j graph indexing skipped for ${chunk.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (config.arango.enabled) {
    try {
      await upsertArangoGraphChunk(chunk, triples);
    } catch (error) {
      warnings.push(`ArangoDB graph indexing skipped for ${chunk.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {triples, warnings};
}

function queryTerms(query: string) {
  const asciiTerms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3);
  const compact = query.replace(/\s+/g, "").trim();
  return Array.from(new Set([query.trim(), compact, ...asciiTerms].filter((term) => term.length >= 2))).slice(0, 8);
}

async function queryNeo4jGraph(datasetIds: string[], query: string, limit: number): Promise<GraphRagResult[]> {
  const terms = queryTerms(query);
  if (terms.length === 0) return [];

  const payload = await neo4jQuery(
    `
    MATCH (s:Entity)-[r:RELATED_TO]->(o:Entity)
    WHERE s.dataset_id IN $datasetIds
      AND any(term IN $terms WHERE
        toLower(s.name) CONTAINS toLower(term)
        OR toLower(o.name) CONTAINS toLower(term)
        OR toLower(r.predicate) CONTAINS toLower(term)
        OR toLower(coalesce(r.text, "")) CONTAINS toLower(term)
      )
    RETURN s.name, r.predicate, o.name, r.chunk_id, r.file_id, r.file_name, r.text
    LIMIT $limit
    `,
    {datasetIds, terms, limit},
  );

  return (payload.results?.[0]?.data ?? []).map((row, index) => {
    const values = row.row ?? [];
    return {
      engine: "neo4j",
      subject: String(values[0] ?? ""),
      predicate: String(values[1] ?? ""),
      object: String(values[2] ?? ""),
      chunk_id: String(values[3] ?? ""),
      file_id: String(values[4] ?? ""),
      file_name: String(values[5] ?? ""),
      text: String(values[6] ?? ""),
      score: 1 / (index + 1),
    };
  });
}

async function queryArangoGraph(datasetIds: string[], query: string, limit: number): Promise<GraphRagResult[]> {
  const terms = queryTerms(query);
  if (terms.length === 0) return [];
  const config = getGraphRagConfig().arango;

  const payload = await arangoRequest<{
    subject?: string;
    predicate?: string;
    object?: string;
    chunk_id?: string;
    file_id?: string;
    file_name?: string;
    text?: string;
  }>("/_api/cursor", {
    query: `
      FOR edge IN @@edgeCollection
        FILTER edge.dataset_id IN @datasetIds
        LET subject = DOCUMENT(CONCAT(@entityCollection, "/", PARSE_IDENTIFIER(edge._from).key))
        LET object = DOCUMENT(CONCAT(@entityCollection, "/", PARSE_IDENTIFIER(edge._to).key))
        FILTER LENGTH(
          FOR term IN @terms
            FILTER CONTAINS(LOWER(subject.name), LOWER(term))
              OR CONTAINS(LOWER(object.name), LOWER(term))
              OR CONTAINS(LOWER(edge.predicate), LOWER(term))
              OR CONTAINS(LOWER(edge.text), LOWER(term))
            RETURN 1
        ) > 0
        LIMIT @limit
        RETURN {
          subject: subject.name,
          predicate: edge.predicate,
          object: object.name,
          chunk_id: edge.chunk_id,
          file_id: edge.file_id,
          file_name: edge.file_name,
          text: edge.text
        }
    `,
    bindVars: {
      "@edgeCollection": config.edgeCollection,
      entityCollection: config.entityCollection,
      datasetIds,
      terms,
      limit,
    },
  });

  return (payload.result ?? []).map((row, index) => ({
    engine: "arangodb",
    subject: String(row.subject ?? ""),
    predicate: String(row.predicate ?? ""),
    object: String(row.object ?? ""),
    chunk_id: String(row.chunk_id ?? ""),
    file_id: String(row.file_id ?? ""),
    file_name: String(row.file_name ?? ""),
    text: String(row.text ?? ""),
    score: 1 / (index + 1),
  }));
}

export async function queryGraphRag(options: {
  datasetIds: string[];
  query: string;
  engines: GraphEngine[];
  limit?: number;
}) {
  const config = getGraphRagConfig();
  const limit = Math.max(1, Math.min(50, options.limit ?? 10));
  const warnings: string[] = [];
  const results: GraphRagResult[] = [];

  if (options.engines.includes("neo4j") && config.neo4j.enabled) {
    try {
      results.push(...await queryNeo4jGraph(options.datasetIds, options.query, limit));
    } catch (error) {
      warnings.push(`Neo4j graph search skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (options.engines.includes("arangodb") && config.arango.enabled) {
    try {
      results.push(...await queryArangoGraph(options.datasetIds, options.query, limit));
    } catch (error) {
      warnings.push(`ArangoDB graph search skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {results, warnings};
}

