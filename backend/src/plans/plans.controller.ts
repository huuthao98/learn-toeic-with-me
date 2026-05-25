import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Giả định tồn tại từ auth module hiện có

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() createPlanDto: any) {
    return this.plansService.create(req.user.sub, createPlanDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.plansService.findAllByUser(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlanDto: any) {
    return this.plansService.update(id, updatePlanDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}
