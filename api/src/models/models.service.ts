import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  chatModel: string;
  embeddingModel: string;
  rerankModel?: string;
}

@Injectable()
export class ModelsService {
  constructor(private readonly config: ConfigService) {}

  getProviderConfig(): ProviderConfig {
    return {
      baseUrl: this.config.get<string>('OPENAI_COMPATIBLE_BASE_URL', 'https://api.openai.com/v1'),
      apiKey: this.config.get<string>('OPENAI_COMPATIBLE_API_KEY', ''),
      chatModel: this.config.get<string>('OPENAI_CHAT_MODEL', 'gpt-4o-mini'),
      embeddingModel: this.config.get<string>('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
      rerankModel: this.config.get<string>('OPENAI_RERANK_MODEL', ''),
    };
  }

  createOpenAIClient(): OpenAI | null {
    const provider = this.getProviderConfig();
    if (!provider.apiKey) {
      return null;
    }

    return new OpenAI({
      apiKey: provider.apiKey,
      baseURL: provider.baseUrl,
    });
  }

  async chat(prompt: string, contexts: string[] = []): Promise<string> {
    const provider = this.getProviderConfig();
    const client = this.createOpenAIClient();
    const contextText = contexts.map((context, index) => `[${index + 1}] ${context}`).join('\n\n');

    if (!client) {
      return [
        'Mock answer generated without an API key.',
        contextText ? `Context used:\n${contextText.slice(0, 1200)}` : `Prompt: ${prompt}`,
      ].join('\n\n');
    }

    const completion = await client.chat.completions.create({
      model: provider.chatModel,
      messages: [
        {
          role: 'system',
          content: 'You are a concise RAG assistant. Answer from the provided context and state uncertainty when context is weak.',
        },
        {
          role: 'user',
          content: `Question:\n${prompt}\n\nContext:\n${contextText}`,
        },
      ],
      temperature: 0.2,
    });

    return completion.choices[0]?.message.content ?? '';
  }

  async testProvider() {
    const provider = this.getProviderConfig();
    const client = this.createOpenAIClient();
    if (!client) {
      return {
        ok: true,
        mode: 'mock',
        provider,
        message: 'No API key configured. Local mock mode is active.',
      };
    }

    const models = await client.models.list();
    return {
      ok: true,
      mode: 'remote',
      provider,
      sampleModelIds: models.data.slice(0, 5).map((model) => model.id),
    };
  }

  listProviders() {
    const provider = this.getProviderConfig();
    return [
      {
        id: 'env-llm',
        name: 'OpenAI-compatible Chat',
        baseUrl: provider.baseUrl,
        apiKeyRef: 'OPENAI_COMPATIBLE_API_KEY',
        kind: 'llm',
        model: provider.chatModel,
        enabled: true,
      },
      {
        id: 'env-embedding',
        name: 'OpenAI-compatible Embedding',
        baseUrl: provider.baseUrl,
        apiKeyRef: 'OPENAI_COMPATIBLE_API_KEY',
        kind: 'embedding',
        model: provider.embeddingModel,
        enabled: true,
      },
      {
        id: 'env-rerank',
        name: 'Optional Reranker',
        baseUrl: provider.baseUrl,
        apiKeyRef: 'OPENAI_COMPATIBLE_API_KEY',
        kind: 'rerank',
        model: provider.rerankModel,
        enabled: Boolean(provider.rerankModel),
      },
    ];
  }
}
