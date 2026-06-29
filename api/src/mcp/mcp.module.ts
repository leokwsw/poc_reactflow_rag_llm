import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

@Module({
  imports: [PrismaModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
