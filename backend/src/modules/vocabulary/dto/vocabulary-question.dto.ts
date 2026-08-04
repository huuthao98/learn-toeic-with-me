import {
  IsString,
  IsEnum,
  IsArray,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum QuestionStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
  REVIEW = 'review',
}

export class VocabularyAnswerOptionDto {
  @ApiProperty()
  @IsString()
  label: string; // A, B, C, D

  @ApiProperty()
  @IsString()
  text: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pinyin?: string;
}

export class CreateVocabularyQuestionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  testSetId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  questionNumber?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  setId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  passageContext?: string;

  @ApiProperty()
  @IsString()
  questionText: string;

  @ApiProperty({ description: 'Correct answer label: A, B, C, or D' })
  @IsString()
  correctAnswer: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({ type: [VocabularyAnswerOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VocabularyAnswerOptionDto)
  @IsOptional()
  options?: VocabularyAnswerOptionDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pinyin?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateVocabularyQuestionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  testSetId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  questionNumber?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  setId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  passageContext?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pinyin?: string;

  @ApiPropertyOptional({ enum: QuestionStatus })
  @IsEnum(QuestionStatus)
  @IsOptional()
  status?: QuestionStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  questionText?: string;

  @ApiPropertyOptional({ type: [VocabularyAnswerOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VocabularyAnswerOptionDto)
  @IsOptional()
  options?: VocabularyAnswerOptionDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
