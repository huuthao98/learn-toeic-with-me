import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { TestsService } from './tests.service';
import { JwtAuthGuard, AdminGuard } from '../auth/guards/jwt-auth.guard';

import { IsString, IsOptional, IsNumber, Min, IsObject } from 'class-validator';

class SubmitExamDto {
  @ApiProperty({ example: { questionId123: 'A' } })
  @IsObject()
  answers: { [questionId: string]: string };

  @ApiPropertyOptional({ example: 45 })
  @IsNumber()
  @IsOptional()
  durationMinutes?: number;
}

class CreateTestSetDto {
  @ApiProperty({ example: 'Toeic exam 2025' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'audio/test1.mp3' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({ example: 'draft', enum: ['draft', 'public', 'private'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'pdf/test1.pdf' })
  @IsString()
  @IsOptional()
  readingPdfUrl?: string;

  @ApiPropertyOptional({ example: 'toeic', enum: ['toeic', 'interview'] })
  @IsString()
  @IsOptional()
  testType?: string;

  @ApiPropertyOptional({ example: 'pdf/listening_test1.pdf' })
  @IsString()
  @IsOptional()
  listeningPdfUrl?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  notifyUsers?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['english', 'toeic'] })
  @IsOptional()
  topics?: string[];
}

class UpdateTestSetDto {
  @ApiPropertyOptional({ example: 'Updated TOEIC Exam 2026' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'audio/test1_updated.mp3' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({ example: 'public', enum: ['draft', 'public', 'private'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  isV2?: boolean;

  @ApiPropertyOptional({ example: 'pdf/test1_updated.pdf' })
  @IsString()
  @IsOptional()
  readingPdfUrl?: string;

  @ApiPropertyOptional({ example: 'toeic', enum: ['toeic', 'interview'] })
  @IsString()
  @IsOptional()
  testType?: string;

  @ApiPropertyOptional({ example: 'pdf/listening_test1_updated.pdf' })
  @IsString()
  @IsOptional()
  listeningPdfUrl?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  notifyUsers?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['english', 'toeic'] })
  @IsOptional()
  topics?: string[];
}

@ApiTags('Tests')
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all test sets' })
  findAll(@Query('testType') testType?: string, @Query('status') status?: string) {
    return this.testsService.findAll(testType, status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get test set metadata by ID' })
  findOne(@Param('id') id: string) {
    return this.testsService.findOne(id);
  }

  @Get('results/:resultId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific test result by ID' })
  findResult(@Param('resultId') resultId: string) {
    return this.testsService.findResult(resultId);
  }

  @Get(':id/questions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get questions belonging to a test set' })
  findQuestions(@Param('id') id: string) {
    return this.testsService.findQuestions(id);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit answers for a test set' })
  submitExam(@Request() req: any, @Param('id') id: string, @Body() dto: SubmitExamDto) {
    return this.testsService.submitExam(req.user.sub, id, dto.answers, dto.durationMinutes);
  }

  @Post('admin/create')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new test set (Admin)' })
  createTestSet(@Body() dto: CreateTestSetDto) {
    return this.testsService.create(dto);
  }

  @Patch('admin/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a test set (Admin)' })
  updateTestSet(@Param('id') id: string, @Body() dto: UpdateTestSetDto) {
    return this.testsService.update(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a test set (Admin)' })
  deleteTestSet(@Param('id') id: string) {
    return this.testsService.delete(id);
  }
}
