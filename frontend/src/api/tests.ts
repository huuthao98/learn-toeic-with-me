import { api } from "@/helpers/api"

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

export const testsApi = {
  fetchTestSets: async () => {
    const response = await api.get<TestSet[]>("/tests")
    return response.data
  },
  fetchTestSet: async (id: string) => {
    const response = await api.get<TestSet>(`/tests/${id}`)
    return response.data
  },
  fetchTestQuestions: async (id: string) => {
    const response = await api.get<Question[]>(`/tests/${id}/questions`)
    return response.data
  },
  fetchTestResult: async (resultId: string) => {
    const response = await api.get<any>(`/tests/results/${resultId}`)
    return response.data
  },
  submitExam: async (id: string, data: { answers: { [questionId: string]: string }; durationMinutes?: number }) => {
    const response = await api.post(`/tests/${id}/submit`, data)
    return response.data
  },
  createTestSet: async (data: { name: string; description?: string; total_questions?: number; parts_count?: number }) => {
    const response = await api.post<TestSet>("/tests/admin/create", data)
    return response.data
  },
}
