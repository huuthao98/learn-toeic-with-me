import {
  Get,
  Body,
  Post,
  Version,
  Request,
  HttpCode,
  UseGuards,
  HttpStatus,
  Controller,
  Patch,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto, LoginDto, FirebasePhoneDto } from './dto/auth.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Version('1')
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Version('1')
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive JWT' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Version('1')
  @Post('firebase-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or Register with Firebase Phone Auth token' })
  verifyFirebasePhone(@Body() dto: FirebasePhoneDto) {
    return this.authService.verifyFirebasePhone(dto);
  }

  @Version('1')
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.sub);
  }

  @Version('1')
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  updateProfile(@Request() req: AuthenticatedRequest, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.sub, dto);
  }
}
