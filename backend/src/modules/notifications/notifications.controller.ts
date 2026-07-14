import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { RegisterFcmTokenDto, SendNotificationDto } from './dto/notifications.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('token')
  @ApiOperation({ summary: 'Register FCM device token for push notifications' })
  registerToken(@Req() req: any, @Body() dto: RegisterFcmTokenDto) {
    const userId = req.user.sub;
    return this.notificationsService.registerToken(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  getNotifications(@Req() req: any, @Query('page') page: string, @Query('limit') limit: string) {
    const userId = req.user.sub;
    return this.notificationsService.getNotifications(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  markAllAsRead(@Req() req: any) {
    const userId = req.user.sub;
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  markAsRead(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.notificationsService.markAsRead(userId, id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all notifications for current user' })
  deleteAllNotifications(@Req() req: any) {
    const userId = req.user.sub;
    return this.notificationsService.deleteAllNotifications(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific notification for current user' })
  deleteNotification(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.sub;
    return this.notificationsService.deleteNotification(userId, id);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a push notification (Admin only - should be protected)' })
  // NOTE: You should add an AdminGuard here if only admins can trigger notifications
  sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationsService.sendNotification(dto);
  }

  // --- Admin Endpoints ---

  @Get('admin/campaigns')
  @ApiOperation({ summary: 'Get list of notification campaigns (Admin only)' })
  getCampaigns(@Query('page') page: string, @Query('limit') limit: string) {
    return this.notificationsService.getCampaigns(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Get('admin/campaigns/:id')
  @ApiOperation({ summary: 'Get a specific notification campaign (Admin only)' })
  getCampaignById(@Param('id') id: string) {
    return this.notificationsService.getCampaignById(id);
  }

  @Put('admin/campaigns/:id')
  @ApiOperation({ summary: 'Update a specific notification campaign (Admin only)' })
  updateCampaign(@Param('id') id: string, @Body() dto: { title?: string; body?: string }) {
    return this.notificationsService.updateCampaign(id, dto);
  }

  @Delete('admin/campaigns/:id')
  @ApiOperation({ summary: 'Delete a notification campaign (Admin only)' })
  deleteCampaign(@Param('id') id: string) {
    return this.notificationsService.deleteCampaign(id);
  }
}
