import { useQuery } from "@tanstack/react-query"
import { api } from "@/helpers/api"
import { useAuthStore } from "@/store/authStore"

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

export const useDashboard = () => {
  const token = useAuthStore((state) => state.token)

  const useStats = () =>
    useQuery({
      queryKey: ["dashboard-stats"],
      queryFn: async () => {
        const response = await api.get<DashboardStats>("/dashboard/stats")
        return response.data
      },
      enabled: !!token,
    })

  const useTodayPlan = () =>
    useQuery({
      queryKey: ["dashboard-today-plan"],
      queryFn: async () => {
        const response = await api.get<StudyPlanItem[]>("/dashboard/today-plan")
        return response.data
      },
      enabled: !!token,
    })

  const useScoreProgression = () =>
    useQuery({
      queryKey: ["dashboard-score-progression"],
      queryFn: async () => {
        const response = await api.get<ScoreProgression[]>("/dashboard/score-progression")
        return response.data
      },
      enabled: !!token,
    })

  const useRecentTests = () =>
    useQuery({
      queryKey: ["dashboard-recent-tests"],
      queryFn: async () => {
        const response = await api.get<RecentTestResult[]>("/dashboard/recent-tests")
        return response.data
      },
      enabled: !!token,
    })

  return {
    useStats,
    useTodayPlan,
    useScoreProgression,
    useRecentTests,
  }
}
