import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, SendNotificationPayload } from '@/api/notifications';
import { toast } from 'sonner';

export const useAdminNotifications = () => {
  const queryClient = useQueryClient();

  const useCampaignsList = (page = 1, limit = 20) =>
    useQuery({
      queryKey: ['admin-campaigns', page, limit],
      queryFn: () => notificationsApi.getCampaigns(page, limit),
    });

  const useCampaignById = (id: string) =>
    useQuery({
      queryKey: ['admin-campaigns', id],
      queryFn: () => notificationsApi.getCampaignById(id),
      enabled: !!id,
    });

  const useCreateCampaignMutation = () =>
    useMutation({
      mutationFn: (payload: SendNotificationPayload) => notificationsApi.sendNotification(payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
        toast.success('Gửi thông báo thành công');
      },
      onError: () => {
        toast.error('Lỗi khi gửi thông báo');
      },
    });

  const useUpdateCampaignMutation = () =>
    useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: { title?: string; body?: string } }) =>
        notificationsApi.updateCampaign(id, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
        toast.success('Cập nhật thông báo thành công');
      },
      onError: () => {
        toast.error('Lỗi khi cập nhật thông báo');
      },
    });

  const useDeleteCampaignMutation = () =>
    useMutation({
      mutationFn: (id: string) => notificationsApi.deleteCampaign(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
        toast.success('Xóa thông báo thành công');
      },
      onError: () => {
        toast.error('Lỗi khi xóa thông báo');
      },
    });

  return {
    useCampaignsList,
    useCampaignById,
    useCreateCampaignMutation,
    useUpdateCampaignMutation,
    useDeleteCampaignMutation,
  };
};
