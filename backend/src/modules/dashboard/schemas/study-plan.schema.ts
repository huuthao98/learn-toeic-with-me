import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudyPlanDocument = StudyPlan & Document;

@Schema({ timestamps: true })
export class StudyPlan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  plan_date: string; // YYYY-MM-DD

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ default: false })
  is_completed: boolean;
}

export const StudyPlanSchema = SchemaFactory.createForClass(StudyPlan);
