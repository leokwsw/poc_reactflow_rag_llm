import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomToolsController } from './custom-tools.controller';
import { CustomToolsService } from './custom-tools.service';

@Module({
  imports: [PrismaModule],
  controllers: [CustomToolsController],
  providers: [CustomToolsService],
})
export class CustomToolsModule {}
