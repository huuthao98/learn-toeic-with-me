import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiPropertyOptional({ description: 'UserId to send to. If null, broadcast to all or target specific plan' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Plan to target, e.g. "free", "premium". Works if userId is null.' })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiPropertyOptional({ description: 'Topics to target. Array of topic strings.' })
  @IsOptional()
  topics?: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ default: 'SYSTEM' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class RegisterFcmTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token: string;
}
