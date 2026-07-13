import {randomUUID} from "node:crypto";
import {dbQuery} from "@/app/lib/typeorm-query";
import {getWorkflowById, getWorkflowRunById, type WorkflowRunRecord} from "@/app/workflow/data";

export type ConversationStatus = "active" | "archived";
export type ConversationMessageRole = "user" | "assistant" | "system";
export type ConversationMessageStatus = "pending" | "completed" | "failed";

export type ConversationRecord = {
  id: string;
  title: string;
  workflow_id: string;
  workflow_title?: string;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message?: string;
  message_count?: number;
};

export type ConversationMessageRecord = {
  id: string;
  conversation_id: string;
  role: ConversationMessageRole;
  content: string;
  workflow_run_id: string | null;
  status: ConversationMessageStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  workflow_run?: WorkflowRunRecord | null;
};

let schemaReady: Promise<void> | null = null;

const quoteIdentifier = (value: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`${value} is not a valid PostgreSQL identifier.`);
  }
  return `"${value}"`;
};

const postgresSchema = quoteIdentifier((process.env.POSTGRES_SCHEMA ?? "public").trim() || "public");
const tableName = (name: "conversations" | "conversation_messages" | "workflow_graphs") =>
  `${postgresSchema}.${quoteIdentifier(name)}`;

const toIso = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  return new Date().toISOString();
};

const truncateTitle = (value: string) => {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) return "New conversation";
  return trimmed.length > 64 ? `${trimmed.slice(0, 61)}...` : trimmed;
};

const conversationFromRow = (row: Record<string, unknown>): ConversationRecord => ({
  id: String(row.id),
  title: String(row.title ?? ""),
  workflow_id: String(row.workflow_id ?? ""),
  workflow_title: row.workflow_title === undefined ? undefined : String(row.workflow_title ?? ""),
  status: row.status === "archived" ? "archived" : "active",
  created_at: toIso(row.created_at),
  updated_at: toIso(row.updated_at),
  last_message_at: row.last_message_at ? toIso(row.last_message_at) : null,
  last_message: row.last_message === undefined ? undefined : String(row.last_message ?? ""),
  message_count: row.message_count === undefined ? undefined : Number(row.message_count ?? 0),
});

const messageFromRow = (row: Record<string, unknown>): ConversationMessageRecord => ({
  id: String(row.id),
  conversation_id: String(row.conversation_id),
  role: row.role === "assistant" || row.role === "system" ? row.role : "user",
  content: String(row.content ?? ""),
  workflow_run_id: typeof row.workflow_run_id === "string" ? row.workflow_run_id : null,
  status: row.status === "failed" || row.status === "pending" ? row.status : "completed",
  metadata: (row.metadata ?? {}) as Record<string, unknown>,
  created_at: toIso(row.created_at),
});

