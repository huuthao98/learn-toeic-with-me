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
  status?: string
  testSetId?: string
  page?: number
  limit?: number
}

export interface CreateQuestionData {
  testSetId?: string
  questionText: string
  correctAnswer: string
  explanation?: string
  isActive?: boolean
  part?: string
}

export const questionsApi = {
  fetchQuestions: async (isAdmin: boolean, params: FetchQuestionsParams) => {
    const endpoint = isAdmin ? "/admin/questions" : "/questions"
    const response = await api.get<FetchQuestionsResponse>(endpoint, { params })
    return response.data
  },
  createQuestion: async (data: CreateQuestionData) => {
    const response = await api.post<Question>("/admin/questions", data)
    return response.data
  },
  upsertBulk: async (data: { testSetId: string; questions: Partial<CreateQuestionData & { questionNumber: number }>[] }) => {
    const response = await api.post("/admin/questions/bulk-upsert", data)
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
