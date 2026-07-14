import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationCampaignDocument = NotificationCampaign & Document;

@Schema({ timestamps: true })
export class NotificationCampaign {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: Object, default: {} })
  data: Record<string, any>;

  @Prop({ default: 'SYSTEM' })
  type: string;

  @Prop({ type: Object })
  target: {
    type: string; // 'ALL', 'USER', 'PLAN', 'TOPICS'
    value?: any;
  };

  @Prop({ default: 0 })
  successCount: number;

  @Prop({ default: 0 })
  failureCount: number;

  @Prop({ default: 'SENT' })
  status: string; // 'DRAFT', 'SENT', 'FAILED'
}

export const NotificationCampaignSchema = SchemaFactory.createForClass(NotificationCampaign);
