import { Module } from '@nestjs/common';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { GraphModule } from '../graph/graph.module';
import { ModelsModule } from '../models/models.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchModule } from '../search/search.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [PrismaModule, EmbeddingsModule, SearchModule, GraphModule, ModelsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
