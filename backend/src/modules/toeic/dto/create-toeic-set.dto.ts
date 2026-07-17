import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateToeicSetDto {
  @ApiProperty({ example: 'Toeic exam 2025' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'audio/test1.mp3' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({ example: 'draft', enum: ['draft', 'public', 'private'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'pdf/test1.pdf' })
  @IsString()
  @IsOptional()
  readingPdfUrl?: string;

  @ApiPropertyOptional({ example: 'toeic', enum: ['toeic', 'interview', 'vocabulary'] })
  @IsString()
  @IsOptional()
  testType?: string;

  @ApiPropertyOptional({ example: 'pdf/listening_test1.pdf' })
  @IsString()
  @IsOptional()
  listeningPdfUrl?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  notifyUsers?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['english', 'toeic'] })
  @IsOptional()
  topics?: string[];
}
