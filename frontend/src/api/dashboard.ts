import { api } from "@/helpers/api"

export interface DashboardStats {
  estimatedScore: number
  listeningScore: number
  readingScore: number
  targetScore: number
  streak: number
  longestStreak: number
}

export interface StudyPlanItem {
  _id: string
  user_id: string
  plan_date: string
  part: string
  target_questions: number
  completed_questions: number
  status: "pending" | "completed"
}

export interface ScoreProgression {
  date: string
  score: number
}

export interface RecentTestResult {
  _id: string
  score: number
  listening_score: number
  reading_score: number
  duration_minutes: number
  createdAt: string
  status: string
  test_sets?: {
    name: string
    total_questions: number
    parts_count: number
  }
}

export const dashboardApi = {
  getStats: async () => {
    const response = await api.get<DashboardStats>("/dashboard/stats")
    return response.data
  },
  getTodayPlan: async () => {
    const response = await api.get<StudyPlanItem[]>("/dashboard/today-plan")
    return response.data
  },
  getScoreProgression: async () => {
    const response = await api.get<ScoreProgression[]>("/dashboard/score-progression")
    return response.data
  },
  getRecentTests: async () => {
    const response = await api.get<RecentTestResult[]>("/dashboard/recent-tests")
    return response.data
  },
}
