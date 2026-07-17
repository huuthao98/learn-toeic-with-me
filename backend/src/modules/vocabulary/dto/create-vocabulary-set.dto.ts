import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateVocabularySetDto {
  @ApiProperty({ example: 'Vocabulary 2025' })
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
