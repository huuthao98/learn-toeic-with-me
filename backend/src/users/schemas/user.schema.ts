import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

  @Prop({ default: 'free' })
  plan: string;

  @Prop({ default: 800 })
  targetScore: number;

  @Prop()
  avatarUrl?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
