import { api } from '@/helpers/api';

export interface TopicPayload {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export const topicsApi = {
  getTopics: async (activeOnly = false) => {
    const response = await api.get(`/topics?activeOnly=${activeOnly}`);
    return response.data;
  },
  
  createTopic: async (data: TopicPayload) => {
    const response = await api.post('/topics', data);
    return response.data;
  },
  
  updateTopic: async (id: string, data: Partial<TopicPayload>) => {
    const response = await api.patch(`/topics/${id}`, data);
    return response.data;
  },
  
  deleteTopic: async (id: string) => {
    const response = await api.delete(`/topics/${id}`);
    return response.data;
  },
};
