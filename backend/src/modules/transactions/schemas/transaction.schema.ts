import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'CheckIn', required: true })
  CheckInId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: ['SPENT', 'EARNED'], required: true })
  type: string;

  @Prop()
  category?: string;

  @Prop({ default: Date.now })
  transactionDate: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
