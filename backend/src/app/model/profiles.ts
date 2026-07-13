export const MODEL_TYPES = [
  { value: "llm", label: "LLM" },
  { value: "rerank", label: "Rerank" },
  { value: "text_embedding", label: "Text Embedding" },
  { value: "speech2text", label: "Speech2text" },
  { value: "tts", label: "TTS" },
] as const;

export type ModelType = (typeof MODEL_TYPES)[number]["value"];

export const MODEL_PROVIDER_SDKS = [
  "openai",
  "grok",
  "groq",
  "ollama",
  "xai",
  "xinference",
  "deepseek",
  "openrouter",
  "lmstudio",
  "openai-compatible",
] as const;

export type ModelProviderSdk = (typeof MODEL_PROVIDER_SDKS)[number];

export const MODEL_PROVIDERS = [
  {
    value: "openai",
    label: "OpenAI",
    sdk: "openai",
    base_url: "https://api.openai.com/v1",
    model_placeholder: "gpt-4o-mini",
  },
  {
    value: "grok",
    label: "Grok",
    sdk: "grok",
    base_url: "https://api.x.ai/v1",
    model_placeholder: "grok-2-latest",
  },
  {
    value: "groq",
    label: "Groq",
    sdk: "groq",
    base_url: "https://api.groq.com/openai/v1",
    model_placeholder: "llama-3.3-70b-versatile",
  },
  {
    value: "ollama",
    label: "Ollama",
    sdk: "ollama",
    base_url: "http://localhost:11434/v1",
    model_placeholder: "llama3.2",
  },
  {
    value: "xai",
    label: "xAI",
    sdk: "xai",
    base_url: "https://api.x.ai/v1",
    model_placeholder: "grok-2-latest",
  },
  {
    value: "xinference",
    label: "Xorbits Inference",
    sdk: "xinference",
    base_url: "http://localhost:9997/v1",
    model_placeholder: "qwen2.5-instruct",
  },
  {
    value: "deepseek",
    label: "DeepSeek",
    sdk: "deepseek",
    base_url: "https://api.deepseek.com/v1",
    model_placeholder: "deepseek-chat",
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    sdk: "openrouter",
    base_url: "https://openrouter.ai/api/v1",
    model_placeholder: "openai/gpt-4o-mini",
  },
  {
    value: "lmstudio",
    label: "LM Studio",
    sdk: "lmstudio",
    base_url: "http://localhost:1234/v1",
    model_placeholder: "local-model",
  },
  {
    value: "openai-compatible",
    label: "OpenAI API compatible",
    sdk: "openai-compatible",
    base_url: "",
    model_placeholder: "provider-model-name",
  },
] as const satisfies ReadonlyArray<{
  value: string;
  label: string;
  sdk: ModelProviderSdk;
  base_url: string;
  model_placeholder: string;
}>;

export type ModelProvider = (typeof MODEL_PROVIDERS)[number]["value"];

export type ModelProfileId = string;

const modelTypeSet = new Set<string>(MODEL_TYPES.map((type) => type.value));
const modelProviderSet = new Set<string>(MODEL_PROVIDERS.map((provider) => provider.value));
const modelProviderSdkSet = new Set<string>(MODEL_PROVIDER_SDKS);

export function isModelProfileId(value: unknown): value is ModelProfileId {
  return typeof value === "string" && value.trim() === value && /^[A-Za-z0-9@][A-Za-z0-9._/@:-]{0,127}$/.test(value);
}

export function isModelType(value: unknown): value is ModelType {
  return typeof value === "string" && modelTypeSet.has(value);
}

export function isModelProvider(value: unknown): value is ModelProvider {
  return typeof value === "string" && modelProviderSet.has(value);
}

export function isModelProviderSdk(value: unknown): value is ModelProviderSdk {
  return typeof value === "string" && modelProviderSdkSet.has(value);
}

export function modelProviderFor(value: unknown) {
  return MODEL_PROVIDERS.find((provider) => provider.value === value) ?? MODEL_PROVIDERS[0];
}

export const DEFAULT_MODEL_PROFILE_ID: ModelProfileId = "@ai/lite";
export const DEFAULT_EMBEDDING_MODEL_PROFILE_ID: ModelProfileId = "@ai/embedding";
export const DEFAULT_RERANKING_MODEL_PROFILE_ID: ModelProfileId = "@ai/reranking";
