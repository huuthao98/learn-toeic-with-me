import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { testsApi } from "@/api/tests"

export type { TestSet, Question } from "@/api/tests"

export const useTests = () => {
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)

  // Fetch all test sets
  const useTestSets = () =>
    useQuery({
      queryKey: ["tests"],
      queryFn: testsApi.fetchTestSets,
      enabled: !!token,
    })

  // Fetch details of a single test set
  const useTestSet = (id: string) =>
    useQuery({
      queryKey: ["test", id],
      queryFn: () => testsApi.fetchTestSet(id),
      enabled: !!token && !!id,
    })

  // Fetch questions belonging to a test set
  const useTestQuestions = (id: string) =>
    useQuery({
      queryKey: ["test-questions", id],
      queryFn: () => testsApi.fetchTestQuestions(id),
      enabled: !!token && !!id,
    })

  // Fetch a specific test result by result ID
  const useTestResult = (resultId: string) =>
    useQuery({
      queryKey: ["test-result", resultId],
      queryFn: () => testsApi.fetchTestResult(resultId),
      enabled: !!token && !!resultId,
    })

  // Submit responses for a specific test set
  const useSubmitExamMutation = (id: string) =>
    useMutation({
      mutationFn: (data: { answers: { [questionId: string]: string }; durationMinutes?: number }) =>
        testsApi.submitExam(id, data),
      onSuccess: () => {
        // Invalidate queries to refresh dashboard stats and history
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
        queryClient.invalidateQueries({ queryKey: ["dashboard-recent-tests"] })
        queryClient.invalidateQueries({ queryKey: ["dashboard-score-progression"] })
      },
    })

  // Create a new test set (Admin only)
  const useCreateTestSetMutation = () =>
    useMutation({
      mutationFn: testsApi.createTestSet,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tests"] })
      },
    })

  return {
    useTestSets,
    useTestSet,
    useTestQuestions,
    useTestResult,
    useSubmitExamMutation,
    useCreateTestSetMutation,
  }
}
