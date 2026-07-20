import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InterviewQuestionDocument = InterviewQuestion & Document;

@Schema({ timestamps: true })
export class InterviewQuestion {
  @Prop({ type: Types.ObjectId, ref: 'InterviewTopic', required: true })
  testSetId: Types.ObjectId; // Keep testSetId for frontend compatibility

  @Prop()
  questionNumber?: number;

  @Prop({ required: true, default: 'open_ended' })
  questionType: string;

  @Prop({ required: true })
  questionText: string;

  @Prop({ required: true })
  correctAnswer: string;
  
  @Prop()
  explanation?: string; // e.g. hint or sample answer

  @Prop({ default: 'active', enum: ['active', 'draft', 'archived', 'review'] })
  status: string;
}

export const InterviewQuestionSchema = SchemaFactory.createForClass(InterviewQuestion);
