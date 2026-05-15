import fs from "node:fs";
import path from "node:path";
import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {defaultData} from "@/app/components/workflow/default-data";
import type {WorkflowDataType} from "@/app/components/workflow/types";
import type {WorkflowTraceItem} from "@/app/components/workflow/nodes/execution-types";
import {DEFAULT_MODEL_PROFILE_ID, isModelProfileId} from "@/app/model/profiles";

export type WorkflowRecord = {
  id: string;
  title: string;
  description: string;
  graph: WorkflowDataType;
  created_at: string;
  updated_at: string;
  run_count?: number;
  last_run_at?: string | null;
};

export type WorkflowRunRecord = {
  id: string;
  workflow_id: string;
  status: "running" | "completed" | "failed";
  query: string;
  input: Record<string, unknown>;
  result: Record<string, unknown> | null;
  trace: WorkflowTraceItem[];
  error: string | null;
  created_at: string;
  finished_at: string | null;
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

const dataPath = (...segments: string[]) => path.join(process.cwd(), "data", ...segments);

const readJsonFile = <T,>(fileName: string, fallback: T): T => {
  const filePath = dataPath(fileName);
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
};

const quoteIdentifier = (value: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`${value} is not a valid PostgreSQL identifier.`);
  }
  return `"${value}"`;
};

const postgresSchema = quoteIdentifier((process.env.POSTGRES_SCHEMA ?? "public").trim() || "public");
const tableName = (name: "workflow_graphs" | "workflow_runs") =>
  `${postgresSchema}.${quoteIdentifier(name)}`;

const toIso = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  return new Date().toISOString();
};

const runFromRow = (row: Record<string, unknown>): WorkflowRunRecord => ({
  id: String(row.id),
  workflow_id: String(row.workflow_id),
  status: row.status as WorkflowRunRecord["status"],
  query: String(row.query ?? ""),
  input: (row.input ?? {}) as Record<string, unknown>,
  result: (row.result ?? null) as Record<string, unknown> | null,
  trace: (row.trace ?? []) as WorkflowTraceItem[],
  error: typeof row.error === "string" ? row.error : null,
  created_at: toIso(row.created_at),
  finished_at: row.finished_at ? toIso(row.finished_at) : null,
});

const sanitizeWorkflowGraph = (graph: WorkflowDataType): WorkflowDataType => ({
  ...graph,
  nodes: graph.nodes.map((node) => {
    const data = node.data ?? {};
    const nodeType = data.type;
    const shouldUseModelProfile = ["llm", "agent", "questionClassifier"].includes(String(nodeType));
    const safeData = {...(data as Record<string, unknown>)};
    delete safeData.api_base_url;
    delete safeData.api_key;

    return {
      ...node,
      data: shouldUseModelProfile
        ? {
          ...safeData,
          model: isModelProfileId(safeData.model) ? safeData.model : DEFAULT_MODEL_PROFILE_ID,
        }
        : safeData,
    };
  }),
});

const workflowFromRow = (row: Record<string, unknown>): WorkflowRecord => ({
  id: String(row.id),
  title: String(row.title ?? ""),
  description: String(row.description ?? ""),
  graph: sanitizeWorkflowGraph(row.graph as WorkflowDataType),
  created_at: toIso(row.created_at),
  updated_at: toIso(row.updated_at),
  run_count: row.run_count === undefined ? undefined : Number(row.run_count),
  last_run_at: row.last_run_at ? toIso(row.last_run_at) : null,
});

