import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterFcmTokenDto, SendNotificationDto } from './dto/notifications.dto';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationCampaign, NotificationCampaignDocument } from './schemas/notification-campaign.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationCampaign.name) private campaignModel: Model<NotificationCampaignDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly firebaseService: FirebaseService,
  ) {}

  async registerToken(userId: string, dto: RegisterFcmTokenDto) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('User not found');

    if (!user.fcmTokens) {
      user.fcmTokens = [];
    }

    if (!user.fcmTokens.includes(dto.token)) {
      user.fcmTokens.push(dto.token);
      await user.save();
    }
    
    return { message: 'Token registered successfully' };
  }

  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const objectIdUserId = new Types.ObjectId(userId);
    // Backward compatibility: we still show old global notifications ($exists: false),
    // but they cannot be marked as read or deleted individually without affecting others.
    const query = { $or: [{ userId: objectIdUserId }, { userId: { $exists: false } }] };

    const [data, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(query).exec(),
    ]);

    return { data, total, page, limit };
  }

  async markAsRead(userId: string, notificationId: string) {
    const objectIdUserId = new Types.ObjectId(userId);
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: notificationId, userId: objectIdUserId }, // Only allow marking user-specific ones
      { isRead: true },
      { new: true }
    ).exec();

    if (!notification) {
      // If it's a global notification or not found, just return success without modifying to prevent global read state bugs
      return { message: 'Notification marked as read (or ignored if global)' };
    }
    return notification;
  }

  async markAllAsRead(userId: string) {
    const objectIdUserId = new Types.ObjectId(userId);
    await this.notificationModel.updateMany(
      { userId: objectIdUserId, isRead: false },
      { isRead: true }
    ).exec();
    return { message: 'All notifications marked as read' };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const objectIdUserId = new Types.ObjectId(userId);
    const notification = await this.notificationModel.findOneAndDelete({
      _id: notificationId,
      userId: objectIdUserId, // Only allow deleting user-specific notifications
    }).exec();

    if (!notification) {
      // If it's a global notification or not found, just return success without deleting to prevent global state bugs
      return { message: 'Notification deleted (or ignored if global)' };
    }
    return { message: 'Notification deleted successfully' };
  }

  async deleteAllNotifications(userId: string) {
    const objectIdUserId = new Types.ObjectId(userId);
    await this.notificationModel.deleteMany({ userId: objectIdUserId }).exec();
    return { message: 'All notifications deleted successfully' };
  }

  async sendNotification(dto: SendNotificationDto) {
    // 1. Determine targets
    let users: UserDocument[] = [];
    let targetType = 'ALL';
    let targetValue = null;
    
    if (dto.userId) {
      const user = await this.userModel.findById(dto.userId).exec();
      if (user) users.push(user);
      targetType = 'USER';
      targetValue = dto.userId;
    } else if (dto.plan) {
      users = await this.userModel.find({ plan: dto.plan }).exec();
      targetType = 'PLAN';
      targetValue = dto.plan;
    } else if (dto.topics && dto.topics.length > 0) {
      users = await this.userModel.find({ notificationTopics: { $in: dto.topics } }).exec();
      targetType = 'TOPICS';
      targetValue = dto.topics;
    } else {
      users = await this.userModel.find().exec();
    }

    // Save Campaign
    const campaign = await this.campaignModel.create({
      title: dto.title,
      body: dto.body,
      data: dto.data || {},
      type: dto.type || 'SYSTEM',
      target: {
        type: targetType,
        value: targetValue,
      },
      status: 'SENT',
    });

    // 2. Save notification to DB for each user (Standardized as User-Specific)
    const notificationsToInsert = users.map(u => ({
      campaignId: campaign._id,
      userId: u._id,
      title: dto.title,
      body: dto.body,
      data: dto.data || {},
      type: dto.type || 'SYSTEM',
    }));
    if (notificationsToInsert.length > 0) {
      await this.notificationModel.insertMany(notificationsToInsert);
    }

    // 3. Collect all FCM tokens
    const tokens = users.flatMap(u => u.fcmTokens || []);
    const validTokens = [...new Set(tokens.filter(t => t))];

    if (validTokens.length === 0) {
      await this.campaignModel.findByIdAndUpdate(campaign._id, {
        status: 'SENT',
        successCount: 0,
        failureCount: 0,
      });
      return { message: 'Notification saved to DB. No devices to push.', campaign };
    }

    // 4. Send via FCM
    const stringifiedData: Record<string, string> = {};
    if (dto.data) {
      for (const key in dto.data) {
        stringifiedData[key] = String(dto.data[key]);
      }
    }

    const message = {
      notification: {
        title: dto.title,
        body: dto.body,
      },
      data: stringifiedData,
      tokens: validTokens,
    };

    try {
      const response = await this.firebaseService.messaging.sendEachForMulticast(message);
      
      // Handle invalid tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (errorCode === 'messaging/invalid-registration-token' ||
                errorCode === 'messaging/registration-token-not-registered') {
              failedTokens.push(validTokens[idx]);
            }
          }
        });
        
        // Clean up invalid tokens from users
        if (failedTokens.length > 0) {
          await this.userModel.updateMany(
            { fcmTokens: { $in: failedTokens } },
            { $pullAll: { fcmTokens: failedTokens } }
          ).exec();
        }
      }
      
      await this.campaignModel.findByIdAndUpdate(campaign._id, {
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      return { message: 'Push notification sent', fcmResponse: response, campaign };
    } catch (error) {
      console.error('Error sending push notification:', error);
      await this.campaignModel.findByIdAndUpdate(campaign._id, { status: 'FAILED' });
      return { message: 'Push notification failed, but saved to DB', error: error.message };
    }
  }

  // --- Admin Methods ---

  async getCampaigns(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.campaignModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.campaignModel.countDocuments().exec(),
    ]);
    return { data, total, page, limit };
  }

  async getCampaignById(id: string) {
    const campaign = await this.campaignModel.findById(id).exec();
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async updateCampaign(id: string, updateData: { title?: string; body?: string }) {
    const campaign = await this.campaignModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!campaign) throw new NotFoundException('Campaign not found');

    // Update all child notifications
    const updateObj: any = {};
    if (updateData.title) updateObj.title = updateData.title;
    if (updateData.body) updateObj.body = updateData.body;

    if (Object.keys(updateObj).length > 0) {
      await this.notificationModel.updateMany({ campaignId: campaign._id }, updateObj).exec();
    }

    return campaign;
  }

  async deleteCampaign(id: string) {
    const campaign = await this.campaignModel.findByIdAndDelete(id).exec();
    if (!campaign) throw new NotFoundException('Campaign not found');

    // Delete all child notifications
    await this.notificationModel.deleteMany({ campaignId: campaign._id }).exec();

    return { message: 'Campaign and related notifications deleted successfully' };
  }
}
