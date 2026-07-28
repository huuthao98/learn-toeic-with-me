import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class B1AnswerOptionDto {
  @IsString()
  label: string;

  @IsString()
  text: string;
}

export class CreateB1QuestionDto {
  @IsString()
  testSetId: string;

  @IsEnum(['listening', 'reading', 'writing', 'speaking'])
  skill: string;

  @IsOptional()
  @IsString()
  part?: string;

  @IsOptional()
  @IsNumber()
  questionNumber?: number;

  @IsEnum(['multiple_choice', 'essay', 'speaking'])
  @IsOptional()
  questionType?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => B1AnswerOptionDto)
  options?: B1AnswerOptionDto[];

  @IsString()
  @IsOptional()
  questionText?: string;

  @IsString()
  @IsOptional()
  correctAnswer?: string;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  passageContext?: string;

  @IsString()
  @IsOptional()
  passageType?: string;

  @IsNumber()
  @IsOptional()
  setId?: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  audioUrl?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
