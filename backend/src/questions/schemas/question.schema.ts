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
  test_set_id?: Types.ObjectId;

  @Prop({ required: true })
  part: string;

  @Prop({ required: true, enum: ['easy', 'medium', 'hard'] })
  difficulty: string;

  @Prop({ required: true })
  question_text: string;

  @Prop({ type: [AnswerOption], default: [] })
  options: AnswerOption[];

  @Prop({ required: true })
  correct_answer: string;

  @Prop()
  explanation?: string;

  @Prop()
  audio_url?: string;

  @Prop()
  image_url?: string;

  @Prop({ default: 'active', enum: ['active', 'draft', 'archived', 'review'] })
  status: string;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
