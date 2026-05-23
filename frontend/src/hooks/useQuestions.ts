import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/helpers/api"
import { useAuthStore } from "@/store/authStore"
import { Question } from "./useTests"

interface FetchQuestionsResponse {
  data: Question[]
  total: number
  page: number
  limit: number
}

interface FetchQuestionsParams {
  part?: string
  difficulty?: string
  status?: string
  testSetId?: string
  page?: number
  limit?: number
}

export const useQuestions = () => {
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  const isAdmin = user?.role === "admin"

  // Fetch questions (uses admin endpoint if user has admin privileges)
  const useFetchQuestions = (params: FetchQuestionsParams) =>
    useQuery({
      queryKey: ["questions", params],
      queryFn: async () => {
        const endpoint = isAdmin ? "/admin/questions" : "/questions"
        const response = await api.get<FetchQuestionsResponse>(endpoint, { params })
        return response.data
      },
      enabled: !!token,
    })

  // Create question mutation (Admin only)
  const useCreateQuestionMutation = () =>
    useMutation({
      mutationFn: async (data: {
        testSetId?: string
        part: string
        difficulty: string
        questionText: string
        options: { label: string; text: string }[]
        correctAnswer: string
        explanation?: string
        audioUrl?: string
        imageUrl?: string
        isActive?: boolean
      }) => {
        const response = await api.post<Question>("/admin/questions", data)
        return response.data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["questions"] })
        queryClient.invalidateQueries({ queryKey: ["test-questions"] })
      },
    })

  // Update question mutation (Admin only)
  const useUpdateQuestionMutation = (id: string) =>
    useMutation({
      mutationFn: async (data: {
        difficulty?: string
        status?: string
        questionText?: string
        isActive?: boolean
      }) => {
        const response = await api.patch<Question>(`/admin/questions/${id}`, data)
        return response.data
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["questions"] })
        queryClient.invalidateQueries({ queryKey: ["test", id] })
        queryClient.invalidateQueries({ queryKey: ["test-questions"] })
      },
    })

  // Delete question mutation (Admin only)
  const useDeleteQuestionMutation = () =>
    useMutation({
      mutationFn: async (id: string) => {
        const response = await api.delete(`/admin/questions/${id}`)
        return response.data
      },
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
