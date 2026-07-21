import { api } from "@/helpers/api"

export interface ToeicQuestion {
  _id: string;
  testSetId?: string;
  part: string;
  questionNumber: number;
  questionType: string;
  questionText: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
  audioUrl?: string;
  imageUrl?: string;
  passageText?: string;
  groupId?: string;
  status: string;
}

export interface CreateToeicQuestionData {
  questionNumber?: number;
  questionText: string;
  correctAnswer: string;
  explanation?: string;
  isActive?: boolean;
  part: string;
  options?: { label: string; text: string }[];
}

export interface ToeicSet {
  _id: string
  name: string
  description?: string
  audioUrl?: string
  status: string
  readingPdfUrl?: string
  createdAt: string
  totalQuestions: number
  listeningPdfUrl?: string
  topics?: string[]
}

export const toeicApi = {
  fetchTestSets: async (status?: string) => {
    let query = ""
    if (status) {
      query = `?status=${status}`
    }
    const response = await api.get<ToeicSet[]>(`/toeic${query}`)
    return response.data
  },
  fetchTestSet: async (id: string) => {
    const response = await api.get<ToeicSet>(`/toeic/${id}`)
    return response.data
  },
  fetchTestQuestions: async (id: string) => {
    // Need to import Question if needed, or use any
    const response = await api.get<any[]>(`/toeic/${id}/questions`)
    return response.data
  },
  fetchTestResult: async (resultId: string) => {
    const response = await api.get<any>(`/toeic/results/${resultId}`)
    return response.data
  },
  submitExam: async (id: string, data: { answers: { [questionId: string]: string }; durationMinutes?: number }) => {
    const response = await api.post(`/toeic/${id}/submit`, data)
    return response.data
  },
  createToeicSet: async (data: any) => {
    const response = await api.post<ToeicSet>("/toeic/admin/create", data)
    return response.data
  },
  upsertBulkQuestions: async (data: { testSetId: string; questions: Partial<CreateToeicQuestionData & { questionNumber: number }>[] }) => {
    const response = await api.post(`/toeic/admin/${data.testSetId}/questions/bulk-upsert`, { questions: data.questions })
    return response.data
  },
  fetchQuestions: async (testSetId: string) => {
    const response = await api.get<ToeicQuestion[]>(`/toeic/${testSetId}/questions`)
    return response.data
  },
  updateTestSet: async (id: string, data: { name?: string; description?: string; audioUrl?: string; status?: string; readingPdfUrl?: string; listeningPdfUrl?: string; topics?: string[] }) => {
    const response = await api.patch<ToeicSet>(`/toeic/admin/${id}/submit`, data)
    return response.data
  },
  deleteTestSet: async (id: string) => {
    const response = await api.delete<any>(`/toeic/admin/${id}`)
    return response.data
  },
}
