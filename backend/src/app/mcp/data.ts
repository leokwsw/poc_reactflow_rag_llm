import {randomUUID} from "node:crypto";
import {dbQuery} from "@/app/lib/typeorm-query";

export type McpServer = {
  id: string;
  name: string;
  server_identifier: string;
  server_url: string;
  tools: McpTool[];
  tools_error: string | null;
  tools_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type McpTool = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  [key: string]: unknown;
};

type McpRequestHeaders = Record<string, string>;

let schemaReady: Promise<void> | null = null;

const quoteIdentifier = (value: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`${value} is not a valid PostgreSQL identifier.`);
  }
  return `"${value}"`;
};

const postgresSchema = quoteIdentifier((process.env.POSTGRES_SCHEMA ?? "public").trim() || "public");
const tableName = `${postgresSchema}.${quoteIdentifier("mcp_servers")}`;

const toIso = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  return new Date().toISOString();
};

const serverFromRow = (row: Record<string, unknown>): McpServer => ({
  id: String(row.id),
  name: String(row.name ?? ""),
  server_identifier: String(row.server_identifier ?? ""),
  server_url: String(row.server_url ?? ""),
  tools: Array.isArray(row.tools) ? row.tools as McpTool[] : [],
  tools_error: typeof row.tools_error === "string" ? row.tools_error : null,
  tools_updated_at: row.tools_updated_at ? toIso(row.tools_updated_at) : null,
  created_at: toIso(row.created_at),
  updated_at: toIso(row.updated_at),
});

const parseJsonOrSse = async (response: Response) => {
  const text = await response.text();
  if (!text.trim()) return null;

  if (text.trimStart().startsWith("{")) {
    return JSON.parse(text) as Record<string, unknown>;
  }

  const dataLine = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("data:"));
  if (!dataLine) return null;

  return JSON.parse(dataLine.slice("data:".length).trim()) as Record<string, unknown>;
};

const postMcpJsonRpc = async (
  serverUrl: string,
  payload: Record<string, unknown>,
  sessionId?: string,
  customHeaders: McpRequestHeaders = {},
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(serverUrl, {
      method: "POST",
      headers: {
        ...customHeaders,
        "Accept": "application/json, text/event-stream",
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2024-11-05",
        ...(sessionId ? {"Mcp-Session-Id": sessionId} : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const body = await parseJsonOrSse(response);
    if (!response.ok) {
      const message = typeof body?.error === "object" && body.error
        ? String((body.error as Record<string, unknown>).message ?? `HTTP ${response.status}`)
        : `HTTP ${response.status}`;
      throw new Error(message);
    }

    return {
      body,
      sessionId: response.headers.get("mcp-session-id") ?? sessionId,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const initializeMcpSession = async (serverUrl: string, customHeaders: McpRequestHeaders = {}) => {
  const initialized = await postMcpJsonRpc(serverUrl, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "poc-reactflow-rag-llm",
        version: "0.1.0",
      },
    },
  }, undefined, customHeaders);
  const sessionId = initialized.sessionId ?? undefined;

  await postMcpJsonRpc(serverUrl, {
    jsonrpc: "2.0",
    method: "notifications/initialized",
    params: {},
  }, sessionId, customHeaders).catch(() => undefined);

  return sessionId;
};

export const inspectMcpTools = async (
  serverUrl: string,
  customHeaders: McpRequestHeaders = {},
): Promise<McpTool[]> => {
  const sessionId = await initializeMcpSession(serverUrl, customHeaders);

  const toolsResponse = await postMcpJsonRpc(serverUrl, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  }, sessionId, customHeaders);

  const result = toolsResponse.body?.result;
  if (!result || typeof result !== "object") {
    return [];
  }

  const tools = (result as Record<string, unknown>).tools;
  if (!Array.isArray(tools)) {
    return [];
  }

  return tools
    .filter((tool): tool is McpTool => Boolean(tool) && typeof tool === "object" && typeof (tool as Record<string, unknown>).name === "string")
    .map((tool) => tool);
};

export const callMcpTool = async (input: {
  serverUrl: string;
  toolName: string;
  arguments?: Record<string, unknown>;
  headers?: McpRequestHeaders;
}) => {
  const sessionId = await initializeMcpSession(input.serverUrl, input.headers ?? {});
  const response = await postMcpJsonRpc(input.serverUrl, {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: input.toolName,
      arguments: input.arguments ?? {},
    },
  }, sessionId, input.headers ?? {});

  return response.body;
};

const ensureMcpSchema = async () => {
  schemaReady ??= (async () => {
    await dbQuery(`CREATE SCHEMA IF NOT EXISTS ${postgresSchema}`);
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id text PRIMARY KEY,
        name text NOT NULL,
        server_identifier text NOT NULL,
        server_url text NOT NULL,
        tools jsonb NOT NULL DEFAULT '[]',
        tools_error text,
        tools_updated_at timestamptz,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS mcp_servers_identifier_idx
        ON ${tableName}(server_identifier);
    `);
    await dbQuery(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS tools jsonb NOT NULL DEFAULT '[]'`);
    await dbQuery(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS tools_error text`);
    await dbQuery(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS tools_updated_at timestamptz`);
  })();

  await schemaReady;
};

