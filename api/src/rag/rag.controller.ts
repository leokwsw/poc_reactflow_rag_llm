import { Body, Controller, Post } from '@nestjs/common';
import { RagQueryDto } from './dto';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(private readonly rag: RagService) {}

  @Post('query')
  query(@Body() dto: RagQueryDto) {
    return this.rag.query(dto);
  }
}
