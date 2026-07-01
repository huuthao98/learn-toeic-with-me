import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TestSetDocument = TestSet & Document;

@Schema({ timestamps: true })
export class TestSet {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  audioUrl?: string;

  @Prop({ default: 'draft', enum: ['draft', 'public', 'private'] })
  status: string;

  @Prop({ default: 0 })
  total_questions: number;

  @Prop({ default: 'toeic', enum: ['toeic', 'interview'] })
  testType: string;

  @Prop()
  pdfUrl?: string;
}

export const TestSetSchema = SchemaFactory.createForClass(TestSet);
