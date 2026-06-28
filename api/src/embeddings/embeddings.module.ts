import { Module } from '@nestjs/common';
import { ModelsModule } from '../models/models.module';
import { EmbeddingsService } from './embeddings.service';

@Module({
  imports: [ModelsModule],
  providers: [EmbeddingsService],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
