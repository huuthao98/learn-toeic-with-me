import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JLPTSetDocument = JLPTSet & Document;

@Schema({ timestamps: true })
export class JLPTSet {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, enum: ['N1', 'N2', 'N3', 'N4', 'N5'] })
  level: string;

  @Prop()
  audioUrl?: string;

  @Prop({ default: 'draft', enum: ['draft', 'public', 'private'] })
  status: string;

  @Prop({ default: 'external', enum: ['external', 'vip0', 'vip1', 'vip2', 'vip3'] })
  accessLevel: string;

  @Prop()
  readingPdfUrl?: string;

  @Prop()
  listeningPdfUrl?: string;

  @Prop({ type: [String], default: [] })
  topics?: string[];

  @Prop({ type: String, default: 'exam', enum: ['exam', 'practice'] })
  type: string;
}

export const JLPTSetSchema = SchemaFactory.createForClass(JLPTSet);
