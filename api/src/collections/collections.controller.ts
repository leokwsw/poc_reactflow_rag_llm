import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { AddCollectionDocumentDto, CreateCollectionDto } from './dto';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Post()
  create(@Body() dto: CreateCollectionDto) {
    return this.collections.create(dto);
  }

  @Get()
  list() {
    return this.collections.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.collections.get(id);
  }

  @Post(':id/documents')
  addDocument(@Param('id') id: string, @Body() dto: AddCollectionDocumentDto) {
    return this.collections.addDocument(id, dto);
  }

  @Post(':id/documents/:documentId/ingest')
  ingestDocument(@Param('id') id: string, @Param('documentId') documentId: string) {
    return this.collections.ingestDocument(id, documentId);
  }
}
