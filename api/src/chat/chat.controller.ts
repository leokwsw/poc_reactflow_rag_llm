import { Body, Controller, Post } from '@nestjs/common';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';
import { ModelsService } from '../models/models.service';

class ChatDto {
  @IsString()
  @MinLength(1)
  prompt!: string;

  @IsOptional()
  @IsArray()
  contexts?: string[];
}

@Controller('chat')
export class ChatController {
  constructor(private readonly models: ModelsService) {}

  @Post()
  chat(@Body() dto: ChatDto) {
    return this.models.chat(dto.prompt, dto.contexts ?? []);
  }
}
