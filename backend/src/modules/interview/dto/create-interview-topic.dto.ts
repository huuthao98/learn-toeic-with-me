import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateInterviewTopicDto {
  @ApiProperty({ example: 'Interview 2025' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'draft', enum: ['draft', 'public', 'private'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  notifyUsers?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['hr', 'technical'] })
  @IsOptional()
  topics?: string[];
}
