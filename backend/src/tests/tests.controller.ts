import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TestsService } from './tests.service';
import { JwtAuthGuard, AdminGuard } from '../auth/guards/jwt-auth.guard';

class SubmitExamDto {
  answers: { [questionId: string]: string };
  durationMinutes?: number;
}

class CreateTestSetDto {
  name: string;
  description?: string;
  total_questions?: number;
  parts_count?: number;
}

@ApiTags('Tests')
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all test sets' })
  findAll() {
    return this.testsService.findAll();
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
  submitExam(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: SubmitExamDto,
  ) {
    return this.testsService.submitExam(req.user.sub, id, dto.answers, dto.durationMinutes);
  }

  @Post('admin/create')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new test set (Admin)' })
  createTestSet(@Body() dto: CreateTestSetDto) {
    return this.testsService.create(dto);
  }
}
