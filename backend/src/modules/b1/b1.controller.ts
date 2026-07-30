import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { B1Service } from './b1.service';
import { CreateB1QuestionDto } from './dto/b1-question.dto';
import { VipAccessGuard } from '@/common/guards/vip-access.guard';
import { RequireVipAccess } from '@/common/decorators/require-vip-access.decorator';
import { JwtAuthGuard, AdminGuard, OptionalJwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('B1')
@Controller('b1')
export class B1Controller {
  constructor(private readonly b1Service: B1Service) {}

  // ─── Public / User Routes ───────────────────────────────────────────────────

  @Get('sets')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all test sets' })
  getTestSets(@Request() req: any, @Query('status') status?: string) {
    return this.b1Service.getTestSets(status, req.user);
  }

  @Get('sets/:id')
  @UseGuards(OptionalJwtAuthGuard, VipAccessGuard)
  @RequireVipAccess({ category: 'B1', modelName: 'B1Set' })
  @ApiOperation({ summary: 'Get a test set by ID' })
  getTestSetById(@Request() req: any, @Param('id') id: string) {
    // Trả về trực tiếp bài test được Guard cache lại (Tiết kiệm 1 query DB)
    return req.testSet;
  }

  @Get('sets/:id/questions')
  @UseGuards(OptionalJwtAuthGuard, VipAccessGuard)
  @RequireVipAccess({ category: 'B1', modelName: 'B1Set' })
  @ApiOperation({ summary: 'Get questions belonging to a test set' })
  getQuestions(
    // @Request() req: any,
    @Param('id') id: string,
    @Query('skip') skip?: number,
    @Query('limit') limit?: number,
  ) {
    return this.b1Service.getQuestions(id, skip ? Number(skip) : 0, limit ? Number(limit) : 0);
  }

  @Get('results/:resultId')
  @ApiOperation({ summary: 'Get a specific test result by ID' })
  getTestResult(@Param('resultId') resultId: string) {
    return this.b1Service.getTestResult(resultId);
  }

  @Post('sets/:id/submit')
  @UseGuards(OptionalJwtAuthGuard, VipAccessGuard)
  @RequireVipAccess({ category: 'B1', modelName: 'B1Set' })
  @ApiOperation({ summary: 'Submit answers for a test set' })
  submitExam(
    @Request() req: any,
    @Param('id') id: string,
    @Body()
    data: {
      answers: { [questionId: string]: string };
      durationMinutes?: number;
      timePerQuestion?: number[];
      isTest?: boolean;
    },
  ) {
    return this.b1Service.submitExam(req.user, id, data);
  }

  // ─── Admin Routes ───────────────────────────────────────────────────────────

  @Post('sets')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new test set (Admin)' })
  createTestSet(
    @Body()
    data: {
      name: string;
      description?: string;
      audioUrl?: string;
      status?: string;
      accessLevel?: string;
      topics?: string[];
    },
  ) {
    return this.b1Service.createTestSet(data);
  }

  @Put('sets/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a test set (Admin)' })
  updateTestSet(@Param('id') id: string, @Body() data: any) {
    return this.b1Service.updateTestSet(id, data);
  }

  @Delete('sets/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a test set (Admin)' })
  deleteTestSet(@Param('id') id: string) {
    return this.b1Service.deleteTestSet(id);
  }

  @Post('sets/:id/questions/bulk')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk upsert questions for a test set (Admin)' })
  upsertBulkQuestions(
    @Param('id') testSetId: string,
    @Body() questions: Partial<CreateB1QuestionDto & { questionNumber: number }>[],
  ) {
    return this.b1Service.upsertBulkQuestions(testSetId, questions);
  }
  @Patch('questions/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a single question by ID (Admin)' })
  updateQuestion(@Param('id') id: string, @Body() data: any) {
    return this.b1Service.updateQuestion(id, data);
  }
}
