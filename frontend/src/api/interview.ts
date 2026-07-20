import { api } from "@/helpers/api"

export interface InterviewQuestion {
  _id: string;
  testSetId?: string;
  questionNumber: number;
  questionType: string;
  questionText: string;
  correctAnswer:string;
  explanation?: string;
  status: string;
}

export interface CreateInterviewQuestionData {
  testSetId?: string;
  questionNumber?: number;
  questionText: string;
  correctAnswer:string;
  explanation?: string;
  isActive?: boolean;
}

export interface InterviewTopic {
  _id: string
  name: string
  description?: string
  status: string
  createdAt: string
  totalQuestions: number
  topics?: string[]
}

export const interviewApi = {
  fetchTestSets: async (status?: string) => {
    let query = ""
    if (status) {
      query = `?status=${status}`
    }
    const response = await api.get<InterviewTopic[]>(`/interview${query}`)
    return response.data
  },
  fetchTestSet: async (id: string) => {
    const response = await api.get<InterviewTopic>(`/interview/${id}`)
    return response.data
  },
  fetchTestQuestions: async (id: string) => {
    const response = await api.get<any[]>(`/interview/${id}/questions`)
    return response.data
  },
  fetchTestResult: async (resultId: string) => {
    const response = await api.get<any>(`/interview/results/${resultId}`)
    return response.data
  },
  submitExam: async (id: string, data: { answers: { [questionId: string]: string }; durationMinutes?: number }) => {
    const response = await api.post(`/interview/${id}/submit`, data)
    return response.data
  },
  createTestSet: async (data: { name: string; description?: string; status?: string; notifyUsers?: boolean; topics?: string[] }) => {
    const response = await api.post<InterviewTopic>("/interview/admin/create", data)
    return response.data
  },
  createInterviewTopic: async (data: any) => {
    const response = await api.post<InterviewTopic>("/interview/admin/create", data)
    return response.data
  },
  upsertBulkQuestions: async (data: { testSetId: string; questions: Partial<CreateInterviewQuestionData & { questionNumber: number }>[] }) => {
    const response = await api.post(`/interview/admin/${data.testSetId}/questions/bulk-upsert`, { questions: data.questions })
    return response.data
  },
  fetchQuestions: async (testSetId: string) => {
    const response = await api.get<InterviewQuestion[]>(`/interview/${testSetId}/questions`)
    return response.data
  },
  createQuestion: async (data: CreateInterviewQuestionData) => {
    const response = await api.post<InterviewQuestion>("/interview/admin/questions", data)
    return response.data
  },
  updateQuestion: async (id: string, data: Partial<CreateInterviewQuestionData>) => {
    const response = await api.patch<InterviewQuestion>(`/interview/admin/questions/${id}`, data)
    return response.data
  },
  deleteQuestion: async (id: string) => {
    const response = await api.delete(`/interview/admin/questions/${id}`)
    return response.data
  },
  updateTestSet: async (id: string, data: { name?: string; description?: string; status?: string; topics?: string[] }) => {
    const response = await api.patch<InterviewTopic>(`/interview/admin/${id}`, data)
    return response.data
  },
  deleteTestSet: async (id: string) => {
    const response = await api.delete<any>(`/interview/admin/${id}`)
    return response.data
  },
}
