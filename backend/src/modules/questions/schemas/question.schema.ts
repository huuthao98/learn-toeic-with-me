import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema({ _id: false })
export class AnswerOption {
  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  text: string;
}

@Schema({ timestamps: true })

export class Question {
  @Prop({ type: Types.ObjectId, ref: 'TestSet' })
  testSetId?: Types.ObjectId;

  @Prop()
  questionNumber?: number;

  @Prop()
  part?: string;

  @Prop({ required: true })
  questionText: string;

  @Prop({ required: true })
  correctAnswer: string;

  @Prop()
  explanation?: string;

  @Prop({ default: 'active', enum: ['active', 'draft', 'archived', 'review'] })
  status: string;

  @Prop()
  category?: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
