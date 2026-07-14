import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudyPlanDocument = StudyPlan & Document;

@Schema({ timestamps: true })
export class StudyPlan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  planDate: string; // YYYY-MM-DD

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ default: false })
  isCompleted: boolean;
}

export const StudyPlanSchema = SchemaFactory.createForClass(StudyPlan);
