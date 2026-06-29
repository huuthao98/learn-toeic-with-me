import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CheckInDocument = CheckIn & Document;

@Schema({ timestamps: true })
export class CheckIn {
  @Prop({ type: Types.ObjectId, ref: 'Plan', required: false })
  planId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  caption?: string;

  @Prop({ enum: ['PUBLIC', 'PRIVATE', 'SELECTED_FRIENDS'], default: 'PRIVATE' })
  visibility: string;

  @Prop({ enum: ['ON_TIME', 'LATE_MAKEUP', 'SKIPPED'], default: 'ON_TIME' })
  status: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  allowedViewers?: Types.ObjectId[];
}

export const CheckInSchema = SchemaFactory.createForClass(CheckIn);
