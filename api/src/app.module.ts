import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { DocumentsModule } from './documents/documents.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { GraphModule } from './graph/graph.module';
import { ModelsModule } from './models/models.module';
import { PrismaModule } from './prisma/prisma.module';
import { RagModule } from './rag/rag.module';
import { SearchModule } from './search/search.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { envFilePaths } from './config/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePaths(),
    }),
    PrismaModule,
    ModelsModule,
    EmbeddingsModule,
    SearchModule,
    GraphModule,
    DocumentsModule,
    RagModule,
    WorkflowsModule,
    ChatModule,
  ],
})
export class AppModule {}
