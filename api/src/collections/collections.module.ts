import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';

@Module({
  imports: [PrismaModule, DocumentsModule],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
