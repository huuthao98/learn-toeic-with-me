import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InterviewSetDocument = InterviewSet & Document;

@Schema({ timestamps: true })
export class InterviewSet {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  correctAnswer?: string;

  @Prop({ default: 'draft', enum: ['draft', 'public', 'private'] })
  status: string;

  @Prop({ default: 'external', enum: ['external', 'vip0', 'vip1', 'vip2', 'vip3'] })
  accessLevel: string;

  @Prop({ type: [String], default: [] })
  topics?: string[];
}

export const InterviewSetSchema = SchemaFactory.createForClass(InterviewSet);
