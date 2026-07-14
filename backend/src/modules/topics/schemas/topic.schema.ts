import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Topic extends Document {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
