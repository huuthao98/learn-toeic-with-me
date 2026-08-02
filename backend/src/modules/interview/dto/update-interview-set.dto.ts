import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateInterviewSetDto {
  @ApiPropertyOptional({ example: 'Updated Interview 2026' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Updated Correct Answer' })
  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @ApiPropertyOptional({ example: 'public', enum: ['draft', 'public', 'private'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'external', enum: ['external', 'vip0', 'vip1', 'vip2', 'vip3'] })
  @IsString()
  @IsOptional()
  accessLevel?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  notifyUsers?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['hr', 'technical'] })
  @IsOptional()
  topics?: string[];
}
