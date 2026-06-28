import { Module } from '@nestjs/common';
import { ModelsModule } from '../models/models.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [ModelsModule],
  controllers: [ChatController],
})
export class ChatModule {}
