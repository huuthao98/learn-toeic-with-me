import { IsEmail, IsString, MinLength, IsOptional, IsNumber, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 20 })
  @IsNumber()
  @IsOptional()
  age?: number;

  @ApiPropertyOptional({ example: 'user', enum: ['user', 'admin'] })
  @IsString()
  @IsOptional()
  @IsIn(['user', 'admin'])
  role?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class FirebasePhoneDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: 'user', enum: ['user', 'admin'] })
  @IsString()
  @IsOptional()
  @IsIn(['user', 'admin'])
  role?: string;
}
