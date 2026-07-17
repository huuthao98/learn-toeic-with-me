import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VocabularySetDocument = VocabularySet & Document;

@Schema({ timestamps: true })
export class VocabularySet {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: 'draft', enum: ['draft', 'public', 'private'] })
  status: string;

  @Prop({ enum: ['english', 'chinese', 'korean', 'japanese'] })
  category?: string;

  @Prop({ type: [String], default: [] })
  topics?: string[];
}

export const VocabularySetSchema = SchemaFactory.createForClass(VocabularySet);
