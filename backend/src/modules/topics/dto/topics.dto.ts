import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateTopicDto {
  @ApiProperty({ description: 'Mã chủ đề (vd: english)' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Tên hiển thị (vd: Tiếng Anh)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả thêm' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateTopicDto {
  @ApiPropertyOptional({ description: 'Mã chủ đề (vd: english)' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Tên hiển thị (vd: Tiếng Anh)' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Mô tả thêm' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
