import { useAuthStore } from '@/store/authStore';
import { CreateVocabularyQuestionData, vocabularyApi } from '@/api/vocabulary';
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

export type { VocabularySet, VocabularyQuestion, CreateVocabularyQuestionData } from '@/api/vocabulary';

export const useVocabulary = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.token);

  const useTestSets = (category?: string, status?: string) =>
    useQuery({
      queryKey: ['vocabulary-tests', category, status],
      queryFn: () => vocabularyApi.fetchTestSets(category, status),
      enabled: !!token,
    });

  const useTestSet = (id: string) =>
    useQuery({
      queryKey: ['vocabulary-test', id],
      queryFn: () => vocabularyApi.fetchTestSet(id),
      enabled: !!token && !!id,
    });

  const useTestQuestions = (id: string, skip?: number, limit?: number) =>
    useQuery({
      queryKey: ['vocabulary-test-questions', id, skip, limit],
      queryFn: () => vocabularyApi.fetchQuestions(id, skip, limit),
      enabled: !!token && !!id,
    });

  const useTestQuestionsInfinite = (id: string, limit = 20) =>
    useInfiniteQuery({
      queryKey: ['vocabulary-test-questions-infinite', id],
      queryFn: ({ pageParam = 0 }) => vocabularyApi.fetchQuestions(id, pageParam, limit),
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length === limit ? allPages.length * limit : undefined;
      },
      initialPageParam: 0,
      enabled: !!token && !!id,
    });

  const useUpsertBulkQuestionsMutation = () =>
    useMutation({
      mutationFn: vocabularyApi.upsertBulkQuestions,
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['vocabulary-test-questions', variables.testSetId] });
      },
    });

  const useTestResult = (resultId: string) =>
    useQuery({
      queryKey: ['vocabulary-test-result', resultId],
      queryFn: () => vocabularyApi.fetchTestResult(resultId),
      enabled: !!token && !!resultId,
    });

  const useSubmitExamMutation = (id: string) =>
    useMutation({
      mutationFn: (data: {
        answers: { [questionId: string]: string };
        durationMinutes?: number;
      }) => vocabularyApi.submitExam(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-recent-tests'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-score-progression'] });
      },
    });

  const useCreateTestSetMutation = () =>
    useMutation({
      mutationFn: vocabularyApi.createVocabularySet,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['vocabulary-tests'] });
      },
    });

  const useUpdateTestSetMutation = (id: string) =>
    useMutation({
      mutationFn: (data: {
        name?: string;
        description?: string;
        audioUrl?: string;
        status?: string;
        category?: string;
      }) => vocabularyApi.updateTestSet(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['vocabulary-tests'] });
        queryClient.invalidateQueries({ queryKey: ['vocabulary-test', id] });
      },
    });

  const useDeleteTestSetMutation = () =>
    useMutation({
      mutationFn: vocabularyApi.deleteTestSet,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['vocabulary-tests'] });
      },
    });

  const useUpdateQuestionMutation = () =>
    useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<CreateVocabularyQuestionData> }) => 
        vocabularyApi.updateQuestion(id, data),
    });

  const useDeleteQuestionMutation = () =>
    useMutation({
      mutationFn: vocabularyApi.deleteQuestion,
    });

  return {
    useTestSets,
    useTestSet,
    useTestQuestions,
    useTestQuestionsInfinite,
    useUpsertBulkQuestionsMutation,
    useTestResult,
    useSubmitExamMutation,
    useCreateTestSetMutation,
    useUpdateTestSetMutation,
    useDeleteTestSetMutation,
    useUpdateQuestionMutation,
    useDeleteQuestionMutation,
  };
};
