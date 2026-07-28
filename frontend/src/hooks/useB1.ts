import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { b1Api } from '@/api/b1';
import { useAuthStore } from '@/store/authStore';

export const b1Keys = {
  all: ['b1'] as const,
  sets: (status?: string, type?: string) => [...b1Keys.all, 'sets', status, type] as const,
  set: (id: string) => [...b1Keys.all, 'set', id] as const,
  questions: (setId: string) => [...b1Keys.all, 'questions', setId] as const,
  result: (resultId: string) => [...b1Keys.all, 'result', resultId] as const,
};

export const useB1 = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const useTestSets = (status?: string) => {
    return useQuery({
      queryKey: b1Keys.sets(status),
      queryFn: () => b1Api.fetchTestSets(status),
    });
  };

  const useTestSet = (id: string) => {
    return useQuery({
      queryKey: b1Keys.set(id),
      queryFn: () => b1Api.fetchTestSetById(id),
      enabled: !!id,
    });
  };

  const useTestQuestions = (setId: string, skip = 0, limit = 0) => {
    return useQuery({
      queryKey: [...b1Keys.questions(setId), skip, limit],
      queryFn: () => b1Api.fetchQuestions(setId, skip, limit),
      enabled: !!setId,
    });
  };

  const useCreateTestSetMutation = () => {
    return useMutation({
      mutationFn: b1Api.createTestSet,
      onSuccess: () => {
        toast.success('Tạo đề thi B1 thành công!');
        queryClient.invalidateQueries({ queryKey: b1Keys.all });
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Lỗi khi tạo đề thi B1');
      },
    });
  };

  const useUpdateTestSetMutation = (id: string) => {
    return useMutation({
      mutationFn: (data: any) => b1Api.updateTestSet(id, data),
      onSuccess: () => {
        toast.success('Cập nhật đề thi B1 thành công!');
        queryClient.invalidateQueries({ queryKey: b1Keys.all });
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Lỗi khi cập nhật đề thi B1');
      },
    });
  };

  const useDeleteTestSetMutation = () => {
    return useMutation({
      mutationFn: b1Api.deleteTestSet,
      onSuccess: () => {
        toast.success('Đã xoá đề thi B1!');
        queryClient.invalidateQueries({ queryKey: b1Keys.all });
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Lỗi khi xoá đề thi B1');
      },
    });
  };

  const useUpsertBulkQuestionsMutation = () => {
    return useMutation({
      mutationFn: ({ setId, questions }: { setId: string; questions: any[] }) =>
        b1Api.upsertBulkQuestions(setId, questions),
      onSuccess: () => {
        toast.success('Cập nhật câu hỏi thành công!');
        queryClient.invalidateQueries({ queryKey: b1Keys.all });
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Lỗi khi cập nhật câu hỏi');
      },
    });
  };

  const useUpdateQuestionMutation = (setId: string) => {
    return useMutation({
      mutationFn: ({ questionId, data }: { questionId: string; data: any }) =>
        b1Api.updateQuestion(questionId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: b1Keys.questions(setId) });
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Lỗi khi cập nhật câu hỏi');
      },
    });
  };

  const useSubmitExamMutation = () => {
    return useMutation({
      mutationFn: ({ setId, answers, timePerQuestion, isTest = true }: { setId: string; answers: any, timePerQuestion?: number[], isTest?: boolean }) =>
        b1Api.submitExam(setId, answers, timePerQuestion || [], isTest),
      onSuccess: () => {
        toast.success('Đã nộp bài thành công!');
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Lỗi khi nộp bài');
      },
    });
  };

  const useTestResult = (resultId: string) => {
    return useQuery({
      queryKey: b1Keys.result(resultId),
      queryFn: () => {
        if (!user && !resultId) {
           return Promise.resolve(null as any);
        }
        return b1Api.fetchTestResult(resultId);
      },
      enabled: !!resultId,
    });
  };

  return {
    useTestSets,
    useTestSet,
    useTestQuestions,
    useCreateTestSetMutation,
    useUpdateTestSetMutation,
    useDeleteTestSetMutation,
    useUpsertBulkQuestionsMutation,
    useUpdateQuestionMutation,
    useSubmitExamMutation,
    useTestResult,
  };
};
