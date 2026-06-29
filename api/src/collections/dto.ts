import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class AddCollectionDocumentDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  content!: string;

  @IsString()
  sourceType!: string;

  @IsOptional()
  @IsString()
  sourceUri?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
