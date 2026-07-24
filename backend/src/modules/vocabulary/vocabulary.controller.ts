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
import { VocabularyService } from './vocabulary.service';
import { JwtAuthGuard, AdminGuard, OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { SubmitVocabularyDto } from './dto/submit-vocabulary.dto';
import { CreateVocabularySetDto } from './dto/create-vocabulary-set.dto';
import { UpdateVocabularySetDto } from './dto/update-vocabulary-set.dto';

@ApiTags('Vocabulary')
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly VocabularyService: VocabularyService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all test sets' })
  findAll(@Request() req: any, @Query('category') category?: string, @Query('status') status?: string) {
    return this.VocabularyService.findAll(status, category, req.user);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get test set metadata by ID' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.VocabularyService.findOne(id, req.user);
  }

  @Get('results/:resultId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific test result by ID' })
  findResult(@Param('resultId') resultId: string) {
    return this.VocabularyService.findResult(resultId);
  }

  @Get(':id/questions')
  @UseGuards(OptionalJwtAuthGuard)
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
    return this.VocabularyService.findQuestions(id, req.user, skipNum, limitNum);
  }

  @Post('admin/:id/questions/bulk-upsert')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk upsert questions for a test set (Admin)' })
  bulkUpsertQuestions(
    @Param('id') id: string,
    @Body() dto: { questions: any[] },
  ) {
    return this.VocabularyService.upsertBulkQuestions(id, dto.questions);
  }

  @Post(':id/submit')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit answers for a test set' })
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

  @Post('admin/create')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new test set (Admin)' })
  createVocabularySet(@Body() dto: CreateVocabularySetDto) {
    return this.VocabularyService.create(dto);
  }

  @Patch('admin/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a test set (Admin)' })
  updateVocabularySet(@Param('id') id: string, @Body() dto: UpdateVocabularySetDto) {
    return this.VocabularyService.update(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a test set (Admin)' })
  deleteVocabularySet(@Param('id') id: string) {
    return this.VocabularyService.delete(id);
  }
}
