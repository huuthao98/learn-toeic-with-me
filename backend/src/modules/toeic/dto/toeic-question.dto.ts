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

export class ToeicAnswerOptionDto {
  @ApiProperty()
  @IsString()
  label: string; // A, B, C, D

  @ApiProperty()
  @IsString()
  text: string;
}

export class CreateToeicQuestionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  testSetId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  questionNumber?: number;

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

  @ApiPropertyOptional({ type: [ToeicAnswerOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToeicAnswerOptionDto)
  @IsOptional()
  options?: ToeicAnswerOptionDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  part?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateToeicQuestionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  testSetId?: string;

  @ApiPropertyOptional({ enum: ['1', '2', '3', '4', '5', '6', '7'] })
  @IsString()
  @IsOptional()
  part?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  questionNumber?: number;

  @ApiPropertyOptional({ enum: QuestionStatus })
  @IsEnum(QuestionStatus)
  @IsOptional()
  status?: QuestionStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  questionText?: string;

  @ApiPropertyOptional({ type: [ToeicAnswerOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToeicAnswerOptionDto)
  @IsOptional()
  options?: ToeicAnswerOptionDto[];

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
