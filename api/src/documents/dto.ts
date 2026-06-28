import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
