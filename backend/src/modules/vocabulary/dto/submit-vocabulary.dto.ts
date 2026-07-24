import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class SubmitVocabularyDto {
  @ApiProperty({ example: { questionId123: 'A' } })
  @IsObject()
  answers: { [questionId: string]: string };

  @ApiPropertyOptional({ example: 45 })
  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: [3, 4, 5, 2, 6] })
  @IsArray()
  @IsOptional()
  timePerQuestion?: number[];

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isTest?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isReview?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isTestOut?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isRescueStreak?: boolean;
}
