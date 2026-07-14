import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { topicsApi, TopicPayload } from '@/api/topics';

export const useTopics = () => {
  const queryClient = useQueryClient();

  const useTopicsList = (activeOnly = false) =>
    useQuery({
      queryKey: ['topics', activeOnly],
      queryFn: () => topicsApi.getTopics(activeOnly),
    });

  const useCreateTopicMutation = () =>
    useMutation({
      mutationFn: (data: TopicPayload) => topicsApi.createTopic(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['topics'] });
      },
    });

  const useUpdateTopicMutation = () =>
    useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<TopicPayload> }) =>
        topicsApi.updateTopic(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['topics'] });
      },
    });

  const useDeleteTopicMutation = () =>
    useMutation({
      mutationFn: (id: string) => topicsApi.deleteTopic(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['topics'] });
      },
    });

  return {
    useTopicsList,
    useCreateTopicMutation,
    useUpdateTopicMutation,
    useDeleteTopicMutation,
  };
};
