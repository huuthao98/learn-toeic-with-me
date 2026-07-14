import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsNumber()
  targetScore?: number;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  notificationTopics?: string[];
}
