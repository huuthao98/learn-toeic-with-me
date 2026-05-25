import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { Question } from "@/api/tests"
import { questionsApi } from "@/api/questions"

export type { FetchQuestionsResponse, FetchQuestionsParams } from "@/api/questions"

export const useQuestions = () => {
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const isAdmin = user?.role === "admin"

  // Fetch questions (uses admin endpoint if user has admin privileges)
  const useFetchQuestions = (params: any) =>
    useQuery({
      queryKey: ["questions", params],
      queryFn: () => questionsApi.fetchQuestions(isAdmin, params),
      enabled: !!token,
    })

  // Create question mutation (Admin only)
  const useCreateQuestionMutation = () =>
    useMutation({
      mutationFn: questionsApi.createQuestion,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["questions"] })
        queryClient.invalidateQueries({ queryKey: ["test-questions"] })
      },
    })

  // Update question mutation (Admin only)
  const useUpdateQuestionMutation = (id: string) =>
    useMutation({
      mutationFn: (data: any) => questionsApi.updateQuestion(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["questions"] })
        queryClient.invalidateQueries({ queryKey: ["test", id] })
        queryClient.invalidateQueries({ queryKey: ["test-questions"] })
      },
    })

  // Delete question mutation (Admin only)
  const useDeleteQuestionMutation = () =>
    useMutation({
      mutationFn: questionsApi.deleteQuestion,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["questions"] })
        queryClient.invalidateQueries({ queryKey: ["test-questions"] })
      },
    })

  return {
    useFetchQuestions,
    useCreateQuestionMutation,
    useUpdateQuestionMutation,
    useDeleteQuestionMutation,
  }
}
