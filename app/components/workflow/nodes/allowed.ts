export const ALLOWED_CUSTOM_NODE_TYPES = [
  "start",
  "end",
  "llm",
  "agent",
  "questionClassifier",
  "knowledgeRetrieval",
  "ifElse",
  "http",
  "note",
] as const;

export type CustomNodeType = (typeof ALLOWED_CUSTOM_NODE_TYPES)[number];

const allowedNodeTypeSet = new Set<string>(ALLOWED_CUSTOM_NODE_TYPES);

export function isCustomNodeType(value: unknown): value is CustomNodeType {
  return typeof value === "string" && allowedNodeTypeSet.has(value);
}
