import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TestSetDocument = TestSet & Document;

@Schema({ timestamps: true })
export class TestSet {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: 0 })
  total_questions: number;

  @Prop({ default: 0 })
  parts_count: number;
}

export const TestSetSchema = SchemaFactory.createForClass(TestSet);
