import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TestResultDocument = TestResult & Document;

@Schema({ timestamps: true })
export class TestResult {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TestSet' })
  test_set_id?: Types.ObjectId;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  listening_score: number;

  @Prop({ required: true })
  reading_score: number;

  @Prop()
  duration_minutes?: number;

  @Prop({ default: 'completed' })
  status: string;
}

export const TestResultSchema = SchemaFactory.createForClass(TestResult);
