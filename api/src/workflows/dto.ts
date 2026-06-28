import { IsArray, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateWorkflowDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  nodes!: unknown[];

  @IsArray()
  edges!: unknown[];
}

export class UpdateWorkflowDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  nodes?: unknown[];

  @IsOptional()
  @IsArray()
  edges?: unknown[];
}

export class RunWorkflowDto {
  @IsObject()
  input!: {
    query?: string;
    mode?: 'native' | 'graph' | 'hybrid';
  };
}
