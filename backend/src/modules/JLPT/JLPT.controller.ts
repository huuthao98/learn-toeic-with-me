import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { JLPTService } from './JLPT.service';
import { JwtAuthGuard, AdminGuard, OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VipAccessGuard } from '../../common/guards/vip-access.guard';
import { RequireVipAccess } from '../../common/decorators/require-vip-access.decorator';
@Controller('JLPT')
export class JLPTController {
  constructor(private readonly jlptService: JLPTService) {}

  @Get('sets')
  @UseGuards(OptionalJwtAuthGuard)
  async findAllSets(@Query() query: any) {
    return this.jlptService.findAllSets(query);
  }

  @Get('sets/:id')
  @UseGuards(OptionalJwtAuthGuard, VipAccessGuard)
  @RequireVipAccess({ category: 'JLPT', modelName: 'JLPTSet' })
  async findSetById(@Request() req: any, @Param('id') id: string) {
    return req.testSet;
  }

  @UseGuards(AdminGuard)
  @Post('sets')
  async createSet(@Body() createData: any) {
    return this.jlptService.createSet(createData);
  }

  @UseGuards(AdminGuard)
  @Put('sets/:id')
  async updateSet(@Param('id') id: string, @Body() updateData: any) {
    return this.jlptService.updateSet(id, updateData);
  }

  @UseGuards(AdminGuard)
  @Delete('sets/:id')
  async deleteSet(@Param('id') id: string) {
    return this.jlptService.deleteSet(id);
  }

  // Questions endpoints
  @Get('sets/:id/questions')
  @UseGuards(OptionalJwtAuthGuard, VipAccessGuard)
  @RequireVipAccess({ category: 'JLPT', modelName: 'JLPTSet' })
  async getQuestionsBySetId(@Param('id') id: string) {
    return this.jlptService.getQuestionsBySetId(id);
  }

  @UseGuards(AdminGuard)
  @Post('questions')
  async createQuestion(@Body() createData: any) {
    return this.jlptService.createQuestion(createData);
  }

  @UseGuards(AdminGuard)
  @Post('sets/:id/questions/bulk')
  async upsertBulkQuestions(
    @Param('id') id: string,
    @Body() questions: any[],
  ) {
    return this.jlptService.upsertBulkQuestions(id, questions);
  }
}
