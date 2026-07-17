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
import { InterviewService } from './interview.service';
import { JwtAuthGuard, AdminGuard } from '../auth/guards/jwt-auth.guard';

import { SubmitInterviewDto } from './dto/submit-interview.dto';
import { CreateInterviewTopicDto } from './dto/create-interview-topic.dto';
import { UpdateInterviewTopicDto } from './dto/update-interview-topic.dto';

@ApiTags('Interview')
@Controller('interview')
export class InterviewController {
  constructor(private readonly InterviewService: InterviewService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all test sets' })
  findAll(@Query('status') status?: string) {
    return this.InterviewService.findAll(status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get test set metadata by ID' })
  findOne(@Param('id') id: string) {
    return this.InterviewService.findOne(id);
  }

  @Get('results/:resultId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific test result by ID' })
  findResult(@Param('resultId') resultId: string) {
    return this.InterviewService.findResult(resultId);
  }

  @Get(':id/questions')
  @UseGuards(JwtAuthGuard)
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

  @Post('admin/:id/questions/bulk-upsert')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk upsert questions for a test set (Admin)' })
  bulkUpsertQuestions(
    @Param('id') id: string,
    @Body() dto: { questions: any[] },
  ) {
    return this.InterviewService.upsertBulkQuestions(id, dto.questions);
  }

  @Post('admin/questions')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a question (Admin)' })
  createQuestion(@Body() dto: any) {
    return this.InterviewService.createQuestion(dto);
  }

  @Patch('admin/questions/:qId')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a question (Admin)' })
  updateQuestion(@Param('qId') qId: string, @Body() dto: any) {
    return this.InterviewService.updateQuestion(qId, dto);
  }

  @Delete('admin/questions/:qId')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a question (Admin)' })
  deleteQuestion(@Param('qId') qId: string) {
    return this.InterviewService.deleteQuestion(qId);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit answers for a test set' })
  submitExam(@Request() req: any, @Param('id') id: string, @Body() dto: SubmitInterviewDto) {
    return this.InterviewService.submitExam(req.user.sub, id, dto.answers, dto.durationMinutes);
  }

  @Post('admin/create')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new test set (Admin)' })
  createInterviewTopic(@Body() dto: CreateInterviewTopicDto) {
    return this.InterviewService.create(dto);
  }

  @Patch('admin/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a test set (Admin)' })
  updateInterviewTopic(@Param('id') id: string, @Body() dto: UpdateInterviewTopicDto) {
    return this.InterviewService.update(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a test set (Admin)' })
  deleteInterviewTopic(@Param('id') id: string) {
    return this.InterviewService.delete(id);
  }
}
