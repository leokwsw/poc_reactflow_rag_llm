import type {WorkflowRunInput} from "@/app/components/workflow/nodes/execution-types";

export type RagMode = "hybrid" | "conversational" | "feedback" | "agentic" | "adaptive";
export type RetrievalSource = "vector" | "bm25" | "neo4j" | "arangodb";
export type GraphEngine = "neo4j" | "arangodb";

export type ConversationMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const GRAPH_INTENT_PATTERN =
  /(relationship|relation|related|connect|path|why|cause|impact|dependency|graph|linked|關係|相關|連結|原因|導致|影響|依賴|路徑)/i;

const KEYWORD_INTENT_PATTERN =
  /(exact|quote|definition|term|keyword|名稱|定義|原文|關鍵字|條文|編號)/i;

export function normalizeRagModes(value: unknown): RagMode[] {
  if (!Array.isArray(value) || value.length === 0) {
    return ["hybrid"];
  }
  const allowed = new Set<RagMode>(["hybrid", "conversational", "feedback", "agentic", "adaptive"]);
  const modes = value.filter((item): item is RagMode => typeof item === "string" && allowed.has(item as RagMode));
  return modes.length > 0 ? modes : ["hybrid"];
}

export function normalizeRetrievalSources(value: unknown): RetrievalSource[] {
  if (!Array.isArray(value) || value.length === 0) {
    return ["vector", "bm25", "neo4j", "arangodb"];
  }
  const allowed = new Set<RetrievalSource>(["vector", "bm25", "neo4j", "arangodb"]);
  const sources = value.filter((item): item is RetrievalSource => typeof item === "string" && allowed.has(item as RetrievalSource));
  return sources.length > 0 ? sources : ["vector", "bm25"];
}

export function getConversationHistory(input: WorkflowRunInput): ConversationMessage[] {
  return (input.conversation_history ?? [])
    .filter((item) => item.content.trim())
    .slice(-8);
}

export function buildConversationalQuery(query: string, input: WorkflowRunInput) {
  const history = getConversationHistory(input);
  if (history.length === 0) return query;

  const recentTurns = history
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n")
    .slice(-1600);

  return `Conversation context:\n${recentTurns}\n\nCurrent question:\n${query}`;
}

export function buildAgenticSubqueries(query: string) {
  const cleaned = query.trim();
  const parts = cleaned
    .split(/[?？。.!！;\n]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4);

  const subqueries = new Set<string>([cleaned]);
  for (const part of parts.slice(0, 4)) {
    subqueries.add(part);
  }

  if (GRAPH_INTENT_PATTERN.test(cleaned)) {
    subqueries.add(`${cleaned} relationships causes impacts related entities`);
  }
  if (KEYWORD_INTENT_PATTERN.test(cleaned)) {
    subqueries.add(`${cleaned} exact definition keyword`);
  }

  return Array.from(subqueries).slice(0, 5);
}

export function adaptRetrievalSources(query: string, sources: RetrievalSource[]) {
  const sourceSet = new Set(sources);

  if (GRAPH_INTENT_PATTERN.test(query)) {
    sourceSet.add("neo4j");
    sourceSet.add("arangodb");
  }
  if (KEYWORD_INTENT_PATTERN.test(query)) {
    sourceSet.add("bm25");
  }
  if (!KEYWORD_INTENT_PATTERN.test(query)) {
    sourceSet.add("vector");
  }

  return Array.from(sourceSet);
}

export function getGraphEngines(sources: RetrievalSource[], configured: unknown): GraphEngine[] {
  if (Array.isArray(configured) && configured.length > 0) {
    const allowed = new Set<GraphEngine>(["neo4j", "arangodb"]);
    const engines = configured.filter((item): item is GraphEngine => typeof item === "string" && allowed.has(item as GraphEngine));
    if (engines.length > 0) return engines;
  }
  return sources.filter((source): source is GraphEngine => source === "neo4j" || source === "arangodb");
}

