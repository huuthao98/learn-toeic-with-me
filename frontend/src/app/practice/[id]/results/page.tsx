"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useTests } from "@/hooks/useTests"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  LayoutDashboard,
  Check,
  AlertTriangle,
} from "lucide-react"

export default function ExamResultsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const testSetId = params.id as string
  const resultId = searchParams.get("resultId")

  const { useTestResult, useTestQuestions } = useTests()
  const { data: result, isLoading: loadingResult } = useTestResult(resultId || "")
  const { data: questions, isLoading: loadingQuestions } = useTestQuestions(testSetId)

  if (loadingResult || loadingQuestions) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-semibold">Đang tổng hợp kết quả chấm điểm...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h4 className="text-lg font-bold">Không tìm thấy kết quả bài thi</h4>
        <Button onClick={() => router.push("/practice")}>Quay lại thư viện</Button>
      </div>
    )
  }

  const testName = result.test_set_id?.name || "Đề luyện thi TOEIC"
  const totalQuestions = questions?.length || 0

  return (
    <div className="min-h-screen bg-background pb-12">
      
      {/* Top Header */}
      <div className="glass-panel border-b border-border/40 h-16 sticky top-0 z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/practice")}
            className="p-2 rounded-lg bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
            title="Quay lại danh sách đề thi"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h3 className="font-bold text-sm truncate max-w-xs sm:max-w-md">Kết Quả: {testName}</h3>
            <p className="text-[10px] text-muted-foreground">Báo cáo kiểm tra chi tiết</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="text-xs h-9 font-semibold flex items-center gap-1.5"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Về Dashboard</span>
          </Button>
        </div>
      </div>

      {/* Content wrapper */}
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 mt-4">
        
        {/* Score Summary Banner */}
        <Card className="glass-card overflow-hidden border-t-4 border-t-primary">
          <CardContent className="pt-8 pb-8 flex flex-col md:flex-row items-center justify-around gap-8">
            
            {/* Total score ring */}
            <div className="relative flex flex-col items-center justify-center h-44 w-44 rounded-full bg-gradient-to-tr from-primary to-cyan-500 shadow-lg shadow-primary/20">
              <Award className="h-7 w-7 text-white/80 absolute top-6" />
              <div className="text-4xl font-black text-white mt-4">{result.score}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70 mt-1">TOEIC Điểm Đọc</div>
              <span className="text-[9px] font-bold text-white/50 absolute bottom-6">Thang điểm 990</span>
            </div>

            {/* Scores & stats details */}
            <div className="flex-1 space-y-6 w-full md:max-w-md">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-black flex items-center justify-center md:justify-start gap-2">
                  <span className="text-gradient">Hoàn Thành Bài Thi!</span>
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Kết quả đã được ghi nhận vào lịch sử học tập của bạn.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Score Reading */}
                <div className="p-3.5 rounded-xl bg-secondary/35 border border-border/40">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase">Điểm Đọc (Reading)</div>
                  <div className="text-xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">{result.reading_score}đ</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">Thang tối đa 495đ</div>
                </div>

                {/* Duration */}
                <div className="p-3.5 rounded-xl bg-secondary/35 border border-border/40">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>Thời gian làm bài</span>
                  </div>
                  <div className="text-xl font-extrabold text-foreground mt-1">{result.duration_minutes || 0} phút</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">Thời gian thực tế</div>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Detailed Question Review Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-black flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>Đáp Án & Giải Thích Chi Tiết</span>
          </h3>

          {questions && questions.length > 0 ? (
            <div className="space-y-6">
              {questions.map((q, index) => {
                return (
                  <Card key={q._id} className="glass-card">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                          Câu {index + 1} (Part {q.part})
                        </span>
                        <CardDescription className="text-xs mt-0.5">Độ khó: {q.difficulty}</CardDescription>
                      </div>
                      
                      {/* Show Answer Check Status */}
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>ĐÁP ÁN: {q.correct_answer}</span>
                      </span>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Question Content */}
                      <p className="text-sm font-semibold leading-relaxed p-3.5 bg-secondary/25 border border-border/40 rounded-lg text-indigo-900 dark:text-indigo-200">
                        {q.question_text}
                      </p>

                      {/* Options listing */}
                      <div className="grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt) => {
                          const isCorrect = opt.label.trim().toUpperCase() === q.correct_answer.trim().toUpperCase()
                          
                          return (
                            <div
                              key={opt.label}
                              className={`flex items-center gap-3 p-3 rounded-lg border text-xs ${
                                isCorrect
                                  ? "border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 font-semibold"
                                  : "border-border/40 text-muted-foreground"
                              }`}
                            >
                              <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                isCorrect
                                  ? "bg-emerald-500 text-white"
                                  : "bg-secondary text-muted-foreground"
                              }`}>
                                {opt.label}
                              </span>
                              <span>{opt.text}</span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Grammatical Explanation */}
                      {q.explanation && (
                        <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
                          <span className="font-extrabold uppercase tracking-wider block mb-1 text-primary">Giải thích:</span>
                          {q.explanation}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-muted-foreground">Không tìm thấy câu hỏi tương ứng.</div>
          )}
        </div>

      </div>
    </div>
  )
}
