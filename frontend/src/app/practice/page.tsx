"use client"

import * as React from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { useTests, TestSet } from "@/hooks/useTests"
import { useDashboard } from "@/hooks/useDashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ClipboardList,
} from "lucide-react"

export default function PracticeCatalogPage() {
  const { useTestSets } = useTests()
  const { useRecentTests } = useDashboard()

  const { data: testSets, isLoading: loadingTests } = useTestSets()
  const { data: recentTests, isLoading: loadingHistory } = useRecentTests()

  // Track completed test IDs
  const completedTestIds = React.useMemo(() => {
    if (!recentTests) return new Set<string>()
    // In our backend recent tests population, test.test_sets contains populated TestSet,
    // or sometimes we might have a different format, but the result has a reference.
    // Let's inspect test_set_id from history
    const completedSet = new Set<string>()
    recentTests.forEach((r) => {
      // Find the ID of the test set
      // It might be stored under populated test_sets._id or the old key.
      const id = (r as any).test_set_id || (r.test_sets as any)?._id
      if (id) completedSet.add(id.toString())
    })
    return completedSet
  }, [recentTests])

  // Group tests by folder/year (e.g. "2025 Exams", "2024 Exams", "Khác")
  const groupedExams = React.useMemo(() => {
    if (!testSets) return {}
    const groups: { [key: string]: TestSet[] } = {}
    
    testSets.forEach((set) => {
      // Extract year like 2024 or 2025 or default to "Bộ đề tổng hợp"
      const yearMatch = set.name.match(/\b(202\d)\b/)
      const groupName = yearMatch ? `Đề thi năm ${yearMatch[0]}` : "Bộ đề luyện tập tổng hợp"
      
      if (!groups[groupName]) {
        groups[groupName] = []
      }
      groups[groupName].push(set)
    })
    
    return groups
  }, [testSets])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Title Heading */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="text-gradient">Thư Viện Đề Thi TOEIC</span>
            <BookOpen className="h-6 w-6 text-primary animate-pulse" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chọn một đề thi trắc nghiệm để bắt đầu làm bài kiểm tra thử kỹ năng Đọc (Reading).
          </p>
        </div>

        {/* Catalog Content */}
        {loadingTests || loadingHistory ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-secondary/80 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : testSets && testSets.length > 0 ? (
          <div className="space-y-10">
            {Object.entries(groupedExams).map(([groupName, exams]) => (
              <div key={groupName} className="space-y-4">
                {/* Group Heading */}
                <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                  <ClipboardList className="h-5 w-5 text-primary shrink-0" />
                  <span>{groupName}</span>
                </h3>

                {/* Exams Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {exams.map((set) => {
                    const isCompleted = completedTestIds.has(set._id.toString())
                    
                    return (
                      <Card key={set._id} className="glass-card flex flex-col justify-between overflow-hidden relative group">
                        
                        {/* Glowing highlight border on hover */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                              <Layers className="h-3 w-3" />
                              <span>{set.parts_count} phần</span>
                            </span>
                            
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Đã hoàn thành</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                <span>Chưa làm</span>
                              </span>
                            )}
                          </div>
                          
                          <CardTitle className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors" title={set.name}>
                            {set.name}
                          </CardTitle>
                          <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {set.description || "Bộ đề thi thử TOEIC Reading chuẩn hóa giúp học viên nâng cao tốc độ đọc hiểu và phản xạ từ vựng."}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="pb-4">
                          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-3">
                            <span className="font-semibold text-foreground">{set.total_questions} câu hỏi</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{new Date(set.createdAt).getFullYear()}</span>
                            </span>
                          </div>
                        </CardContent>

                        <CardFooter className="bg-secondary/20 px-6 py-3 border-t border-border/10 flex justify-end">
                          <Link href={`/practice/${set._id}`} className="w-full">
                            <Button className="w-full text-xs font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-all flex items-center justify-center gap-1.5" variant={isCompleted ? "secondary" : "default"}>
                              <span>{isCompleted ? "Luyện tập lại" : "Bắt đầu làm bài"}</span>
                              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </Button>
                          </Link>
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-xl bg-secondary/15 flex flex-col items-center justify-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/60 mb-3" />
            <h4 className="font-bold text-lg text-foreground">Thư viện đề thi trống</h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Hiện tại chưa có đề thi nào được tạo. Nếu bạn là Admin, hãy truy cập &quot;Tạo Đề Mới&quot; để bổ sung nội dung.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
