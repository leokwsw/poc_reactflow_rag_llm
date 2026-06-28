import { Injectable } from '@nestjs/common';
import { ModelsService } from '../models/models.service';

const VECTOR_SIZE = 1536;

@Injectable()
export class EmbeddingsService {
  constructor(private readonly models: ModelsService) {}

  async embed(text: string): Promise<number[]> {
    const provider = this.models.getProviderConfig();
    const client = this.models.createOpenAIClient();

    if (!client) {
      return this.mockEmbedding(text);
    }

    const response = await client.embeddings.create({
      model: provider.embeddingModel,
      input: text,
    });

    return response.data[0]?.embedding ?? this.mockEmbedding(text);
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    const provider = this.models.getProviderConfig();
    const client = this.models.createOpenAIClient();

    if (!client) {
      return texts.map((text) => this.mockEmbedding(text));
    }

    const response = await client.embeddings.create({
      model: provider.embeddingModel,
      input: texts,
    });

    return texts.map((text, index) => response.data[index]?.embedding ?? this.mockEmbedding(text));
  }

  private mockEmbedding(text: string): number[] {
    const vector = new Array<number>(VECTOR_SIZE).fill(0);
    for (let index = 0; index < text.length; index += 1) {
      const bucket = index % VECTOR_SIZE;
      vector[bucket] += (text.charCodeAt(index) % 31) / 31;
    }
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vector.map((value) => value / norm);
  }
}
