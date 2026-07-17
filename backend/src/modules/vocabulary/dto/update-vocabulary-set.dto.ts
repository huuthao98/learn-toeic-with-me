import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateVocabularySetDto {
  @ApiPropertyOptional({ example: 'Updated Vocabulary 2026' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'public', enum: ['draft', 'public', 'private'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'english' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  notifyUsers?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['business', 'daily'] })
  @IsOptional()
  topics?: string[];
}
