import {Agent as UndiciAgent} from "undici";
import {dbQuery} from "@/app/lib/typeorm-query";

export type ToolMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
export type ToolBodyType = "none" | "json" | "raw" | "x-www-form-urlencoded";

export type ToolKeyValueRow = {
  id?: string;
  enabled?: boolean;
  name?: string;
  value?: string;
};

export type ToolRecord = {
  id: string;
  name: string;
  description: string;
  type: "custom_http";
  method: ToolMethod;
  url: string;
  headers: ToolKeyValueRow[];
  params: ToolKeyValueRow[];
  body_type: ToolBodyType;
  body_json: string;
  body_raw: string;
  input_schema: Record<string, unknown>;
  enabled: boolean;
  skip_ssl_verification: boolean;
  created_at: string;
  updated_at: string;
};

export type ToolInput = Omit<ToolRecord, "id" | "type" | "created_at" | "updated_at"> & {
  id?: string;
};

type ToolExecutionResult = {
  body: unknown;
  status_code: number;
  headers: Record<string, string>;
  ok: boolean;
  url: string;
};

type FetchInitWithDispatcher = RequestInit & {
  dispatcher?: UndiciAgent;
};

let schemaReady: Promise<void> | null = null;

const METHODS_WITHOUT_BODY = new Set<ToolMethod>(["GET", "HEAD"]);

const quoteIdentifier = (value: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`${value} is not a valid PostgreSQL identifier.`);
  }
  return `"${value}"`;
};

const postgresSchema = quoteIdentifier((process.env.POSTGRES_SCHEMA ?? "public").trim() || "public");
const tableName = `${postgresSchema}.${quoteIdentifier("tools")}`;

const toIso = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  return new Date().toISOString();
};

const sanitizeRows = (rows: unknown): ToolKeyValueRow[] =>
  Array.isArray(rows)
    ? rows
      .map((row) => row && typeof row === "object" ? row as Record<string, unknown> : null)
      .filter((row): row is Record<string, unknown> => Boolean(row))
      .map((row) => ({
        id: typeof row.id === "string" ? row.id : crypto.randomUUID(),
        enabled: row.enabled !== false,
        name: typeof row.name === "string" ? row.name : "",
        value: typeof row.value === "string" ? row.value : "",
      }))
    : [];

const sanitizeMethod = (value: unknown): ToolMethod => {
  const method = typeof value === "string" ? value.toUpperCase() : "GET";
  return ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(method)
    ? method as ToolMethod
    : "GET";
};

const sanitizeBodyType = (value: unknown): ToolBodyType => {
  const bodyType = typeof value === "string" ? value : "none";
  return ["none", "json", "raw", "x-www-form-urlencoded"].includes(bodyType)
    ? bodyType as ToolBodyType
    : "none";
};

const normalizeToolInput = (input: Partial<ToolInput>): ToolInput => ({
  id: typeof input.id === "string" && input.id.trim() ? input.id.trim() : undefined,
  name: String(input.name ?? "").trim(),
  description: String(input.description ?? "").trim(),
  method: sanitizeMethod(input.method),
  url: String(input.url ?? "").trim(),
  headers: sanitizeRows(input.headers),
  params: sanitizeRows(input.params),
  body_type: sanitizeBodyType(input.body_type),
  body_json: String(input.body_json ?? ""),
  body_raw: String(input.body_raw ?? ""),
  input_schema: input.input_schema && typeof input.input_schema === "object" && !Array.isArray(input.input_schema)
    ? input.input_schema
    : {type: "object", properties: {}},
  enabled: input.enabled !== false,
  skip_ssl_verification: Boolean(input.skip_ssl_verification),
});

