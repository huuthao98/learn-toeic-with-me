import {
  Get,
  Post,
  Body,
  Patch,
  Query,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Controller,
  Version,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { JwtAuthGuard, AdminGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all questions with filters' })
  findAll(
    @Query('part') part?: string,
    @Query('testSetId') testSetId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.questionsService.findAll({testSetId, page, limit });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }
}

// Admin-only controller
@ApiTags('Admin – Questions')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/questions')
export class AdminQuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('testSetId') testSetId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.questionsService.findAll({
      status,
      testSetId,
      page,
      limit,
    });
  }

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateQuestionDto) {
    return this.questionsService.create(dto);
  }

  @Post('bulk-upsert')
  @HttpCode(HttpStatus.OK)
  upsertBulk(@Body() body: { testSetId: string; questions: Partial<CreateQuestionDto>[] }) {
    return this.questionsService.upsertBulk(body.testSetId, body.questions);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }
}
