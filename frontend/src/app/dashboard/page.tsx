"use client"

import * as React from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { useDashboard } from "@/hooks/useDashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Flame,
  Award,
  Target,
  CalendarDays,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowUpRight,
  BookOpen,
} from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

export default function DashboardPage() {
  const { useStats, useTodayPlan, useScoreProgression, useRecentTests } = useDashboard()

  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: todayPlan, isLoading: planLoading } = useTodayPlan()
  const { data: progression, isLoading: chartLoading } = useScoreProgression()
  const { data: recentTests, isLoading: testsLoading } = useRecentTests()

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const targetProgress = stats
    ? Math.min(Math.round((stats.estimatedScore / stats.targetScore) * 100), 100)
    : 0

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Title greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="text-gradient">Bảng Điều Khiển</span>
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Theo dõi kết quả thi thử TOEIC, chỉ số chuyên cần và lộ trình ôn luyện mỗi ngày.
            </p>
          </div>
          
          <Link href="/practice">
            <Button className="font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30 group">
              <span>Vào thi thử ngay</span>
              <ArrowUpRight className="h-4 w-4 ml-1.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </Link>
        </div>

        {/* Stats Summary Row */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Estimated Score */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Điểm TOEIC Dự Tính</span>
              <Award className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-24 bg-secondary/80 animate-pulse rounded" />
              ) : (
                <div className="space-y-1">
                  <div className="text-3xl font-black">{stats?.estimatedScore || 0}đ</div>
                  <p className="text-[10px] text-muted-foreground">
                    LC: {stats?.listeningScore || 0} | RC: {stats?.readingScore || 0} (Thang 990)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Streak */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chuỗi Ngày Học</span>
              <Flame className="h-5 w-5 text-orange-500 animate-bounce" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-24 bg-secondary/80 animate-pulse rounded" />
              ) : (
                <div className="space-y-1">
                  <div className="text-3xl font-black text-orange-500 flex items-baseline gap-1">
                    <span>{stats?.streak || 0}</span>
                    <span className="text-sm font-semibold text-muted-foreground">ngày</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Kỷ lục chuỗi liên tiếp dài nhất: {stats?.longestStreak || 0} ngày
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target Score */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mục Tiêu Luyện Thi</span>
              <Target className="h-5 w-5 text-teal-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-8 w-24 bg-secondary/80 animate-pulse rounded" />
              ) : (
                <div className="space-y-2">
                  <div className="text-3xl font-black text-teal-500">{stats?.targetScore || 800}đ</div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${targetProgress}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
                      <span>Đạt {targetProgress}% mục tiêu</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's study tasks summary */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nhiệm Vụ Hôm Nay</span>
              <CalendarDays className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {planLoading ? (
                <div className="h-8 w-24 bg-secondary/80 animate-pulse rounded" />
              ) : (
                <div className="space-y-1">
                  <div className="text-3xl font-black">
                    {todayPlan?.filter(p => p.status === "completed").length || 0}/
                    {todayPlan?.length || 0}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {todayPlan && todayPlan.length > 0
                      ? `Bạn còn ${todayPlan.filter(p => p.status !== "completed").length} nhiệm vụ ôn thi`
                      : "Không có kế hoạch cho hôm nay"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chart & Study Plan layout */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Score Chart */}
          <Card className="lg:col-span-8 glass-card">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>Biểu Đồ Tiến Trình Điểm</span>
              </CardTitle>
              <CardDescription>Biến động điểm TOEIC dự toán qua 10 bài thi gần nhất.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full pt-4">
                {chartLoading ? (
                  <div className="h-full w-full bg-secondary/40 animate-pulse rounded flex items-center justify-center text-xs text-muted-foreground">
                    Đang tải dữ liệu biểu đồ...
                  </div>
                ) : progression && progression.length > 0 && mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progression} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="date" fontSize={11} stroke="var(--muted-foreground)" />
                      <YAxis domain={[0, 990]} fontSize={11} stroke="var(--muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          borderColor: "var(--border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="var(--primary)"
                        strokeWidth={3}
                        activeDot={{ r: 6 }}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-lg bg-secondary/15">
                    <TrendingUp className="h-10 w-10 text-muted-foreground/60 mb-2" />
                    <h5 className="font-semibold text-sm">Chưa có lịch sử làm bài</h5>
                    <p className="text-xs text-muted-foreground mt-1">Luyện tập thi thử để vẽ biểu đồ theo dõi tiến độ học.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Tasks */}
          <Card className="lg:col-span-4 glass-card flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Nhiệm Vụ Học Tập</span>
              </CardTitle>
              <CardDescription>Kế hoạch ôn tập cá nhân hóa ngày hôm nay.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              {planLoading ? (
                <div className="space-y-3">
                  <div className="h-14 bg-secondary/80 animate-pulse rounded-lg" />
                  <div className="h-14 bg-secondary/80 animate-pulse rounded-lg" />
                </div>
              ) : todayPlan && todayPlan.length > 0 ? (
                <div className="space-y-3">
                  {todayPlan.map((item) => (
                    <div
                      key={item._id}
                      className="p-3.5 rounded-lg border border-border/40 bg-secondary/35 flex items-center justify-between"
                    >
                      <div>
                        <h5 className="font-bold text-sm">TOEIC Part {item.part}</h5>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Hoàn thành: {item.completed_questions}/{item.target_questions} câu hỏi
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                          item.status === "completed"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {item.status === "completed" ? "Đã xong" : "Chưa làm"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-8 px-4 border border-dashed border-border rounded-lg bg-secondary/15">
                  <CalendarDays className="h-8 w-8 text-muted-foreground/60 mb-2" />
                  <h5 className="font-semibold text-sm">Tất cả nhiệm vụ đã xong</h5>
                  <p className="text-xs text-muted-foreground mt-1">Hôm nay không có nhiệm vụ cụ thể. Bạn có thể tự do luyện đề thi.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Test History Table */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Kết Quả Thi Thử Gần Đây</span>
              </CardTitle>
              <CardDescription>Lịch sử 5 bài thi thử TOEIC bạn làm gần đây nhất.</CardDescription>
            </div>
            <Link href="/profile" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <span>Xem tất cả</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {testsLoading ? (
              <div className="space-y-2">
                <div className="h-10 bg-secondary/60 animate-pulse rounded" />
                <div className="h-10 bg-secondary/60 animate-pulse rounded" />
              </div>
            ) : recentTests && recentTests.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên đề thi</TableHead>
                      <TableHead>Ngày thi</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Điểm Nghe</TableHead>
                      <TableHead>Điểm Đọc</TableHead>
                      <TableHead className="text-right">Tổng Điểm</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTests.map((test) => (
                      <TableRow key={test._id} className="hover:bg-secondary/20">
                        <TableCell className="font-bold">
                          {test.test_sets?.name || "Đề luyện thi TOEIC"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {new Date(test.createdAt).toLocaleDateString("vi-VN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {test.duration_minutes || 0} phút
                        </TableCell>
                        <TableCell className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {test.listening_score || 0}đ
                        </TableCell>
                        <TableCell className="font-semibold text-teal-600 dark:text-teal-400">
                          {test.reading_score || 0}đ
                        </TableCell>
                        <TableCell className="text-right font-black text-gradient">
                          {test.score || 0}đ
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-border rounded-lg bg-secondary/15 flex flex-col items-center justify-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/60 mb-2" />
                <h5 className="font-semibold text-sm">Chưa có bài thi nào</h5>
                <p className="text-xs text-muted-foreground mt-1">Hãy bắt đầu làm bài kiểm tra thử đầu tiên của bạn.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
