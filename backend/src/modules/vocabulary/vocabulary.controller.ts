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
import { VocabularyService } from './vocabulary.service';
import { JwtAuthGuard, AdminGuard, OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { SubmitVocabularyDto } from './dto/submit-vocabulary.dto';
import { CreateVocabularySetDto } from './dto/create-vocabulary-set.dto';
import { UpdateVocabularySetDto } from './dto/update-vocabulary-set.dto';

@ApiTags('Vocabulary')
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly VocabularyService: VocabularyService) {}

  // ─── Public / User Routes ───────────────────────────────────────────────────

  @Get('sets')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all vocabulary sets' })
  findAll(@Request() req: any, @Query('category') category?: string, @Query('status') status?: string) {
    return this.VocabularyService.findAll(status, category, req.user);
  }

  @Get('sets/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a vocabulary set by ID' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.VocabularyService.findOne(id, req.user);
  }

  @Get('sets/:id/questions')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get questions belonging to a vocabulary set' })
  findQuestions(
    @Request() req: any,
    @Param('id') id: string,
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const limitNum = limit ? parseInt(limit, 10) : 0;
    return this.VocabularyService.findQuestions(id, req.user, skipNum, limitNum);
  }

  @Get('results/:resultId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific test result by ID' })
  findResult(@Param('resultId') resultId: string) {
    return this.VocabularyService.findResult(resultId);
  }

  @Post('sets/:id/submit')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit answers for a vocabulary set' })
  submitExam(@Request() req: any, @Param('id') id: string, @Body() dto: SubmitVocabularyDto) {
    return this.VocabularyService.submitExam(
      req.user,
      id,
      dto.answers,
      dto.durationMinutes,
      dto.timePerQuestion,
      dto.isTest,
      dto.isReview,
      dto.isTestOut,
      dto.isRescueStreak
    );
  }

  // ─── Admin Routes ───────────────────────────────────────────────────────────

  @Post('sets')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new vocabulary set (Admin)' })
  createVocabularySet(@Body() dto: CreateVocabularySetDto) {
    return this.VocabularyService.create(dto);
  }

  @Patch('sets/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a vocabulary set (Admin)' })
  updateVocabularySet(@Param('id') id: string, @Body() dto: UpdateVocabularySetDto) {
    return this.VocabularyService.update(id, dto);
  }

  @Delete('sets/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a vocabulary set (Admin)' })
  deleteVocabularySet(@Param('id') id: string) {
    return this.VocabularyService.delete(id);
  }

  @Post('sets/:id/questions/bulk-upsert')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk upsert questions for a vocabulary set (Admin)' })
  bulkUpsertQuestions(
    @Param('id') id: string,
    @Body() dto: { questions: any[] },
  ) {
    return this.VocabularyService.upsertBulkQuestions(id, dto.questions);
  }

  @Patch('questions/:questionId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a question by ID (Admin)' })
  updateQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: any,
  ) {
    return this.VocabularyService.updateQuestion(questionId, dto);
  }

  @Delete('questions/:questionId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a question by ID (Admin)' })
  deleteQuestion(@Param('questionId') questionId: string) {
    return this.VocabularyService.deleteQuestion(questionId);
  }
}
