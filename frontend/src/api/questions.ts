import { api } from "@/helpers/api"
import { Question } from "./tests"

export interface FetchQuestionsResponse {
  data: Question[]
  total: number
  page: number
  limit: number
}

export interface FetchQuestionsParams {
  part?: string
  difficulty?: string
  status?: string
  testSetId?: string
  page?: number
  limit?: number
}

export const questionsApi = {
  fetchQuestions: async (isAdmin: boolean, params: FetchQuestionsParams) => {
    const endpoint = isAdmin ? "/admin/questions" : "/questions"
    const response = await api.get<FetchQuestionsResponse>(endpoint, { params })
    return response.data
  },
  createQuestion: async (data: {
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
  updateQuestion: async (
    id: string,
    data: {
      difficulty?: string
      status?: string
      questionText?: string
      isActive?: boolean
    }
  ) => {
    const response = await api.patch<Question>(`/admin/questions/${id}`, data)
    return response.data
  },
  deleteQuestion: async (id: string) => {
    const response = await api.delete(`/admin/questions/${id}`)
    return response.data
  },
}
