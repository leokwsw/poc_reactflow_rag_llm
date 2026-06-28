import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { ModelsService } from './models.service';

class TestModelDto {
  @IsOptional()
  @IsString()
  prompt?: string;
}

@Controller('models')
export class ModelsController {
  constructor(private readonly models: ModelsService) {}

  @Get('providers')
  providers() {
    return this.models.listProviders();
  }

  @Post('test')
  async test(@Body() _body: TestModelDto) {
    return this.models.testProvider();
  }
}
