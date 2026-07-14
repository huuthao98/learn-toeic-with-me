import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, SendNotificationPayload } from '@/api/notifications';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const useNotificationsList = (page = 1, limit = 20) =>
    useQuery({
      queryKey: ['notifications', page, limit],
      queryFn: () => notificationsApi.getNotifications(page, limit),
    });

  const useMarkAsReadMutation = () =>
    useMutation({
      mutationFn: (id: string) => notificationsApi.markAsRead(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    });

  const useMarkAllAsReadMutation = () =>
    useMutation({
      mutationFn: () => notificationsApi.markAllAsRead(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      },
    });

  const useSendNotificationMutation = () =>
    useMutation({
      mutationFn: (payload: SendNotificationPayload) =>
        notificationsApi.sendNotification(payload),
    });

  return {
    useNotificationsList,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
    useSendNotificationMutation,
  };
};