export const ensureConversationSchema = async () => {
  schemaReady ??= (async () => {
    await dbQuery(`CREATE SCHEMA IF NOT EXISTS ${postgresSchema}`);
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS ${tableName("conversations")} (
        id text PRIMARY KEY,
        title text NOT NULL,
        workflow_id text NOT NULL REFERENCES ${tableName("workflow_graphs")}(id) ON DELETE CASCADE,
        status text NOT NULL,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        last_message_at timestamptz
      );
      CREATE TABLE IF NOT EXISTS ${tableName("conversation_messages")} (
        id text PRIMARY KEY,
        conversation_id text NOT NULL REFERENCES ${tableName("conversations")}(id) ON DELETE CASCADE,
        role text NOT NULL,
        content text NOT NULL,
        workflow_run_id text,
        status text NOT NULL,
        metadata jsonb NOT NULL DEFAULT '{}',
        created_at timestamptz NOT NULL
      );
      CREATE INDEX IF NOT EXISTS conversation_messages_conversation_created_idx
        ON ${tableName("conversation_messages")}(conversation_id, created_at ASC);
      CREATE INDEX IF NOT EXISTS conversations_updated_idx
        ON ${tableName("conversations")}(updated_at DESC);
    `);
  })();

  await schemaReady;
};

export const listConversations = async () => {
  await ensureConversationSchema();
  const {rows} = await dbQuery(
    `
    SELECT c.*,
           w.title AS workflow_title,
           last_message.content AS last_message,
           COUNT(m.id)::int AS message_count
      FROM ${tableName("conversations")} c
      JOIN ${tableName("workflow_graphs")} w ON w.id = c.workflow_id
      LEFT JOIN ${tableName("conversation_messages")} m ON m.conversation_id = c.id
      LEFT JOIN LATERAL (
        SELECT content
          FROM ${tableName("conversation_messages")}
         WHERE conversation_id = c.id
         ORDER BY created_at DESC
         LIMIT 1
      ) last_message ON true
     GROUP BY c.id, w.title, last_message.content
     ORDER BY COALESCE(c.last_message_at, c.updated_at) DESC
    `,
  );
  return rows.map(conversationFromRow);
};

export const getConversationById = async (conversationId: string) => {
  await ensureConversationSchema();
  const {rows} = await dbQuery(
    `
    SELECT c.*, w.title AS workflow_title
      FROM ${tableName("conversations")} c
      JOIN ${tableName("workflow_graphs")} w ON w.id = c.workflow_id
     WHERE c.id = $1
    `,
    [conversationId],
  );
  return rows[0] ? conversationFromRow(rows[0]) : undefined;
};

export const createConversation = async (input: {workflow_id: string; title?: string}) => {
  await ensureConversationSchema();
  const workflow = await getWorkflowById(input.workflow_id);
  if (!workflow) {
    throw new Error("Workflow not found.");
  }
  const now = new Date().toISOString();
  const conversation: ConversationRecord = {
    id: `conversation-${randomUUID()}`,
    title: truncateTitle(input.title ?? ""),
    workflow_id: workflow.id,
    workflow_title: workflow.title,
    status: "active",
    created_at: now,
    updated_at: now,
    last_message_at: null,
    last_message: "",
    message_count: 0,
  };
  await dbQuery(
    `INSERT INTO ${tableName("conversations")}
       (id, title, workflow_id, status, created_at, updated_at, last_message_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      conversation.id,
      conversation.title,
      conversation.workflow_id,
      conversation.status,
      conversation.created_at,
      conversation.updated_at,
      conversation.last_message_at,
    ],
  );
  return conversation;
};

export const updateConversation = async (
  conversationId: string,
  input: {title?: string; status?: ConversationStatus},
) => {
  await ensureConversationSchema();
  const current = await getConversationById(conversationId);
  if (!current) return undefined;
  const nextTitle = input.title === undefined ? current.title : truncateTitle(input.title);
  const nextStatus = input.status === "archived" ? "archived" : input.status === "active" ? "active" : current.status;
  const {rows} = await dbQuery(
    `UPDATE ${tableName("conversations")}
        SET title = $2, status = $3, updated_at = $4
      WHERE id = $1
      RETURNING *`,
    [conversationId, nextTitle, nextStatus, new Date().toISOString()],
  );
  return rows[0] ? conversationFromRow(rows[0]) : undefined;
};

export const deleteConversation = async (conversationId: string) => {
  await ensureConversationSchema();
  const {rowCount} = await dbQuery(
    `DELETE FROM ${tableName("conversations")} WHERE id = $1`,
    [conversationId],
  );
  return (rowCount ?? 0) > 0;
};

export const listConversationMessages = async (conversationId: string, options: {includeRuns?: boolean} = {}) => {
  await ensureConversationSchema();
  const {rows} = await dbQuery(
    `SELECT * FROM ${tableName("conversation_messages")}
      WHERE conversation_id = $1
      ORDER BY created_at ASC`,
    [conversationId],
  );
  const messages = rows.map(messageFromRow);
  if (!options.includeRuns) return messages;

  return Promise.all(
    messages.map(async (message) => ({
      ...message,
      workflow_run: message.workflow_run_id ? (await getWorkflowRunById(message.workflow_run_id)) ?? null : null,
    })),
  );
};

export const getConversationHistory = async (conversationId: string) => {
  const messages = await listConversationMessages(conversationId);
  return messages
    .filter((message) => message.status === "completed")
    .filter((message) => message.content.trim())
    .filter((message) => message.role === "user" || message.role === "assistant" || message.role === "system")
    .slice(-16)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
};

export const createConversationMessage = async (input: {
  conversation_id: string;
  role: ConversationMessageRole;
  content: string;
  status?: ConversationMessageStatus;
  workflow_run_id?: string | null;
  metadata?: Record<string, unknown>;
}) => {
  await ensureConversationSchema();
  const now = new Date().toISOString();
  const message: ConversationMessageRecord = {
    id: `message-${randomUUID()}`,
    conversation_id: input.conversation_id,
    role: input.role,
    content: input.content,
    workflow_run_id: input.workflow_run_id ?? null,
    status: input.status ?? "completed",
    metadata: input.metadata ?? {},
    created_at: now,
  };
  await dbQuery(
    `INSERT INTO ${tableName("conversation_messages")}
       (id, conversation_id, role, content, workflow_run_id, status, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      message.id,
      message.conversation_id,
      message.role,
      message.content,
      message.workflow_run_id,
      message.status,
      JSON.stringify(message.metadata),
      message.created_at,
    ],
  );
  await dbQuery(
    `UPDATE ${tableName("conversations")}
        SET updated_at = $2, last_message_at = $2
      WHERE id = $1`,
    [message.conversation_id, now],
  );
  return message;
};

export const updateConversationMessage = async (
  messageId: string,
  input: {
    content?: string;
    status?: ConversationMessageStatus;
    workflow_run_id?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  await ensureConversationSchema();
  const {rows} = await dbQuery(
    `UPDATE ${tableName("conversation_messages")}
        SET content = COALESCE($2, content),
            status = COALESCE($3, status),
            workflow_run_id = CASE WHEN $4::boolean THEN $5 ELSE workflow_run_id END,
            metadata = COALESCE($6, metadata)
      WHERE id = $1
      RETURNING *`,
    [
      messageId,
      input.content,
      input.status,
      Object.prototype.hasOwnProperty.call(input, "workflow_run_id"),
      input.workflow_run_id ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ],
  );
  return rows[0] ? messageFromRow(rows[0]) : undefined;
};

export const maybeTitleConversationFromFirstMessage = async (conversationId: string, content: string) => {
  const conversation = await getConversationById(conversationId);
  if (!conversation || conversation.title !== "New conversation") return conversation;
  return updateConversation(conversationId, {title: content});
};
