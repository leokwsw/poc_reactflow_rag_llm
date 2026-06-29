import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsBoolean, IsIn, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { ModelProviderKind } from '@prisma/client';
import { ModelsService } from './models.service';

class TestModelDto {
  @IsOptional()
  @IsString()
  prompt?: string;
}

class CreateModelProviderDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsString()
  @MinLength(1)
  baseUrl!: string;

  @IsOptional()
  @IsString()
  apiKeyRef?: string;

  @IsIn(['llm', 'embedding', 'rerank'])
  kind!: ModelProviderKind;

  @IsString()
  @MinLength(1)
  model!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

class CreateModelConfigDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsIn(['llm', 'embedding', 'rerank'])
  kind!: ModelProviderKind;

  @IsString()
  @MinLength(1)
  model!: string;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

@Controller('models')
export class ModelsController {
  constructor(private readonly models: ModelsService) {}

  @Get('providers')
  providers() {
    return this.models.listProviders();
  }

  @Post('providers')
  createProvider(@Body() dto: CreateModelProviderDto) {
    return this.models.createProvider(dto);
  }

  @Post('providers/:id/configs')
  createConfig(@Body() dto: CreateModelConfigDto, @Param('id') id: string) {
    return this.models.createModelConfig(id, dto);
  }

  @Post('test')
  async test(@Body() _body: TestModelDto) {
    return this.models.testProvider();
  }
}
