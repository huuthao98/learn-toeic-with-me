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
  passageContext?: string;
  passageType?: string;
  setId?: number;
  blankPosition?: string;
  note?: string;
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
  passageContext?: string;
  passageType?: string;
  setId?: number;
  blankPosition?: string;
  note?: string;
  questionType?: string;
}

export enum ToeicSetType {
  PRACTICE = 'practice',
  EXAM = 'exam',
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
  type: ToeicSetType
}

export const toeicApi = {
  fetchTestSets: async (status?: string, type?: string) => {
    let query = ""
    if (status) {
      query = `?status=${status}`
    }
    if (type) {
      query = `?type=${type}`
    }
    if (status && type) {
      query = `?status=${status}&type=${type}`
    }
    const response = await api.get<ToeicSet[]>(`/toeic/sets${query}`)
    return response.data
  },
  fetchTestSet: async (id: string) => {
    const response = await api.get<ToeicSet>(`/toeic/sets/${id}`)
    return response.data
  },
  fetchTestQuestions: async (id: string) => {
    const response = await api.get<any[]>(`/toeic/sets/${id}/questions`)
    return response.data
  },
  fetchTestResult: async (resultId: string) => {
    const response = await api.get<any>(`/toeic/results/${resultId}`)
    return response.data
  },
  submitExam: async (id: string, data: { answers: { [questionId: string]: string }; durationMinutes?: number, timePerQuestion?: number[], isTest?: boolean }) => {
    const response = await api.post(`/toeic/sets/${id}/submit`, data)
    return response.data
  },
  createToeicSet: async (data: any) => {
    const response = await api.post<ToeicSet>("/toeic/sets", data)
    return response.data
  },
  upsertBulkQuestions: async (data: { testSetId: string; questions: Partial<CreateToeicQuestionData & { questionNumber: number }>[] }) => {
    const response = await api.post(`/toeic/sets/${data.testSetId}/questions/bulk-upsert`, { questions: data.questions })
    return response.data
  },
  fetchQuestions: async (testSetId: string) => {
    const response = await api.get<ToeicQuestion[]>(`/toeic/sets/${testSetId}/questions`)
    return response.data
  },
  updateTestSet: async (id: string, data: { name?: string; description?: string; audioUrl?: string; status?: string; readingPdfUrl?: string; listeningPdfUrl?: string; topics?: string[]; type?: string }) => {
    const response = await api.patch<ToeicSet>(`/toeic/sets/${id}`, data)
    return response.data
  },
  deleteTestSet: async (id: string) => {
    const response = await api.delete<any>(`/toeic/sets/${id}`)
    return response.data
  },
  updateQuestion: async (questionId: string, data: Partial<ToeicQuestion>) => {
    const response = await api.patch<ToeicQuestion>(`/toeic/questions/${questionId}`, data)
    return response.data
  },
  deleteQuestion: async (questionId: string) => {
    const response = await api.delete<any>(`/toeic/questions/${questionId}`)
    return response.data
  },
}
