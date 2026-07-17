import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { toeicApi } from '@/api/toeic';

export type { ToeicSet, ToeicQuestion, CreateToeicQuestionData } from '@/api/toeic';

export const useToeic = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.token);

  const useTestSets = (status?: string) =>
    useQuery({
      queryKey: ['toeic-tests', status],
      queryFn: () => toeicApi.fetchTestSets(status),
      enabled: !!token,
    });

  const useTestSet = (id: string) =>
    useQuery({
      queryKey: ['toeic-test', id],
      queryFn: () => toeicApi.fetchTestSet(id),
      enabled: !!token && !!id,
    });

  const useTestQuestions = (id: string) =>
    useQuery({
      queryKey: ['toeic-test-questions', id],
      queryFn: () => toeicApi.fetchQuestions(id),
      enabled: !!token && !!id,
    });

  const useUpsertBulkQuestionsMutation = () =>
    useMutation({
      mutationFn: toeicApi.upsertBulkQuestions,
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['toeic-test-questions', variables.testSetId] });
      },
    });

  const useTestResult = (resultId: string) =>
    useQuery({
      queryKey: ['toeic-test-result', resultId],
      queryFn: () => toeicApi.fetchTestResult(resultId),
      enabled: !!token && !!resultId,
    });

  const useSubmitExamMutation = (id: string) =>
    useMutation({
      mutationFn: (data: {
        answers: { [questionId: string]: string };
        durationMinutes?: number;
      }) => toeicApi.submitExam(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-recent-tests'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-score-progression'] });
      },
    });

  const useCreateTestSetMutation = () =>
    useMutation({
      mutationFn: toeicApi.createToeicSet,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['toeic-tests'] });
      },
    });

  const useUpdateTestSetMutation = (id: string) =>
    useMutation({
      mutationFn: (data: {
        name?: string;
        description?: string;
        audioUrl?: string;
        status?: string;
        readingPdfUrl?: string;
        listeningPdfUrl?: string;
      }) => toeicApi.updateTestSet(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['toeic-tests'] });
        queryClient.invalidateQueries({ queryKey: ['toeic-test', id] });
      },
    });

  const useDeleteTestSetMutation = () =>
    useMutation({
      mutationFn: toeicApi.deleteTestSet,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['toeic-tests'] });
      },
    });

  return {
    useTestSets,
    useTestSet,
    useTestQuestions,
    useUpsertBulkQuestionsMutation,
    useTestResult,
    useSubmitExamMutation,
    useCreateTestSetMutation,
    useUpdateTestSetMutation,
    useDeleteTestSetMutation,
  };
};
