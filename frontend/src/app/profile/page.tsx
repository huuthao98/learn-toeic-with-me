"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { useAuthStore } from "@/store/authStore"
import { useDashboard } from "@/hooks/useDashboard"
import { useTests } from "@/hooks/useTests"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  User,
  CalendarDays,
  History,
  ShieldCheck,
  Flame,
  Award,
  BookOpen,
  Mail,
  Phone,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const { useRecentTests, useStats } = useDashboard()
  const { useTestSets } = useTests()

  const { data: recentTests, isLoading: loadingHistory } = useRecentTests()
  const { data: stats, isLoading: loadingStats } = useStats()
  const { data: testSets, isLoading: loadingTests } = useTestSets()

  const isAdmin = user?.role === "admin"

  // Generate Check-in Heatmap Cells for the current month
  const heatmapDays = React.useMemo(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    
    // First day of the month
    const firstDay = new Date(year, month, 1)
    const totalDays = new Date(year, month + 1, 0).getDate()
    const startingDayOfWeek = firstDay.getDay() // 0 is Sunday, 1 is Monday...

    // Populate past dates that have study entries
    // For simplicity, we scan recentTests dates and stats.streak dates
    const activeDates = new Set<string>()
    if (recentTests) {
      recentTests.forEach((t) => {
        const dateStr = new Date(t.createdAt).toISOString().split("T")[0]
        activeDates.add(dateStr)
      })
    }
    // Also include today if there's a study streak recorded today
    const todayStr = today.toISOString().split("T")[0]
    if (stats?.streak && stats.streak > 0) {
      activeDates.add(todayStr)
    }

    const cells = []
    // Pad previous month days
    for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
      cells.push({ day: null, active: false })
    }

    // Add days of this month
    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(year, month, day)
      const cellDateStr = cellDate.toISOString().split("T")[0]
      const isActive = activeDates.has(cellDateStr)
      
      cells.push({
        day,
        active: isActive,
        isToday: day === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
      })
    }

    return cells
  }, [recentTests, stats])

  const weekdays = ["Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "CN"]
  const currentMonthName = new Date().toLocaleDateString("vi-VN", { month: "long", year: "numeric" })

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Title Heading */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="text-gradient">Hồ Sơ Học Viên</span>
            <User className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý tài khoản cá nhân, xem biểu đồ tích lũy chuyên cần và lịch sử luyện thi.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          
          {/* User Details & Heatmap (Left Column) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Account Card */}
            <Card className="glass-card overflow-hidden">
              <CardContent className="pt-8 pb-6 text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-primary to-cyan-500 mx-auto flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-primary/20">
                  {user?.fullName?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{user?.fullName || "Học Viên"}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1.5">
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {user?.role === "admin" ? "Quản Trị Viên" : "Học Viên"}
                    </span>
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      Gói: {user?.plan || "Miễn phí"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 space-y-3.5 text-left text-xs text-muted-foreground">
                  {user?.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user?.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user?.age && (
                    <div className="flex items-center gap-2.5">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span>Tuổi: {user.age} tuổi</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <Award className="h-4 w-4 text-primary" />
                    <span>Mục tiêu điểm số: <strong className="text-foreground">{user?.targetScore || 800}đ</strong></span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Check-in Calendar Heatmap */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span>Chuỗi Luyện Tập Chuyên Cần ({currentMonthName})</span>
                </CardTitle>
                <CardDescription>
                  Tự động ghi nhận khi làm bài thi thử hoặc ôn tập câu hỏi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Heatmap Grid */}
                <div>
                  <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-muted-foreground mb-2">
                    {weekdays.map((w) => (
                      <div key={w}>{w}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {heatmapDays.map((cell, idx) => (
                      <div
                        key={idx}
                        className={`heatmap-cell flex items-center justify-center text-xs font-bold ${
                          cell.day === null
                            ? "bg-transparent opacity-0 pointer-events-none"
                            : cell.active
                            ? "bg-emerald-500 text-white shadow shadow-emerald-500/20"
                            : cell.isToday
                            ? "bg-primary/10 text-primary border border-primary animate-pulse-ring"
                            : "bg-secondary text-muted-foreground/60 border border-border/20"
                        }`}
                        title={cell.active ? `Đã điểm danh học tập!` : ""}
                      >
                        {cell.day}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-semibold text-muted-foreground pt-2 border-t border-border/20">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-secondary border border-border/20" />
                    <span>Chưa học</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-emerald-500" />
                    <span>Đã luyện tập</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-orange-500">
                    <Flame className="h-3.5 w-3.5 fill-orange-500" />
                    <span>Học liên tục: {stats?.streak || 0} ngày</span>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Test History Table & Authored Tests (Right Column) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Test History Table */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <span>Lịch Sử Bài Thi Đã Làm</span>
                </CardTitle>
                <CardDescription>
                  Danh sách kết quả toàn bộ các đề thi thử bạn đã thực hiện.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="h-20 bg-secondary/80 animate-pulse rounded" />
                ) : recentTests && recentTests.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tên bộ đề</TableHead>
                          <TableHead>Ngày thi</TableHead>
                          <TableHead>Thời gian</TableHead>
                          <TableHead className="text-right">Điểm</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentTests.map((t) => (
                          <TableRow key={t._id} className="hover:bg-secondary/20">
                            <TableCell className="font-bold text-xs">
                              {t.test_sets?.name || "Đề thi TOEIC Reading"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-[10px]">
                              {new Date(t.createdAt).toLocaleDateString("vi-VN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {t.duration_minutes || 0} phút
                            </TableCell>
                            <TableCell className="text-right font-black text-indigo-600 dark:text-indigo-400">
                              {t.score}đ
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-border rounded-lg bg-secondary/15">
                    <BookOpen className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                    <h5 className="font-semibold text-xs text-muted-foreground">Chưa có kết quả làm bài</h5>
                    <p className="text-[10px] text-muted-foreground mt-1">Truy cập Thư viện đề thi để khởi chạy bài kiểm tra thử đầu tiên.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Authored Tests (Admin Creator Section) */}
            {isAdmin && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <span>Bộ Đề Đã Thiết Kế (Admin)</span>
                  </CardTitle>
                  <CardDescription>
                    Danh sách các đề thi thử TOEIC do các quản trị viên tạo dựng.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTests ? (
                    <div className="h-20 bg-secondary/80 animate-pulse rounded" />
                  ) : testSets && testSets.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tên bộ đề</TableHead>
                            <TableHead>Tổng số câu</TableHead>
                            <TableHead>Ngày thiết lập</TableHead>
                            <TableHead className="text-right">Xem</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {testSets.map((set) => (
                            <TableRow key={set._id} className="hover:bg-secondary/20">
                              <TableCell className="font-bold text-xs">{set.name}</TableCell>
                              <TableCell className="text-xs">{set.total_questions} câu hỏi</TableCell>
                              <TableCell className="text-muted-foreground text-[10px]">
                                {new Date(set.createdAt).toLocaleDateString("vi-VN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <Link
                                  href={`/practice/${set._id}`}
                                  className="text-xs font-semibold text-primary hover:underline"
                                >
                                  Luyện tập
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-10 border border-dashed border-border rounded-lg bg-secondary/15">
                      <Layers className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                      <h5 className="font-semibold text-xs text-muted-foreground">Chưa có đề thi được thiết kế</h5>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2">
                  <Button
                    onClick={() => router.push("/admin/create-test")}
                    className="w-full text-xs font-bold flex items-center gap-1.5"
                    variant="outline"
                  >
                    <span>Thiết kế thêm bộ đề thi mới</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            )}

          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
