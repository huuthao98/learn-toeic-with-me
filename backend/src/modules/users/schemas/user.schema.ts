import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class VipPackage {
  @Prop({ required: true })
  category: string;

  @Prop({ default: 'vip0', enum: ['vip0', 'vip1', 'vip2', 'vip3'] })
  vipLevel: string;

  @Prop({ default: 0 })
  points: number;

  @Prop()
  vip3Expiry?: Date;
}
export const VipPackageSchema = SchemaFactory.createForClass(VipPackage);

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: false, unique: true, sparse: true })
  email?: string;

  @Prop({ required: false, unique: true, sparse: true })
  phone?: string;

  @Prop({ required: true })
  fullName: string;

  @Prop()
  passwordHash?: string;

  @Prop({ default: 'user' })
  role: string;

  @Prop({ type: [VipPackageSchema], default: [] })
  vipPackages: VipPackage[];

  @Prop({ default: 0 })
  targetScore: number;

  @Prop()
  age?: number;

  @Prop()
  avatarUrl?: string;

  @Prop({ type: [String], default: [] })
  fcmTokens?: string[];

  @Prop({ type: [String], default: [] })
  notificationTopics?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
