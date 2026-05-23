import {
  IsString, IsEnum, IsArray, IsOptional, IsBoolean,
  ValidateNested, IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum QuestionStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
  REVIEW = 'review',
}

export class AnswerOptionDto {
  @ApiProperty()
  @IsString()
  label: string; // A, B, C, D

  @ApiProperty()
  @IsString()
  text: string;
}

export class CreateQuestionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  testSetId?: string;

  @ApiProperty({ enum: ['1','2','3','4','5','6','7'] })
  @IsString()
  part: string;

  @ApiProperty({ enum: DifficultyLevel })
  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @ApiProperty()
  @IsString()
  questionText: string;

  @ApiProperty({ type: [AnswerOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerOptionDto)
  options: AnswerOptionDto[];

  @ApiProperty({ description: 'Correct answer label: A, B, C, or D' })
  @IsString()
  correctAnswer: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateQuestionDto {
  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficulty?: DifficultyLevel;

  @IsEnum(QuestionStatus)
  @IsOptional()
  status?: QuestionStatus;

  @IsString()
  @IsOptional()
  questionText?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
