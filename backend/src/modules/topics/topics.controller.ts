import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TopicsService } from './topics.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/topics.dto';
import { JwtAuthGuard, AdminGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('topics')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all topics' })
  findAll(@Query('activeOnly') activeOnly?: string) {
    const isActiveOnly = activeOnly === 'true';
    return this.topicsService.findAll(isActiveOnly);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a topic by id' })
  findOne(@Param('id') id: string) {
    return this.topicsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a new topic (Admin)' })
  create(@Body() createTopicDto: CreateTopicDto) {
    return this.topicsService.create(createTopicDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update a topic (Admin)' })
  update(@Param('id') id: string, @Body() updateTopicDto: UpdateTopicDto) {
    return this.topicsService.update(id, updateTopicDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete a topic (Admin)' })
  remove(@Param('id') id: string) {
    return this.topicsService.remove(id);
  }
}
