import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InterviewTopicDocument = InterviewTopic & Document;

@Schema({ timestamps: true })
export class InterviewTopic {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  correctAnswer?: string;

  @Prop({ default: 'draft', enum: ['draft', 'public', 'private'] })
  status: string;

  @Prop({ type: [String], default: [] })
  topics?: string[];
}

export const InterviewTopicSchema = SchemaFactory.createForClass(InterviewTopic);
