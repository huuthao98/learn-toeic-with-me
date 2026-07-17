import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ToeicQuestionDocument = ToeicQuestion & Document;

@Schema({ _id: false })
export class ToeicAnswerOption {
  @Prop({ required: true })
  label: string; // A, B, C, D

  @Prop({ required: true })
  text: string;
}
export const ToeicAnswerOptionSchema = SchemaFactory.createForClass(ToeicAnswerOption);

@Schema({ timestamps: true })
export class ToeicQuestion {
  @Prop({ type: Types.ObjectId, ref: 'ToeicSet', required: true })
  testSetId: Types.ObjectId; // Keep testSetId for frontend compatibility if preferred, or rename to toeicSetId

  @Prop()
  questionNumber?: number;

  @Prop({ required: true })
  part: string;

  @Prop({ required: true, enum: ['multiple_choice', 'fill_in_the_blank'], default: 'multiple_choice' })
  questionType: string;

  @Prop({ type: [ToeicAnswerOptionSchema] })
  options?: ToeicAnswerOption[];

  @Prop({ required: true })
  questionText: string;

  @Prop({ required: true })
  correctAnswer: string;

  @Prop()
  explanation?: string;

  @Prop({ default: 'active', enum: ['active', 'draft', 'archived', 'review'] })
  status: string;

  @Prop()
  passageText?: string;

  @Prop()
  groupId?: string;

  @Prop()
  audioUrl?: string;

  @Prop()
  imageUrl?: string;
}

export const ToeicQuestionSchema = SchemaFactory.createForClass(ToeicQuestion);
