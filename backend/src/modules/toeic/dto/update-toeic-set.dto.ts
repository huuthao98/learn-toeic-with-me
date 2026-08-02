import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateToeicSetDto {
  @ApiPropertyOptional({ example: 'Updated TOEIC Exam 2026' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'audio/test1_updated.mp3' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({ example: 'public', enum: ['draft', 'public', 'private'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'pdf/test1_updated.pdf' })
  @IsString()
  @IsOptional()
  readingPdfUrl?: string;

  @ApiPropertyOptional({ example: 'toeic', enum: ['toeic', 'interview', 'vocabulary'] })
  @IsString()
  @IsOptional()
  testType?: string;

  @ApiPropertyOptional({ example: 'pdf/listening_test1_updated.pdf' })
  @IsString()
  @IsOptional()
  listeningPdfUrl?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  notifyUsers?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['english', 'toeic'] })
  @IsOptional()
  topics?: string[];

  @ApiPropertyOptional({ example: 'exam', enum: ['practice', 'exam'] })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'external', enum: ['external', 'vip0', 'vip1', 'vip2', 'vip3'] })
  @IsString()
  @IsOptional()
  accessLevel?: string;
}
