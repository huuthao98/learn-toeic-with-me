import { api } from "@/helpers/api"

export interface B1Question {
  _id: string;
  testSetId?: string;
  skill: 'listening' | 'reading' | 'writing' | 'speaking';
  part?: string;
  questionNumber?: number;
  questionType: 'multiple_choice' | 'essay' | 'speaking';
  questionText?: string;
  options?: { label: string; text: string }[];
  correctAnswer?: string;
  explanation?: string;
  audioUrl?: string;
  imageUrl?: string;
  passageContext?: string;
  passageType?: string;
  setId?: number;
  note?: string;
  status: string;
}

export interface CreateB1QuestionData {
  testSetId: string;
  skill: string;
  part?: string;
  questionNumber?: number;
  questionType?: string;
  questionText?: string;
  correctAnswer?: string;
  explanation?: string;
  isActive?: boolean;
  options?: { label: string; text: string }[];
  passageContext?: string;
  passageType?: string;
  setId?: number;
  note?: string;
  audioUrl?: string;
  imageUrl?: string;
}

export interface B1Set {
  _id: string;
  name: string;
  description?: string;
  audioUrl?: string;
  status: string;
  accessLevel?: string;
  createdAt: string;
  topics?: string[];
}

export const b1Api = {
  fetchTestSets: async (status?: string) => {
   let query = ""
    if (status) {
      query = `?status=${status}`
    }
   
    const { data } = await api.get(`/b1/sets${query}`)
    return data as B1Set[]
  },

  fetchTestSetById: async (id: string) => {
    const { data } = await api.get(`/b1/sets/${id}`)
    return data as B1Set
  },

  createTestSet: async (testData: Partial<B1Set>) => {
    const { data } = await api.post("/b1/sets", testData)
    return data
  },

  updateTestSet: async (id: string, testData: Partial<B1Set>) => {
    const { data } = await api.put(`/b1/sets/${id}`, testData)
    return data
  },

  deleteTestSet: async (id: string) => {
    const { data } = await api.delete(`/b1/sets/${id}`)
    return data
  },

  fetchQuestions: async (setId: string, skip = 0, limit = 0) => {
    const { data } = await api.get(`/b1/sets/${setId}/questions?skip=${skip}&limit=${limit}`)
    return data as B1Question[]
  },

  upsertBulkQuestions: async (setId: string, questions: CreateB1QuestionData[]) => {
    const { data } = await api.post(`/b1/sets/${setId}/questions/bulk`, questions)
    return data
  },

  submitExam: async (setId: string, answers: { [key: string]: string }, timePerQuestion: number[], isTest: boolean = true) => {
    const { data } = await api.post(`/b1/sets/${setId}/submit`, {
      answers,
      timePerQuestion,
      isTest,
    })
    return data
  },

  updateQuestion: async (questionId: string, data: Partial<CreateB1QuestionData>) => {
    const { data: res } = await api.patch(`/b1/questions/${questionId}`, data);
    return res;
  },

  fetchTestResult: async (resultId: string) => {
    const { data } = await api.get(`/b1/results/${resultId}`)
    return data
  }
}
