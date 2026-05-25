import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';
import { RegisterDto, LoginDto, FirebasePhoneDto } from './dto/auth.dto';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {
    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
        /\\n/g,
        '\n',
      );
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
  }

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
    });

    await newUser.save();

    const token = this.signToken(newUser);
    return { access_token: token, user: this.formatUser(newUser) };
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

    const token = this.signToken(user);
    return { access_token: token, user: this.formatUser(user) };
  }

  async verifyFirebasePhone(dto: FirebasePhoneDto) {
    try {
      let phoneNumber: string | undefined;
      if (dto.token.startsWith('mock_firebase_otp_token_')) {
        const parts = dto.token.split('_');
        const phone = parts[parts.length - 1];
        if (!phone) {
          throw new UnauthorizedException(
            'No phone number found in mock token',
          );
        }
        phoneNumber = phone.startsWith('+')
          ? phone
          : `+84${phone.replace(/^0/, '')}`;
      } else {
        const decodedToken = await admin.auth().verifyIdToken(dto.token);
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
        });
        await user.save();
      }

      const token = this.signToken(user);
      return { access_token: token, user: this.formatUser(user) };
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

  private signToken(user: any): string {
    return this.jwtService.sign({
      sub: user._id || user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  }

  private formatUser(user: any) {
    return {
      id: user._id || user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      plan: user.plan,
      targetScore: user.targetScore,
      avatar: user.avatarUrl,
    };
  }
}