export const listMcpServers = async () => {
  await ensureMcpSchema();
  const {rows} = await dbQuery(`SELECT * FROM ${tableName} ORDER BY updated_at DESC`);
  return rows.map(serverFromRow);
};

export const createMcpServer = async (input: {
  name: string;
  server_identifier: string;
  server_url: string;
}) => {
  await ensureMcpSchema();
  const timestamp = new Date().toISOString();
  const server: McpServer = {
    id: `mcp-${randomUUID()}`,
    name: input.name.trim(),
    server_identifier: input.server_identifier.trim(),
    server_url: input.server_url.trim(),
    tools: [],
    tools_error: null,
    tools_updated_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  if (!server.name || !server.server_identifier || !server.server_url) {
    throw new Error("MCP server name, identifier, and URL are required.");
  }

  await dbQuery(
    `INSERT INTO ${tableName}
       (id, name, server_identifier, server_url, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      server.id,
      server.name,
      server.server_identifier,
      server.server_url,
      server.created_at,
      server.updated_at,
    ],
  );

  await refreshMcpServerTools(server.id, server.server_url);
  const servers = await listMcpServers();
  return servers.find((item) => item.id === server.id) ?? server;
};

export const updateMcpServer = async (
  id: string,
  input: {
    name: string;
    server_identifier: string;
    server_url: string;
  },
) => {
  await ensureMcpSchema();
  const name = input.name.trim();
  const server_identifier = input.server_identifier.trim();
  const server_url = input.server_url.trim();
  if (!name || !server_identifier || !server_url) {
    throw new Error("MCP server name, identifier, and URL are required.");
  }

  const {rows} = await dbQuery(
    `UPDATE ${tableName}
        SET name = $2,
            server_identifier = $3,
            server_url = $4,
            updated_at = $5
      WHERE id = $1
      RETURNING *`,
    [id, name, server_identifier, server_url, new Date().toISOString()],
  );

  if (!rows[0]) return undefined;
  await refreshMcpServerTools(id, server_url);
  const servers = await listMcpServers();
  return servers.find((item) => item.id === id) ?? serverFromRow(rows[0]);
};

export const deleteMcpServer = async (id: string) => {
  await ensureMcpSchema();
  const {rowCount} = await dbQuery(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
};

export const refreshMcpServerTools = async (id: string, serverUrl?: string) => {
  await ensureMcpSchema();
  const targetUrl = serverUrl ?? String((await dbQuery(`SELECT server_url FROM ${tableName} WHERE id = $1`, [id])).rows[0]?.server_url ?? "");
  const timestamp = new Date().toISOString();

  try {
    const tools = await inspectMcpTools(targetUrl);
    await dbQuery(
      `UPDATE ${tableName}
          SET tools = $2,
              tools_error = NULL,
              tools_updated_at = $3,
              updated_at = $3
        WHERE id = $1`,
      [id, JSON.stringify(tools), timestamp],
    );
    return {tools, error: null};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch MCP tools.";
    await dbQuery(
      `UPDATE ${tableName}
          SET tools = '[]',
              tools_error = $2,
              tools_updated_at = $3,
              updated_at = $3
        WHERE id = $1`,
      [id, message, timestamp],
    );
    return {tools: [], error: message};
  }
};
