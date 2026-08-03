import { api } from "@/helpers/api"

export interface VocabularyQuestion {
  _id: string;
  testSetId?: string;
  questionNumber: number;
  questionType: string;
  questionText: string;
  options: { label: string; text: string; pinyin?: string }[];
  correctAnswer: string;
  explanation?: string;
  pinyin?: string;
  status: string;
}

export interface CreateVocabularyQuestionData {
  questionNumber?: number;
  questionText: string;
  correctAnswer: string;
  explanation?: string;
  isActive?: boolean;
  pinyin?: string;
  options?: { label: string; text: string; pinyin?: string }[];
}

export interface VocabularySet {
  _id: string
  name: string
  description?: string
  status: string
  category?: string
  createdAt: string
  totalQuestions: number
  topics?: string[]
}

export const vocabularyApi = {
  fetchTestSets: async (category?: string, status?: string) => {
    let queryParams = new URLSearchParams()
    if (category) queryParams.append('category', category)
    if (status) queryParams.append('status', status)
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""

    const response = await api.get<VocabularySet[]>(`/vocabulary/sets${queryString}`)
    return response.data
  },

  fetchTestSet: async (id: string) => {
    const response = await api.get<VocabularySet>(`/vocabulary/sets/${id}`)
    return response.data
  },

  fetchTestQuestions: async (id: string) => {
    const response = await api.get<any[]>(`/vocabulary/sets/${id}/questions`)
    return response.data
  },

  fetchQuestions: async (testSetId: string, skip?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (skip !== undefined) params.append('skip', String(skip));
    if (limit !== undefined) params.append('limit', String(limit));
    const qs = params.toString();
    const url = qs ? `/vocabulary/sets/${testSetId}/questions?${qs}` : `/vocabulary/sets/${testSetId}/questions`;
    const response = await api.get<VocabularyQuestion[]>(url)
    return response.data
  },

  fetchTestResult: async (resultId: string) => {
    const response = await api.get<any>(`/vocabulary/results/${resultId}`)
    return response.data
  },

  submitExam: async (id: string, data: {
    answers: { [questionId: string]: string };
    durationMinutes?: number;
    timePerQuestion?: number[];
    isTest?: boolean;
    isReview?: boolean;
    isTestOut?: boolean;
    isRescueStreak?: boolean;
  }) => {
    const response = await api.post(`/vocabulary/sets/${id}/submit`, data)
    return response.data
  },

  createVocabularySet: async (data: any) => {
    const response = await api.post<VocabularySet>("/vocabulary/sets", data)
    return response.data
  },

  upsertBulkQuestions: async (data: { testSetId: string; questions: Partial<CreateVocabularyQuestionData & { questionNumber: number }>[] }) => {
    const response = await api.post(`/vocabulary/sets/${data.testSetId}/questions/bulk-upsert`, { questions: data.questions })
    return response.data
  },

  updateTestSet: async (id: string, data: { name?: string; description?: string; status?: string; category?: string; topics?: string[]; accessLevel?: string }) => {
    const response = await api.patch<VocabularySet>(`/vocabulary/sets/${id}`, data)
    return response.data
  },

  deleteTestSet: async (id: string) => {
    const response = await api.delete<any>(`/vocabulary/sets/${id}`)
    return response.data
  },

  updateQuestion: async (id: string, data: Partial<CreateVocabularyQuestionData>) => {
    const response = await api.patch<VocabularyQuestion>(`/vocabulary/questions/${id}`, data)
    return response.data
  },

  deleteQuestion: async (id: string) => {
    const response = await api.delete<any>(`/vocabulary/questions/${id}`)
    return response.data
  },
}
