import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserStreakDocument = UserStreak & Document;

@Schema({ timestamps: true })
export class UserStreak {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user_id: Types.ObjectId;

  @Prop({ default: 0 })
  current_streak: number;

  @Prop({ default: 0 })
  longest_streak: number;

  @Prop()
  last_study_date?: Date;
}

export const UserStreakSchema = SchemaFactory.createForClass(UserStreak);
