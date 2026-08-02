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
import { InterviewService } from './interview.service';
import { JwtAuthGuard, AdminGuard, OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VipAccessGuard } from '@/common/guards/vip-access.guard';
import { RequireVipAccess } from '@/common/decorators/require-vip-access.decorator';

import { SubmitInterviewDto } from './dto/submit-interview.dto';
import { CreateInterviewSetDto } from './dto/create-interview-set.dto';
import { UpdateInterviewSetDto } from './dto/update-interview-set.dto';

@ApiTags('Interview')
@Controller('interview')
export class InterviewController {
  constructor(private readonly InterviewService: InterviewService) {}

  // ─── Public / User Routes ───────────────────────────────────────────────────

  @Get('sets')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all test sets' })
  findAll(@Query('status') status?: string) {
    return this.InterviewService.findAll(status);
  }

  @Get('sets/:id')
  @UseGuards(OptionalJwtAuthGuard, VipAccessGuard)
  @RequireVipAccess({ category: 'INTERVIEW', modelName: 'InterviewSet' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get test set metadata by ID' })
  findOne(@Param('id') id: string) {
    return this.InterviewService.findOne(id);
  }

  @Get('sets/:id/questions')
  @UseGuards(OptionalJwtAuthGuard, VipAccessGuard)
  @RequireVipAccess({ category: 'INTERVIEW', modelName: 'InterviewSet' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get questions belonging to a test set' })
  findQuestions(
    @Param('id') id: string,
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const limitNum = limit ? parseInt(limit, 10) : 0;
    return this.InterviewService.getQuestions(id, skipNum, limitNum);
  }

  @Get('results/:resultId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific test result by ID' })
  findResult(@Param('resultId') resultId: string) {
    return this.InterviewService.findResult(resultId);
  }

  @Post('sets/:id/submit')
  @UseGuards(JwtAuthGuard, VipAccessGuard)
  @RequireVipAccess({ category: 'INTERVIEW', modelName: 'InterviewSet' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit answers for a test set' })
  submitExam(@Request() req: any, @Param('id') id: string, @Body() dto: SubmitInterviewDto) {
    return this.InterviewService.submitExam(req.user.sub, id, dto.answers, dto.durationMinutes);
  }

  // ─── Admin Routes ───────────────────────────────────────────────────────────

  @Post('sets')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new test set (Admin)' })
  createInterviewSet(@Body() dto: CreateInterviewSetDto) {
    return this.InterviewService.create(dto);
  }

  @Patch('sets/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a test set (Admin)' })
  updateInterviewSet(@Param('id') id: string, @Body() dto: UpdateInterviewSetDto) {
    return this.InterviewService.update(id, dto);
  }

  @Delete('sets/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a test set (Admin)' })
  deleteInterviewSet(@Param('id') id: string) {
    return this.InterviewService.delete(id);
  }

  @Post('sets/:id/questions/bulk-upsert')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk upsert questions for a test set (Admin)' })
  bulkUpsertQuestions(
    @Param('id') id: string,
    @Body() dto: { questions: any[] },
  ) {
    return this.InterviewService.upsertBulkQuestions(id, dto.questions);
  }

  @Post('questions')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a question (Admin)' })
  createQuestion(@Body() dto: any) {
    return this.InterviewService.createQuestion(dto);
  }

  @Patch('questions/:qId')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a question (Admin)' })
  updateQuestion(@Param('qId') qId: string, @Body() dto: any) {
    return this.InterviewService.updateQuestion(qId, dto);
  }

  @Delete('questions/:qId')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a question (Admin)' })
  deleteQuestion(@Param('qId') qId: string) {
    return this.InterviewService.deleteQuestion(qId);
  }
}
