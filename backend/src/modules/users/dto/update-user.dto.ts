import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsArray()
  vipPackages?: any[];
  
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
