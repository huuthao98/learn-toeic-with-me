import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type B1QuestionDocument = B1Question & Document;

@Schema({ _id: false })
export class B1AnswerOption {
  @Prop({ required: true })
  label: string; // A, B, C, D

  @Prop({ required: true })
  text: string;
}
export const B1AnswerOptionSchema = SchemaFactory.createForClass(B1AnswerOption);

@Schema({ timestamps: true })
export class B1Question {
  @Prop({ type: Types.ObjectId, ref: 'B1Set', required: true })
  testSetId: Types.ObjectId;

  @Prop({ required: true, enum: ['listening', 'reading', 'writing', 'speaking'] })
  skill: string;

  @Prop()
  part?: string;

  @Prop()
  questionNumber?: number;

  @Prop({ required: true, default: 'multiple_choice', enum: ['multiple_choice', 'essay', 'speaking'] })
  questionType: string;

  @Prop({ type: [B1AnswerOptionSchema] })
  options?: B1AnswerOption[];

  @Prop()
  questionText?: string;

  @Prop()
  correctAnswer?: string;

  @Prop()
  explanation?: string;

  @Prop({ default: 'active', enum: ['active', 'draft', 'archived', 'review'] })
  status: string;

  @Prop()
  passageContext?: string;

  @Prop()
  passageType?: string; 

  @Prop()
  setId?: number; // Used to group questions that share the same passageContext (e.g., 3.1, 3.2)

  @Prop()
  note?: string;

  @Prop()
  audioUrl?: string;

  @Prop()
  imageUrl?: string;
}

export const B1QuestionSchema = SchemaFactory.createForClass(B1Question);
