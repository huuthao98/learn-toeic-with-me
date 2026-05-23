import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/helpers/api"
import { useAuthStore } from "@/store/authStore"

export interface TestSet {
  _id: string
  name: string
  description?: string
  total_questions: number
  parts_count: number
  createdAt: string
}

export interface Question {
  _id: string
  test_set_id?: string
  part: string
  difficulty: "easy" | "medium" | "hard"
  question_text: string
  options: { label: string; text: string }[]
  correct_answer: string
  explanation?: string
  audio_url?: string
  image_url?: string
  status: string
}

export const useTests = () => {
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)

  // Fetch all test sets
  const useTestSets = () =>
    useQuery({
      queryKey: ["tests"],
      queryFn: async () => {
        const response = await api.get<TestSet[]>("/tests")
        return response.data
      },
      enabled: !!token,
    })

  // Fetch details of a single test set
  const useTestSet = (id: string) =>
    useQuery({
      queryKey: ["test", id],
      queryFn: async () => {
        const response = await api.get<TestSet>(`/tests/${id}`)
        return response.data
      },
      enabled: !!token && !!id,
    })

  // Fetch questions belonging to a test set
  const useTestQuestions = (id: string) =>
    useQuery({
      queryKey: ["test-questions", id],
      queryFn: async () => {
        const response = await api.get<Question[]>(`/tests/${id}/questions`)
        return response.data
      },
      enabled: !!token && !!id,
    })

  // Fetch a specific test result by result ID
  const useTestResult = (resultId: string) =>
    useQuery({
      queryKey: ["test-result", resultId],
      queryFn: async () => {
        const response = await api.get<any>(`/tests/results/${resultId}`)
        return response.data
      },
      enabled: !!token && !!resultId,
    })

  // Submit responses for a specific test set
  const useSubmitExamMutation = (id: string) =>
    useMutation({
      mutationFn: async (data: { answers: { [questionId: string]: string }; durationMinutes?: number }) => {
        const response = await api.post(`/tests/${id}/submit`, data)
        return response.data
      },
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
      mutationFn: async (data: { name: string; description?: string; total_questions?: number; parts_count?: number }) => {
        const response = await api.post<TestSet>("/tests/admin/create", data)
        return response.data
      },
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
