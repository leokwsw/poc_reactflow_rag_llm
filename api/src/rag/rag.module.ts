import { Module } from '@nestjs/common';
import { GraphModule } from '../graph/graph.module';
import { ModelsModule } from '../models/models.module';
import { SearchModule } from '../search/search.module';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';

@Module({
  imports: [SearchModule, GraphModule, ModelsModule],
  controllers: [RagController],
  providers: [RagService],
  exports: [RagService],
})
export class RagModule {}
