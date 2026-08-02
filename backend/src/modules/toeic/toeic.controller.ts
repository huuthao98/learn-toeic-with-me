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
} from '@nestjs/swagger';
import { ToeicService } from './toeic.service';
import { JwtAuthGuard, AdminGuard, OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VipAccessGuard } from '@/common/guards/vip-access.guard';
import { RequireVipAccess } from '@/common/decorators/require-vip-access.decorator';

import { SubmitToeicDto } from './dto/submit-toeic.dto';
import { CreateToeicSetDto } from './dto/create-toeic-set.dto';
import { UpdateToeicSetDto } from './dto/update-toeic-set.dto';

@ApiTags('Toeic')
@Controller('toeic')
export class ToeicController {
  constructor(private readonly ToeicService: ToeicService) {}

  // ─── Public / User Routes ───────────────────────────────────────────────────

  @Get('sets')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all test sets' })
  findAll(@Request() req: any, @Query('status') status?: string, @Query('type') type?: string) {
    return this.ToeicService.findAll(status, type, req.user);
  }

  @Get('sets/:id')
  @UseGuards(OptionalJwtAuthGuard, VipAccessGuard)
  @RequireVipAccess({ category: 'TOEIC', modelName: 'ToeicSet' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get test set metadata by ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    const totalQuestions = await this.ToeicService.countQuestions(id);
    return { ...req.testSet.toObject(), totalQuestions };
  }

  @Get('sets/:id/questions')
  @UseGuards(OptionalJwtAuthGuard, VipAccessGuard)
  @RequireVipAccess({ category: 'TOEIC', modelName: 'ToeicSet' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get questions belonging to a test set' })
  findQuestions(
    @Request() req: any,
    @Param('id') id: string,
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const limitNum = limit ? parseInt(limit, 10) : 0;
    return this.ToeicService.getQuestions(id, skipNum, limitNum);
  }

  @Get('results/:resultId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific test result by ID' })
  findResult(@Param('resultId') resultId: string) {
    return this.ToeicService.findResult(resultId);
  }

  @Post('sets/:id/submit')
  @UseGuards(OptionalJwtAuthGuard, VipAccessGuard)
  @RequireVipAccess({ category: 'TOEIC', modelName: 'ToeicSet' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit answers for a test set' })
  submitExam(@Request() req: any, @Param('id') id: string, @Body() dto: SubmitToeicDto) {
    return this.ToeicService.submitExam(req.user, id, dto.answers, dto.durationMinutes, dto.timePerQuestion, dto.isTest);
  }

  // ─── Admin Routes ───────────────────────────────────────────────────────────

  @Post('sets')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new test set (Admin)' })
  createToeicSet(@Body() dto: CreateToeicSetDto) {
    return this.ToeicService.create(dto);
  }

  @Patch('sets/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a test set (Admin)' })
  updateToeicSet(@Param('id') id: string, @Body() dto: UpdateToeicSetDto) {
    return this.ToeicService.update(id, dto);
  }

  @Delete('sets/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a test set (Admin)' })
  deleteToeicSet(@Param('id') id: string) {
    return this.ToeicService.delete(id);
  }

  @Post('sets/:id/questions/bulk-upsert')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk upsert questions for a test set (Admin)' })
  bulkUpsertQuestions(
    @Param('id') id: string,
    @Body() dto: { questions: any[] },
  ) {
    return this.ToeicService.upsertBulkQuestions(id, dto.questions);
  }

  @Patch('questions/:questionId')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a question by ID (Admin)' })
  updateQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: any,
  ) {
    return this.ToeicService.updateQuestion(questionId, dto);
  }

  @Delete('questions/:questionId')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a question by ID (Admin)' })
  deleteQuestion(
    @Param('questionId') questionId: string,
  ) {
    return this.ToeicService.deleteQuestion(questionId);
  }
}
