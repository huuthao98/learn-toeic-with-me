"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { useAuthStore } from "@/store/authStore"
import { useQuestions } from "@/hooks/useQuestions"
import { useTests } from "@/hooks/useTests"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ShieldCheck,
  PlusCircle,
  HelpCircle,
  Layers,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react"
import { useEffect, useState } from "react"

export default function AdminPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  // Protect page
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, router])

  const { useTestSets } = useTests()
  const { useFetchQuestions, useDeleteQuestionMutation } = useQuestions()

  const { data: testSets, isLoading: loadingTests } = useTestSets()
  const { data: questionsData, isLoading: loadingQuestions } = useFetchQuestions({ page: 1, limit: 100 })
  const deleteQuestionMutation = useDeleteQuestionMutation()

  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleDeleteQuestion = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa câu hỏi này khỏi cơ sở dữ liệu?")) {
      deleteQuestionMutation.mutate(id, {
        onSuccess: () => {
          setSuccessMsg("Xóa câu hỏi thành công!")
          setTimeout(() => setSuccessMsg(null), 3000)
        },
        onError: (err: any) => {
          setErrorMsg(err.response?.data?.message || "Xóa câu hỏi thất bại.")
          setTimeout(() => setErrorMsg(null), 3000)
        },
      })
    }
  }

  if (user && user.role !== "admin") {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Title greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="text-gradient">Cổng Quản Trị</span>
              <ShieldCheck className="h-7 w-7 text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý đề thi thử TOEIC, danh sách câu hỏi trắc nghiệm và thống kê nội dung học tập.
            </p>
          </div>

          <Link href="/admin/create-test">
            <Button className="font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Tạo đề thi & soạn câu hỏi</span>
            </Button>
          </Link>
        </div>

        {/* Global Messages */}
        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans">Tổng Số Đề Thi</span>
              <Layers className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{testSets?.length || 0}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Đề thi thử TOEIC kỹ năng Reading</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tổng Số Câu Hỏi</span>
              <HelpCircle className="h-5 w-5 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{questionsData?.total || 0}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Câu hỏi trắc nghiệm trong thư viện</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phân Nhóm TOEIC</span>
              <ShieldCheck className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">Part 5, 6, 7</div>
              <p className="text-[10px] text-muted-foreground mt-1">Các phần của đề đọc hiểu TOEIC</p>
            </CardContent>
          </Card>
        </div>

        {/* Two Sections Layout: Test Sets Table and Questions Table */}
        <div className="grid gap-6 lg:grid-cols-12">

          {/* Test Sets Table (Admin list) */}
          <Card className="lg:col-span-4 glass-card flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span>Danh Sách Bộ Đề Thi</span>
              </CardTitle>
              <CardDescription>Các đề thi thử được phân bổ.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-x-auto">
              {loadingTests ? (
                <div className="h-20 bg-secondary/80 animate-pulse rounded" />
              ) : testSets && testSets.length > 0 ? (
                <div className="space-y-3">
                  {testSets.map((set) => (
                    <div
                      key={set._id}
                      className="p-3 rounded-lg border border-border/40 bg-secondary/20 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs truncate" title={set.name}>{set.name}</h5>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{set.total_questions} câu hỏi</p>
                      </div>
                      <Link href="/practice" className="p-1 text-primary hover:bg-primary/10 rounded transition-all shrink-0">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">Chưa có đề thi nào.</div>
              )}
            </CardContent>
          </Card>

          {/* Questions Table (Admin list) */}
          <Card className="lg:col-span-8 glass-card">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span>Thư Viện Câu Hỏi Trắc Nghiệm</span>
              </CardTitle>
              <CardDescription>Danh sách các câu hỏi trắc nghiệm đã lưu trên hệ thống.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingQuestions ? (
                <div className="h-40 bg-secondary/60 animate-pulse rounded" />
              ) : questionsData && questionsData.data.length > 0 ? (
                <div className="overflow-x-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part</TableHead>
                        <TableHead>Nội dung câu hỏi</TableHead>
                        <TableHead>Đáp án</TableHead>
                        <TableHead>Độ khó</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questionsData.data.map((q) => (
                        <TableRow key={q._id} className="hover:bg-secondary/20">
                          <TableCell className="font-bold text-xs">Part {q.part}</TableCell>
                          <TableCell className="text-xs max-w-sm truncate" title={q.question_text}>
                            {q.question_text}
                          </TableCell>
                          <TableCell className="font-bold text-xs text-emerald-600">{q.correct_answer}</TableCell>
                          <TableCell className="text-xs">
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${q.difficulty === "easy"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : q.difficulty === "medium"
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-destructive/10 text-destructive"
                              }`}>
                              {q.difficulty}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <button
                              onClick={() => handleDeleteQuestion(q._id)}
                              disabled={deleteQuestionMutation.isPending}
                              className="p-1 rounded text-destructive hover:bg-destructive/10 transition-all"
                              title="Xóa câu hỏi"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-border rounded-lg bg-secondary/15 flex flex-col items-center justify-center">
                  <HelpCircle className="h-10 w-10 text-muted-foreground/60 mb-2" />
                  <h5 className="font-semibold text-sm">Chưa có câu hỏi nào</h5>
                  <p className="text-xs text-muted-foreground mt-1">Nhấp nút bên phải để bắt đầu soạn câu hỏi.</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  )
}
