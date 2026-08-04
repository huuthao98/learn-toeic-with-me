import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JLPTQuestionDocument = JLPTQuestion & Document;

@Schema({ _id: false })
export class JLPTAnswerOption {
  @Prop({ required: true })
  label: string; // 1, 2, 3, 4

  @Prop({ required: true })
  text: string;
}
export const JLPTAnswerOptionSchema = SchemaFactory.createForClass(JLPTAnswerOption);

@Schema({ timestamps: true })
export class JLPTQuestion {
  @Prop({ type: Types.ObjectId, ref: 'JLPTSet', required: true })
  jlptSetId: Types.ObjectId;

  @Prop()
  questionNumber?: number;

  @Prop({ required: true })
  section: string; // e.g., Vocabulary, Grammar, Reading, Listening

  @Prop()
  part?: string;

  @Prop({ required: true, default: 'multiple_choice' })
  questionType: string;

  @Prop({ type: [JLPTAnswerOptionSchema] })
  options?: JLPTAnswerOption[];

  @Prop({ required: true })
  questionText: string;

  @Prop({ required: true })
  correctAnswer: string;

  @Prop()
  explanation?: string;

  @Prop({ default: 'active', enum: ['active', 'draft', 'archived', 'review'] })
  status: string;

  @Prop()
  passageContext?: string;

  @Prop()
  passageType?: string; // SINGLE, DOUBLE

  @Prop()
  audioUrl?: string;

  @Prop()
  imageUrl?: string;
}

export const JLPTQuestionSchema = SchemaFactory.createForClass(JLPTQuestion);
