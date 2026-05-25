import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { dashboardApi } from "@/api/dashboard"

export type { DashboardStats, StudyPlanItem, ScoreProgression, RecentTestResult } from "@/api/dashboard"

export const useDashboard = () => {
  const token = useAuthStore((state) => state.token)

  const useStats = () =>
    useQuery({
      queryKey: ["dashboard-stats"],
      queryFn: dashboardApi.getStats,
      enabled: !!token,
    })

  const useTodayPlan = () =>
    useQuery({
      queryKey: ["dashboard-today-plan"],
      queryFn: dashboardApi.getTodayPlan,
      enabled: !!token,
    })

  const useScoreProgression = () =>
    useQuery({
      queryKey: ["dashboard-score-progression"],
      queryFn: dashboardApi.getScoreProgression,
      enabled: !!token,
    })

  const useRecentTests = () =>
    useQuery({
      queryKey: ["dashboard-recent-tests"],
      queryFn: dashboardApi.getRecentTests,
      enabled: !!token,
    })

  return {
    useStats,
    useTodayPlan,
    useScoreProgression,
    useRecentTests,
  }
}
