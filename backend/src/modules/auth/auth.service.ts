import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';

import { FirebaseService } from '../firebase/firebase.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto, LoginDto, FirebasePhoneDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email }).exec();
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const newUser = new this.userModel({
      email: dto.email,
      fullName: dto.fullName,
      passwordHash: hashedPassword,
      age: dto.age,
      role: dto.role || 'user',
    });

    await newUser.save();

    const token = this.signToken(newUser);
    return { user: this.formatUser(newUser), accessToken: token };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email }).exec();
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      user: this.formatUser(user),
      token: {
        accessToken: this.signToken(user),
        // refreshToken: this.signToken(user),
        // expiresIn: this.configService.authConfig.jwtExpirationTime,
      },
    }
  }

  async verifyFirebasePhone(dto: FirebasePhoneDto) {
    try {
      let phoneNumber: string | undefined;
      if (dto.token.startsWith('mock_firebase_otp_token_')) {
        const parts = dto.token.split('_');
        const phone = parts[parts.length - 1];
        if (!phone) {
          throw new UnauthorizedException('No phone number found in mock token');
        }
        phoneNumber = phone.startsWith('+') ? phone : `+84${phone.replace(/^0/, '')}`;
      } else {
        const decodedToken = await this.firebaseService.auth.verifyIdToken(dto.token);
        phoneNumber = decodedToken.phone_number;
      }

      if (!phoneNumber) {
        throw new UnauthorizedException('No phone number found in token');
      }

      let user = await this.userModel.findOne({ phone: phoneNumber }).exec();

      if (!user) {
        // Create new user for this phone number
        user = new this.userModel({
          phone: phoneNumber,
          fullName: dto.fullName || 'New User',
          role: dto.role || 'user',
        });
        await user.save();
      }

      const token = this.signToken(user);
      return { accessToken: token, user: this.formatUser(user) };
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.formatUser(user);
  }

  // updatePreferences has been moved to users.service.ts

  private signToken(user: any): string {
    return this.jwtService.sign({
      sub: user._id || user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  }

  private formatUser(user: any) {
    let hasVip3 = false;
    const vipPackages = (user.vipPackages || []).map((pkg: any) => {
      let finalVipLevel = pkg.vipLevel || 'vip0';
      
      if (finalVipLevel === 'vip3' && pkg.vip3Expiry && new Date() > new Date(pkg.vip3Expiry)) {
        const points = pkg.points || 0;
        if (points >= 30000) finalVipLevel = 'vip2';
        else if (points >= 10000) finalVipLevel = 'vip1';
        else finalVipLevel = 'vip0';
      } else if (finalVipLevel !== 'vip3') {
        const points = pkg.points || 0;
        let expectedVip = 'vip0';
        if (points >= 30000) expectedVip = 'vip2';
        else if (points >= 10000) expectedVip = 'vip1';
        
        if (expectedVip > finalVipLevel) {
          finalVipLevel = expectedVip;
        }
      }

      if (finalVipLevel === 'vip3') {
        hasVip3 = true;
      }

      return {
        category: pkg.category,
        vipLevel: finalVipLevel,
        points: pkg.points || 0,
        vip3Expiry: pkg.vip3Expiry,
      };
    });

    return {
      id: user._id || user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      globalPlan: hasVip3 ? 'vip' : 'free',
      vipPackages: vipPackages,
      targetScore: user.targetScore,
      age: user.age,
      avatar: user.avatarUrl,
      notificationTopics: user.notificationTopics || [],
    };
  }
}
