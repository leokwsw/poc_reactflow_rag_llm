import { IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { RagMode } from '../common/types';

export class RagQueryDto {
  @IsString()
  @MinLength(1)
  query!: string;

  @IsIn(['native', 'graph', 'hybrid'])
  mode!: RagMode;

  @IsOptional()
  @IsInt()
  @Min(1)
  topK?: number;

  @IsOptional()
  @IsString()
  workflowId?: string;
}
