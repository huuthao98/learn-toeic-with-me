import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserStreakDocument = UserStreak & Document;

@Schema({ timestamps: true })
export class UserStreak {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  longestStreak: number;

  @Prop()
  lastStudyDate?: Date;
}

export const UserStreakSchema = SchemaFactory.createForClass(UserStreak);
