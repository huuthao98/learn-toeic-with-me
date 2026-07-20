import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum QuestionStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
  REVIEW = 'review',
}

export class CreateInterviewQuestionDto {
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

  @ApiProperty()
  @IsString()
  correctAnswer: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateInterviewQuestionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  testSetId?: string;

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
