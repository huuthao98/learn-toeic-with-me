import { api } from "@/helpers/api"

export interface TestSet {
  _id: string
  name: string
  description?: string
  audioUrl?: string
  status: string
  readingPdfUrl?: string
  createdAt: string
  testType?:string
  totalQuestions:number
  listeningPdfUrl?: string
}

export interface Question {
  _id: string
  testSetId?: string
  part: string
  questionNumber: number
  difficulty: "easy" | "medium" | "hard"
  questionText: string
  options: { label: string; text: string }[]
  correctAnswer: string
  explanation?: string
  audio_url?: string
  image_url?: string
  group_id?: string
  passage_text?: string
  status: string
  category?:string
}

export const testsApi = {
  fetchTestSets: async (testType?: string,status?:string) => {
    let query = ""
    if(testType && status){
      query = `?testType=${testType}&status=${status}`
    }else if(testType){
      query = `?testType=${testType}`
    }else if(status){
      query = `?status=${status}`
    }
    const response = await api.get<TestSet[]>(`/tests${query}`)
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
  createTestSet: async (data: { name: string; description?: string; audioUrl?: string; status?: string; readingPdfUrl?: string; testType?: string;listeningPdfUrl?:string }) => {
    const response = await api.post<TestSet>("/tests/admin/create", data)
    return response.data
  },
  updateTestSet: async (id: string, data: { name?: string; description?: string; audioUrl?: string; status?: string; pdfUrl?: string; testType?: string }) => {
    const response = await api.patch<TestSet>(`/tests/admin/${id}`, data)
    return response.data
  },
  deleteTestSet: async (id: string) => {
    const response = await api.delete<any>(`/tests/admin/${id}`)
    return response.data
  },
}