const migrateJsonIfEmpty = async () => {
  const {rows} = await pool.query<{count: string}>(
    `SELECT COUNT(*)::text AS count FROM ${tableName("workflow_graphs")}`,
  );
  if (Number(rows[0]?.count ?? 0) > 0) return;

  const timestamp = new Date().toISOString();
  const workflowId = "workflow-default";
  await pool.query(
    `INSERT INTO ${tableName("workflow_graphs")}
       (id, title, description, graph, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO NOTHING`,
    [
      workflowId,
      "Default Workflow",
      "Seeded from data/graph.json",
      JSON.stringify(sanitizeWorkflowGraph(defaultData)),
      timestamp,
      timestamp,
    ],
  );

  const trace = readJsonFile<WorkflowTraceItem[]>("trace.json", []);
  if (trace.length > 0) {
    await pool.query(
      `INSERT INTO ${tableName("workflow_runs")}
         (id, workflow_id, status, query, input, result, trace, error, created_at, finished_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [
        "run-seed-trace",
        workflowId,
        "completed",
        "",
        JSON.stringify({source: "data/trace.json"}),
        JSON.stringify({output: "", outputs: {}, trace}),
        JSON.stringify(trace),
        null,
        timestamp,
        timestamp,
      ],
    );
  }
};

export const ensureWorkflowSchema = async () => {
  schemaReady ??= (async () => {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${postgresSchema}`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${tableName("workflow_graphs")} (
        id text PRIMARY KEY,
        title text NOT NULL,
        description text NOT NULL DEFAULT '',
        graph jsonb NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL
      );
      CREATE TABLE IF NOT EXISTS ${tableName("workflow_runs")} (
        id text PRIMARY KEY,
        workflow_id text NOT NULL REFERENCES ${tableName("workflow_graphs")}(id) ON DELETE CASCADE,
        status text NOT NULL,
        query text NOT NULL DEFAULT '',
        input jsonb NOT NULL DEFAULT '{}',
        result jsonb,
        trace jsonb NOT NULL DEFAULT '[]',
        error text,
        created_at timestamptz NOT NULL,
        finished_at timestamptz
      );
      CREATE INDEX IF NOT EXISTS workflow_runs_workflow_created_idx
        ON ${tableName("workflow_runs")}(workflow_id, created_at DESC);
    `);
    await migrateJsonIfEmpty();
  })();

  await schemaReady;
};

export const listWorkflows = async () => {
  await ensureWorkflowSchema();
  const {rows} = await pool.query(
    `SELECT w.*,
            COUNT(r.id)::int AS run_count,
            MAX(r.created_at) AS last_run_at
       FROM ${tableName("workflow_graphs")} w
       LEFT JOIN ${tableName("workflow_runs")} r ON r.workflow_id = w.id
      GROUP BY w.id
      ORDER BY w.updated_at DESC`,
  );
  return rows.map(workflowFromRow);
};

export const getWorkflowById = async (workflowId: string) => {
  await ensureWorkflowSchema();
  const {rows} = await pool.query(
    `SELECT * FROM ${tableName("workflow_graphs")} WHERE id = $1`,
    [workflowId],
  );
  return rows[0] ? workflowFromRow(rows[0]) : undefined;
};

export const createWorkflow = async (title?: string) => {
  await ensureWorkflowSchema();
  const timestamp = new Date().toISOString();
  const workflow: WorkflowRecord = {
    id: `workflow-${randomUUID()}`,
    title: title?.trim() || "Untitled Workflow",
    description: "",
    graph: sanitizeWorkflowGraph(defaultData),
    created_at: timestamp,
    updated_at: timestamp,
  };
  await pool.query(
    `INSERT INTO ${tableName("workflow_graphs")}
       (id, title, description, graph, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      workflow.id,
      workflow.title,
      workflow.description,
      JSON.stringify(sanitizeWorkflowGraph(workflow.graph)),
      workflow.created_at,
      workflow.updated_at,
    ],
  );
  return workflow;
};

export const updateWorkflowGraph = async (
  workflowId: string,
  graph: WorkflowDataType,
  metadata?: {title?: string; description?: string},
) => {
  await ensureWorkflowSchema();
  const current = await getWorkflowById(workflowId);
  if (!current) return undefined;
  const updatedAt = new Date().toISOString();
  const nextTitle = metadata?.title?.trim() || current.title;
  const nextDescription = metadata?.description ?? current.description;
  const {rows} = await pool.query(
    `UPDATE ${tableName("workflow_graphs")}
        SET title = $2, description = $3, graph = $4, updated_at = $5
      WHERE id = $1
      RETURNING *`,
    [workflowId, nextTitle, nextDescription, JSON.stringify(sanitizeWorkflowGraph(graph)), updatedAt],
  );
  return rows[0] ? workflowFromRow(rows[0]) : undefined;
};

export const listWorkflowRuns = async (workflowId: string, limit = 20) => {
  await ensureWorkflowSchema();
  const {rows} = await pool.query(
    `SELECT * FROM ${tableName("workflow_runs")}
      WHERE workflow_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
    [workflowId, limit],
  );
  return rows.map(runFromRow);
};

export const saveWorkflowRun = async (run: {
  workflow_id: string;
  status: WorkflowRunRecord["status"];
  query: string;
  input: Record<string, unknown>;
  result?: Record<string, unknown> | null;
  trace?: WorkflowTraceItem[];
  error?: string | null;
  started_at?: string;
  finished_at?: string | null;
}) => {
  await ensureWorkflowSchema();
  const timestamp = new Date().toISOString();
  const record: WorkflowRunRecord = {
    id: `run-${randomUUID()}`,
    workflow_id: run.workflow_id,
    status: run.status,
    query: run.query,
    input: run.input,
    result: run.result ?? null,
    trace: run.trace ?? [],
    error: run.error ?? null,
    created_at: run.started_at ?? timestamp,
    finished_at: run.finished_at ?? (run.status === "running" ? null : timestamp),
  };
  await pool.query(
    `INSERT INTO ${tableName("workflow_runs")}
       (id, workflow_id, status, query, input, result, trace, error, created_at, finished_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      record.id,
      record.workflow_id,
      record.status,
      record.query,
      JSON.stringify(record.input),
      record.result ? JSON.stringify(record.result) : null,
      JSON.stringify(record.trace),
      record.error,
      record.created_at,
      record.finished_at,
    ],
  );
  return record;
};