const toolFromRow = (row: Record<string, unknown>): ToolRecord => ({
  id: String(row.id),
  name: String(row.name ?? ""),
  description: String(row.description ?? ""),
  type: "custom_http",
  method: sanitizeMethod(row.method),
  url: String(row.url ?? ""),
  headers: sanitizeRows(row.headers),
  params: sanitizeRows(row.params),
  body_type: sanitizeBodyType(row.body_type),
  body_json: String(row.body_json ?? ""),
  body_raw: String(row.body_raw ?? ""),
  input_schema: row.input_schema && typeof row.input_schema === "object"
    ? row.input_schema as Record<string, unknown>
    : {type: "object", properties: {}},
  enabled: Boolean(row.enabled ?? true),
  skip_ssl_verification: Boolean(row.skip_ssl_verification ?? false),
  created_at: toIso(row.created_at),
  updated_at: toIso(row.updated_at),
});

export const ensureToolsSchema = async () => {
  schemaReady ??= (async () => {
    await dbQuery(`CREATE SCHEMA IF NOT EXISTS ${postgresSchema}`);
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id text PRIMARY KEY,
        name text NOT NULL,
        description text NOT NULL DEFAULT '',
        type text NOT NULL DEFAULT 'custom_http',
        method text NOT NULL DEFAULT 'GET',
        url text NOT NULL DEFAULT '',
        headers jsonb NOT NULL DEFAULT '[]',
        params jsonb NOT NULL DEFAULT '[]',
        body_type text NOT NULL DEFAULT 'none',
        body_json text NOT NULL DEFAULT '',
        body_raw text NOT NULL DEFAULT '',
        input_schema jsonb NOT NULL DEFAULT '{"type":"object","properties":{}}',
        enabled boolean NOT NULL DEFAULT true,
        skip_ssl_verification boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      );
      CREATE INDEX IF NOT EXISTS tools_enabled_name_idx ON ${tableName}(enabled, name);
    `);
  })();

  await schemaReady;
};

export async function listTools() {
  await ensureToolsSchema();
  const {rows} = await dbQuery(`SELECT * FROM ${tableName} ORDER BY updated_at DESC`);
  return rows.map(toolFromRow);
}

export async function getToolById(toolId: string) {
  await ensureToolsSchema();
  const {rows} = await dbQuery(`SELECT * FROM ${tableName} WHERE id = $1`, [toolId]);
  return rows[0] ? toolFromRow(rows[0]) : undefined;
}

export async function createTool(input: Partial<ToolInput>) {
  const tool = normalizeToolInput(input);
  if (!tool.name) throw new Error("Tool name is required.");
  if (!tool.url) throw new Error("Tool URL is required.");

  await ensureToolsSchema();
  const timestamp = new Date().toISOString();
  const id = tool.id || `tool-${crypto.randomUUID()}`;
  await dbQuery(
    `INSERT INTO ${tableName}
      (id, name, description, type, method, url, headers, params, body_type, body_json, body_raw, input_schema, enabled, skip_ssl_verification, created_at, updated_at)
     VALUES ($1, $2, $3, 'custom_http', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)`,
    [
      id,
      tool.name,
      tool.description,
      tool.method,
      tool.url,
      JSON.stringify(tool.headers),
      JSON.stringify(tool.params),
      tool.body_type,
      tool.body_json,
      tool.body_raw,
      JSON.stringify(tool.input_schema),
      tool.enabled,
      tool.skip_ssl_verification,
      timestamp,
    ],
  );
  return getToolById(id);
}

export async function updateTool(toolId: string, input: Partial<ToolInput>) {
  const current = await getToolById(toolId);
  if (!current) return undefined;
  const tool = normalizeToolInput({...current, ...input});
  if (!tool.name) throw new Error("Tool name is required.");
  if (!tool.url) throw new Error("Tool URL is required.");

  const timestamp = new Date().toISOString();
  await dbQuery(
    `UPDATE ${tableName}
     SET name = $2, description = $3, method = $4, url = $5, headers = $6, params = $7,
         body_type = $8, body_json = $9, body_raw = $10, input_schema = $11,
         enabled = $12, skip_ssl_verification = $13, updated_at = $14
     WHERE id = $1`,
    [
      toolId,
      tool.name,
      tool.description,
      tool.method,
      tool.url,
      JSON.stringify(tool.headers),
      JSON.stringify(tool.params),
      tool.body_type,
      tool.body_json,
      tool.body_raw,
      JSON.stringify(tool.input_schema),
      tool.enabled,
      tool.skip_ssl_verification,
      timestamp,
    ],
  );
  return getToolById(toolId);
}

export async function deleteTool(toolId: string) {
  await ensureToolsSchema();
  await dbQuery(`DELETE FROM ${tableName} WHERE id = $1`, [toolId]);
};

const interpolate = (template: string, values: Record<string, unknown>) =>
  template.replace(/\{\{#\s*([^#}]+?)\s*#\}\}/g, (_, path: string) => {
    const parts = path.trim().split(".");
    let current: unknown = values;
    for (const part of parts) {
      if (!current || typeof current !== "object") return "";
      current = (current as Record<string, unknown>)[part];
    }
    if (current === null || current === undefined) return "";
    return typeof current === "string" ? current : JSON.stringify(current);
  });

const enabledRows = (rows: ToolKeyValueRow[], values: Record<string, unknown>) =>
  rows
    .filter((row) => row.enabled !== false && row.name?.trim())
    .map((row) => ({
      name: interpolate(row.name ?? "", values).trim(),
      value: interpolate(row.value ?? "", values),
    }))
    .filter((row) => row.name);

function buildToolUrl(tool: ToolRecord, values: Record<string, unknown>) {
  const renderedUrl = interpolate(tool.url, values).trim();
  const url = new URL(renderedUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Tool URL must use http or https.");
  }
  for (const param of enabledRows(tool.params, values)) {
    url.searchParams.append(param.name, param.value);
  }
  return url.toString();
}

function buildToolHeaders(tool: ToolRecord, values: Record<string, unknown>) {
  const headers = new Headers();
  for (const header of enabledRows(tool.headers, values)) {
    headers.set(header.name, header.value);
  }
  return headers;
}

function parseResponseBody(response: Response) {
  return response.text().then((text) => {
    if (!text) return "";
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json") || contentType.includes("+json")) {
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return text;
      }
    }
    return text;
  });
}

function buildToolBody(tool: ToolRecord, headers: Headers, values: Record<string, unknown>): BodyInit | undefined {
  if (tool.body_type === "none" || METHODS_WITHOUT_BODY.has(tool.method)) return undefined;
  if (tool.body_type === "json") {
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
    const rendered = interpolate(tool.body_json, values).trim();
    if (!rendered) return "";
    try {
      return JSON.stringify(JSON.parse(rendered));
    } catch {
      return rendered;
    }
  }
  if (tool.body_type === "x-www-form-urlencoded") {
    if (!headers.has("content-type")) headers.set("content-type", "application/x-www-form-urlencoded");
    const params = new URLSearchParams();
    for (const row of enabledRows(tool.params, values)) {
      params.append(row.name, row.value);
    }
    return params.toString();
  }
  if (!headers.has("content-type")) headers.set("content-type", "text/plain");
  return interpolate(tool.body_raw, values);
}

export async function executeTool(tool: ToolRecord, values: Record<string, unknown>): Promise<ToolExecutionResult> {
  if (!tool.enabled) throw new Error(`Tool "${tool.name}" is disabled.`);
  const url = buildToolUrl(tool, values);
  const headers = buildToolHeaders(tool, values);
  const body = buildToolBody(tool, headers, values);
  const response = await fetch(url, {
    method: tool.method,
    headers,
    body,
    ...(tool.skip_ssl_verification ? {
      dispatcher: new UndiciAgent({
        connect: {rejectUnauthorized: false},
      }),
    } : {}),
  } as FetchInitWithDispatcher);

  return {
    body: await parseResponseBody(response),
    status_code: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    ok: response.ok,
    url: response.url,
  };
}

