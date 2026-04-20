import {
  Injectable, UnauthorizedException, ConflictException, Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check existing user
    const { data: existing } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', dto.email)
      .single();

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Insert user
    const { data: user, error } = await this.supabase
      .from('users')
      .insert({
        email: dto.email,
        full_name: dto.fullName,
        password_hash: hashedPassword,
        role: 'user',
        plan: 'free',
        target_score: 800,
      })
      .select('id, email, full_name, role, plan, target_score, avatar_url, created_at')
      .single();

    if (error) {
      throw new ConflictException(error.message);
    }

    const token = this.signToken(user);
    return { access_token: token, user: this.formatUser(user) };
  }

  async login(dto: LoginDto) {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('id, email, full_name, role, plan, target_score, avatar_url, password_hash, created_at')
      .eq('email', dto.email)
      .single();

    if (!user || error) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.signToken(user);
    return { access_token: token, user: this.formatUser(user) };
  }

  async getProfile(userId: string) {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('id, email, full_name, role, plan, target_score, avatar_url, created_at')
      .eq('id', userId)
      .single();

    if (!user || error) {
      throw new UnauthorizedException('User not found');
    }

    return this.formatUser(user);
  }

  private signToken(user: any): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private formatUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      plan: user.plan,
      targetScore: user.target_score,
      avatar: user.avatar_url,
    };
  }
}
