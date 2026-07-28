import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TestResultDocument = TestResult & Document;

@Schema({ timestamps: true })
export class TestResult {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['ToeicSet', 'VocabularySet', 'InterviewTopic', 'B1Set'], default: 'ToeicSet' })
  testType: string;

  @Prop({ type: Types.ObjectId, refPath: 'testType' })
  testSetId?: Types.ObjectId;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  listeningScore: number;

  @Prop({ required: true })
  readingScore: number;

  @Prop()
  writingScore?: number;

  @Prop()
  speakingScore?: number;

  @Prop()
  durationMinutes?: number;

  @Prop({ default: 'completed' })
  status: string;

  @Prop({ type: Object })
  answers?: Record<string, string>;

  createdAt: Date;
  updatedAt: Date;
}

export const TestResultSchema = SchemaFactory.createForClass(TestResult);
