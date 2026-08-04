import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VocabularyQuestionDocument = VocabularyQuestion & Document;

@Schema({ _id: false })
export class VocabularyAnswerOption {
  @Prop({ required: true })
  label: string; // A, B, C, D

  @Prop({ required: true })
  text: string;

  @Prop()
  pinyin?: string;
}
export const VocabularyAnswerOptionSchema = SchemaFactory.createForClass(VocabularyAnswerOption);

@Schema({ timestamps: true })
export class VocabularyQuestion {
  @Prop({ type: Types.ObjectId, ref: 'VocabularySet', required: true })
  testSetId: Types.ObjectId; // Keep testSetId for frontend compatibility

  @Prop()
  questionNumber?: number;

  @Prop()
  setId?: string;

  @Prop()
  passageContext?: string;

  @Prop()
  pinyin?: string;

  @Prop({ required: true, enum: ['multiple_choice', 'fill_in_the_blank'], default: 'multiple_choice' })
  questionType: string;

  @Prop({ type: [VocabularyAnswerOptionSchema] })
  options?: VocabularyAnswerOption[];

  @Prop({ required: true })
  questionText: string;

  @Prop({ required: true })
  correctAnswer: string;

  @Prop()
  explanation?: string;

  @Prop({ default: 'active', enum: ['active', 'draft', 'archived', 'review'] })
  status: string;
}

export const VocabularyQuestionSchema = SchemaFactory.createForClass(VocabularyQuestion);
