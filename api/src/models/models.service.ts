import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelProviderKind } from '@prisma/client';
import OpenAI from 'openai';
import { toPrismaJson } from '../common/json';
import { PrismaService } from '../prisma/prisma.service';

export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  chatModel: string;
  embeddingModel: string;
  rerankModel?: string;
}

@Injectable()
export class ModelsService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

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

  async listProviders() {
    const provider = this.getProviderConfig();
    const databaseProviders = await this.prisma.modelProvider.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { modelConfigs: true },
    });
    const envProviders = [
      {
        id: 'env-llm',
        name: 'OpenAI-compatible Chat',
        provider: 'openai-compatible',
        baseUrl: provider.baseUrl,
        apiKeyRef: 'OPENAI_COMPATIBLE_API_KEY',
        kind: 'llm',
        model: provider.chatModel,
        enabled: true,
      },
      {
        id: 'env-embedding',
        name: 'OpenAI-compatible Embedding',
        provider: 'openai-compatible',
        baseUrl: provider.baseUrl,
        apiKeyRef: 'OPENAI_COMPATIBLE_API_KEY',
        kind: 'embedding',
        model: provider.embeddingModel,
        enabled: true,
      },
      {
        id: 'env-rerank',
        name: 'Optional Reranker',
        provider: 'openai-compatible',
        baseUrl: provider.baseUrl,
        apiKeyRef: 'OPENAI_COMPATIBLE_API_KEY',
        kind: 'rerank',
        model: provider.rerankModel,
        enabled: Boolean(provider.rerankModel),
      },
    ];
    return [...databaseProviders, ...envProviders];
  }

  createProvider(input: {
    name: string;
    provider?: string;
    baseUrl: string;
    apiKeyRef?: string;
    kind: ModelProviderKind;
    model: string;
    enabled?: boolean;
    config?: Record<string, unknown>;
  }) {
    return this.prisma.modelProvider.create({
      data: {
        name: input.name,
        provider: input.provider ?? 'openai-compatible',
        baseUrl: input.baseUrl,
        apiKeyRef: input.apiKeyRef ?? '',
        kind: input.kind,
        model: input.model,
        enabled: input.enabled ?? true,
        config: toPrismaJson(input.config ?? {}),
      },
      include: { modelConfigs: true },
    });
  }

  createModelConfig(
    providerId: string,
    input: { name: string; kind: ModelProviderKind; model: string; parameters?: Record<string, unknown>; enabled?: boolean },
  ) {
    return this.prisma.modelConfig.create({
      data: {
        providerId,
        name: input.name,
        kind: input.kind,
        model: input.model,
        parameters: toPrismaJson(input.parameters ?? {}),
        enabled: input.enabled ?? true,
      },
    });
  }
}
