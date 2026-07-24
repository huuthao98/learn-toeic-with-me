import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class SubmitToeicDto {
  @ApiProperty({ example: { questionId123: 'A' } })
  @IsObject()
  answers: { [questionId: string]: string };

  @ApiPropertyOptional({ example: 45 })
  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isTest?: boolean;

  @ApiPropertyOptional({ example: [3000, 2000, 1500] })
  @IsArray()
  @IsOptional()
  timePerQuestion?: number[];
}
