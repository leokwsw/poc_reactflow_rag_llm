import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { SearchService } from './search.service';

@Module({
  imports: [EmbeddingsModule],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
