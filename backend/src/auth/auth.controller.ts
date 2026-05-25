import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, FirebasePhoneDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and receive JWT' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('firebase-phone')
  @ApiOperation({ summary: 'Login or Register with Firebase Phone Auth token' })
  verifyFirebasePhone(@Body() dto: FirebasePhoneDto) {
    return this.authService.verifyFirebasePhone(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.sub);
  }
}
