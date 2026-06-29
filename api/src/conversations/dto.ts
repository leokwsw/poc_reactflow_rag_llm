import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  workflowId!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  mode?: 'native' | 'graph' | 'hybrid';
}
