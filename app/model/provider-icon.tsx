"use client";

import DeepSeekAvatar from "@lobehub/icons/es/DeepSeek/components/Avatar";
import GrokAvatar from "@lobehub/icons/es/Grok/components/Avatar";
import GroqAvatar from "@lobehub/icons/es/Groq/components/Avatar";
import LmStudioAvatar from "@lobehub/icons/es/LmStudio/components/Avatar";
import OllamaAvatar from "@lobehub/icons/es/Ollama/components/Avatar";
import OpenAIAvatar from "@lobehub/icons/es/OpenAI/components/Avatar";
import OpenRouterAvatar from "@lobehub/icons/es/OpenRouter/components/Avatar";
import XAIAvatar from "@lobehub/icons/es/XAI/components/Avatar";
import XinferenceAvatar from "@lobehub/icons/es/Xinference/components/Avatar";
import type {ModelProvider} from "@/app/model/profiles";

const iconByProvider = {
  openai: OpenAIAvatar,
  grok: GrokAvatar,
  groq: GroqAvatar,
  ollama: OllamaAvatar,
  xai: XAIAvatar,
  xinference: XinferenceAvatar,
  deepseek: DeepSeekAvatar,
  openrouter: OpenRouterAvatar,
  lmstudio: LmStudioAvatar,
  "openai-compatible": OpenAIAvatar,
} satisfies Record<ModelProvider, typeof OpenAIAvatar>;

export default function ProviderIcon({provider, size = 34}: {provider: ModelProvider; size?: number}) {
  const Icon = iconByProvider[provider] ?? OpenAIAvatar;
  return <Icon shape="square" size={size} />;
}
