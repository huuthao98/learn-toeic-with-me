import { api } from '@/helpers/api';

export interface SendNotificationPayload {
  title: string;
  body: string;
  userId?: string;
  plan?: string;
  topics?: string[];
  type?: string;
  data?: any;
}

export const notificationsApi = {
  getNotifications: async (page = 1, limit = 20) => {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
  sendNotification: async (payload: SendNotificationPayload) => {
    const response = await api.post('/notifications/send', payload);
    return response.data;
  },
  getCampaigns: async (page = 1, limit = 20) => {
    const response = await api.get(`/notifications/admin/campaigns?page=${page}&limit=${limit}`);
    return response.data;
  },
  getCampaignById: async (id: string) => {
    const response = await api.get(`/notifications/admin/campaigns/${id}`);
    return response.data;
  },
  updateCampaign: async (id: string, payload: { title?: string; body?: string }) => {
    const response = await api.put(`/notifications/admin/campaigns/${id}`, payload);
    return response.data;
  },
  deleteCampaign: async (id: string) => {
    const response = await api.delete(`/notifications/admin/campaigns/${id}`);
    return response.data;
  },
};
