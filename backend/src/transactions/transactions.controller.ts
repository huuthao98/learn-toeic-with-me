import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Request() req: AuthenticatedRequest,
    @Body() createTransactionDto: any,
  ) {
    return this.transactionsService.create(req.user.sub, createTransactionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.transactionsService.findAllByUser(req.user.sub);
  }
}
