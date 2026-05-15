export const MODEL_PROFILES = [
  { id: "@ezchat/lite", label: "EZChat Lite", kind: "chat" },
  { id: "@ezchat/core", label: "EZChat Core", kind: "chat" },
  { id: "@ezchat/pro", label: "EZChat Pro", kind: "chat" },
  { id: "@ezchat/embedding", label: "EZChat Embedding", kind: "embedding" },
  { id: "@ezchat/reranking", label: "EZChat Reranking", kind: "reranking" },
] as const;

export type ModelProfileId = (typeof MODEL_PROFILES)[number]["id"];

const modelProfileIdSet = new Set<string>(MODEL_PROFILES.map((profile) => profile.id));

export function isModelProfileId(value: unknown): value is ModelProfileId {
  return typeof value === "string" && modelProfileIdSet.has(value);
}

export const DEFAULT_MODEL_PROFILE_ID: ModelProfileId = "@ezchat/lite";
export const DEFAULT_EMBEDDING_MODEL_PROFILE_ID: ModelProfileId = "@ezchat/embedding";
export const DEFAULT_RERANKING_MODEL_PROFILE_ID: ModelProfileId = "@ezchat/reranking";

export const CHAT_MODEL_PROFILES = MODEL_PROFILES.filter((profile) => profile.kind === "chat");
