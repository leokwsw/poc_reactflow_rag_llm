import {
  DEFAULT_EMBEDDING_MODEL_PROFILE_ID,
  DEFAULT_RERANKING_MODEL_PROFILE_ID,
  isModelProfileId,
} from '@/app/model/profiles'

import type { ModelConfig } from './data'

export const mergeModelConfig = (
  raw: unknown,
  fallbackModel = DEFAULT_EMBEDDING_MODEL_PROFILE_ID,
): ModelConfig => {
  if (!raw || typeof raw !== 'object') {
    return { api_base_url: '', api_key: '', model: fallbackModel }
  }
  const value = raw as Record<string, unknown>
  return {
    api_base_url: '',
    api_key: '',
    model: isModelProfileId(value.model) ? value.model : fallbackModel,
  }
}

export const mergeRerankingConfig = (
  raw: unknown,
): ModelConfig & { top_k: number; score: number } => {
  const merged = mergeModelConfig(raw, DEFAULT_RERANKING_MODEL_PROFILE_ID)
  const value = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const topK = typeof value.top_k === 'number' && Number.isFinite(value.top_k)
    ? Math.max(1, Math.floor(value.top_k))
    : 3
  const score = typeof value.score === 'number' && Number.isFinite(value.score)
    ? Math.min(1, Math.max(0, value.score))
    : 0.5
  return { ...merged, top_k: topK, score }
}
