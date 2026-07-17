import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ToeicSetDocument = ToeicSet & Document;

@Schema({ timestamps: true })
export class ToeicSet {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  audioUrl?: string;

  @Prop({ default: 'draft', enum: ['draft', 'public', 'private'] })
  status: string;

  @Prop()
  readingPdfUrl?: string;

  @Prop()
  listeningPdfUrl?: string;

  @Prop({ type: [String], default: [] })
  topics?: string[];
}

export const ToeicSetSchema = SchemaFactory.createForClass(ToeicSet);
