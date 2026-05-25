import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { CheckInsService } from './checkins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('CheckIns')
export class CheckInsController {
  constructor(private readonly CheckInsService: CheckInsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() createCheckInDto: any) {
    return this.CheckInsService.create(req.user.sub, createCheckInDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.CheckInsService.findAllByUser(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.CheckInsService.findOne(id);
  }
}
