export const MODEL_TYPES = [
  { value: "llm", label: "LLM" },
  { value: "rerank", label: "Rerank" },
  { value: "text_embedding", label: "Text Embedding" },
  { value: "speech2text", label: "Speech2text" },
  { value: "tts", label: "TTS" },
] as const;

export type ModelType = (typeof MODEL_TYPES)[number]["value"];

export const MODEL_PROFILES = [
  { id: "@ezchat/lite", label: "EZChat Lite", model_type: "llm" },
  { id: "@ezchat/core", label: "EZChat Core", model_type: "llm" },
  { id: "@ezchat/pro", label: "EZChat Pro", model_type: "llm" },
  { id: "@ezchat/embedding", label: "EZChat Embedding", model_type: "text_embedding" },
  { id: "@ezchat/reranking", label: "EZChat Reranking", model_type: "rerank" },
] as const;

export type ModelProfileId = (typeof MODEL_PROFILES)[number]["id"];

const modelProfileIdSet = new Set<string>(MODEL_PROFILES.map((profile) => profile.id));
const modelTypeSet = new Set<string>(MODEL_TYPES.map((type) => type.value));

export function isModelProfileId(value: unknown): value is ModelProfileId {
  return typeof value === "string" && modelProfileIdSet.has(value);
}

export function isModelType(value: unknown): value is ModelType {
  return typeof value === "string" && modelTypeSet.has(value);
}

export const DEFAULT_MODEL_PROFILE_ID: ModelProfileId = "@ezchat/lite";
export const DEFAULT_EMBEDDING_MODEL_PROFILE_ID: ModelProfileId = "@ezchat/embedding";
export const DEFAULT_RERANKING_MODEL_PROFILE_ID: ModelProfileId = "@ezchat/reranking";

export const CHAT_MODEL_PROFILES = MODEL_PROFILES.filter((profile) => profile.model_type === "llm");
