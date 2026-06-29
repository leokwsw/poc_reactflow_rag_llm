import { IsIn, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCustomToolDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;

  @IsOptional()
  @IsIn(['none', 'apiKey', 'bearer', 'basic'])
  authType?: 'none' | 'apiKey' | 'bearer' | 'basic';

  @IsOptional()
  @IsObject()
  authConfig?: Record<string, unknown>;

  @IsObject()
  openapiSpec!: Record<string, unknown>;
}
