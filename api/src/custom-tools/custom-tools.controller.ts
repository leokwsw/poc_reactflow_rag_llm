import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CustomToolsService } from './custom-tools.service';
import { CreateCustomToolDto } from './dto';

@Controller('custom-tools')
export class CustomToolsController {
  constructor(private readonly tools: CustomToolsService) {}

  @Post()
  create(@Body() dto: CreateCustomToolDto) {
    return this.tools.create(dto);
  }

  @Get()
  list() {
    return this.tools.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.tools.get(id);
  }
}
