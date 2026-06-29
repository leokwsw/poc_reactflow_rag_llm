import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto, SendMessageDto } from './dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Post()
  create(@Body() dto: CreateConversationDto) {
    return this.conversations.create(dto);
  }

  @Get()
  list() {
    return this.conversations.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.conversations.get(id);
  }

  @Post(':id/messages')
  sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.conversations.sendMessage(id, dto);
  }
}
