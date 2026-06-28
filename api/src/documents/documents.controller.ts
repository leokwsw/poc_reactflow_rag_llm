import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateDocumentDto } from './dto';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post()
  create(@Body() dto: CreateDocumentDto) {
    return this.documents.create(dto);
  }

  @Get()
  list() {
    return this.documents.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.documents.get(id);
  }

  @Post(':id/ingest')
  ingest(@Param('id') id: string) {
    return this.documents.ingest(id);
  }
}
