import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type B1SetDocument = B1Set & Document;

@Schema({ timestamps: true })
export class B1Set {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  audioUrl?: string; // Listening audio

  @Prop({ default: 'draft', enum: ['draft', 'public', 'private'] })
  status: string;

  @Prop({ default: 'external', enum: ['external', 'vip0', 'vip1', 'vip2', 'vip3'] })
  accessLevel: string;

  @Prop({ type: [String], default: [] })
  topics?: string[];
}

export const B1SetSchema = SchemaFactory.createForClass(B1Set);
