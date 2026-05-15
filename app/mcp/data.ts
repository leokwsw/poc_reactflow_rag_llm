import {randomUUID} from "node:crypto";
import {Pool} from "pg";

export type McpServer = {
  id: string;
  name: string;
  server_identifier: string;
  server_url: string;
  created_at: string;
  updated_at: string;
};

const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? "10.0.0.209",
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? "postgres",
  password: process.env.POSTGRES_PASSWORD ?? "password",
  database: process.env.POSTGRES_DATABASE ?? "postgres",
  max: 10,
});

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
  created_at: toIso(row.created_at),
  updated_at: toIso(row.updated_at),
});

const ensureMcpSchema = async () => {
  schemaReady ??= (async () => {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${postgresSchema}`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id text PRIMARY KEY,
        name text NOT NULL,
        server_identifier text NOT NULL,
        server_url text NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS mcp_servers_identifier_idx
        ON ${tableName}(server_identifier);
    `);
  })();

  await schemaReady;
};

export const listMcpServers = async () => {
  await ensureMcpSchema();
  const {rows} = await pool.query(`SELECT * FROM ${tableName} ORDER BY updated_at DESC`);
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
    created_at: timestamp,
    updated_at: timestamp,
  };

  if (!server.name || !server.server_identifier || !server.server_url) {
    throw new Error("MCP server name, identifier, and URL are required.");
  }

  await pool.query(
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

  return server;
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

  const {rows} = await pool.query(
    `UPDATE ${tableName}
        SET name = $2,
            server_identifier = $3,
            server_url = $4,
            updated_at = $5
      WHERE id = $1
      RETURNING *`,
    [id, name, server_identifier, server_url, new Date().toISOString()],
  );

  return rows[0] ? serverFromRow(rows[0]) : undefined;
};

export const deleteMcpServer = async (id: string) => {
  await ensureMcpSchema();
  const {rowCount} = await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
};
