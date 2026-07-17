import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional } from 'class-validator';

export class SubmitVocabularyDto {
  @ApiProperty({ example: { questionId123: 'A' } })
  @IsObject()
  answers: { [questionId: string]: string };

  @ApiPropertyOptional({ example: 45 })
  @IsNumber()
  @IsOptional()
  durationMinutes?: number;
}
