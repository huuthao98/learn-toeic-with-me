import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { interviewApi, type InterviewTopic, type InterviewQuestion, type CreateInterviewQuestionData } from '@/api/interview';

export type { InterviewTopic, InterviewQuestion, CreateInterviewQuestionData };

export const useInterview = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.token);

  const useTestSets = (status?: string) =>
    useQuery({
      queryKey: ['interview-tests', status],
      queryFn: () => interviewApi.fetchTestSets(status),
      enabled: !!token,
    });

  const useTestSet = (id: string) =>
    useQuery({
      queryKey: ['interview-test', id],
      queryFn: () => interviewApi.fetchTestSet(id),
      enabled: !!token && !!id,
    });

  const useTestQuestions = (id: string) =>
    useQuery({
      queryKey: ['interview-test-questions', id],
      queryFn: () => interviewApi.fetchQuestions(id),
      enabled: !!token && !!id,
    });

  const useUpsertBulkQuestionsMutation = () =>
    useMutation({
      mutationFn: interviewApi.upsertBulkQuestions,
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['interview-test-questions', variables.testSetId] });
      },
    });

  const useTestResult = (resultId: string) =>
    useQuery({
      queryKey: ['interview-test-result', resultId],
      queryFn: () => interviewApi.fetchTestResult(resultId),
      enabled: !!token && !!resultId,
    });

  const useCreateQuestionMutation = () =>
    useMutation({
      mutationFn: interviewApi.createQuestion,
      onSuccess: (_, variables) => {
        if (variables.testSetId) {
          queryClient.invalidateQueries({ queryKey: ['interview-test-questions', variables.testSetId] });
        }
      },
    });

  const useUpdateQuestionMutation = () =>
    useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<CreateInterviewQuestionData> }) =>
        interviewApi.updateQuestion(id, data),
      onSuccess: (_, variables) => {
        if (variables.data.testSetId) {
          queryClient.invalidateQueries({ queryKey: ['interview-test-questions', variables.data.testSetId] });
        }
      },
    });

  const useDeleteQuestionMutation = () =>
    useMutation({
      mutationFn: interviewApi.deleteQuestion,
      // Would need testSetId to invalidate properly, but usually handled by parent refetch
    });

  const useSubmitExamMutation = (id: string) =>
    useMutation({
      mutationFn: (data: {
        answers: { [questionId: string]: string };
        durationMinutes?: number;
      }) => interviewApi.submitExam(id, data),
      onSuccess: () => {
        // May not affect stats since no score is calculated, but good practice to invalidate
        queryClient.invalidateQueries({ queryKey: ['dashboard-recent-tests'] });
      },
    });

  const useCreateTestSetMutation = () =>
    useMutation({
      mutationFn: interviewApi.createInterviewTopic,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['interview-tests'] });
      },
    });

  const useUpdateTestSetMutation = (id: string) =>
    useMutation({
      mutationFn: (data: {
        name?: string;
        description?: string;
        audioUrl?: string;
        status?: string;
      }) => interviewApi.updateTestSet(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['interview-tests'] });
        queryClient.invalidateQueries({ queryKey: ['interview-test', id] });
      },
    });

  const useDeleteTestSetMutation = () =>
    useMutation({
      mutationFn: interviewApi.deleteTestSet,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['interview-tests'] });
      },
    });

  return {
    useTestSets,
    useTestSet,
    useTestQuestions,
    useUpsertBulkQuestionsMutation,
    useCreateQuestionMutation,
    useUpdateQuestionMutation,
    useDeleteQuestionMutation,
    useTestResult,
    useSubmitExamMutation,
    useCreateTestSetMutation,
    useUpdateTestSetMutation,
    useDeleteTestSetMutation,
  };
};
