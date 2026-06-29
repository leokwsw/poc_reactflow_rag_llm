import { IsBoolean, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMcpServerDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  identifier!: string;

  @IsString()
  @MinLength(1)
  serverUrl!: string;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpsertMcpToolDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  inputSchema?: Record<string, unknown>;
}
