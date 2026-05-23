"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useTests, Question } from "@/hooks/useTests"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Clock,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  CheckCircle2,
  BookOpen,
} from "lucide-react"

export default function TakeExamPage() {
  const params = useParams()
  const router = useRouter()
  const testSetId = params.id as string

  const { useTestSet, useTestQuestions, useSubmitExamMutation } = useTests()
  const { data: testSet, isLoading: loadingSet } = useTestSet(testSetId)
  const { data: questions, isLoading: loadingQuestions } = useTestQuestions(testSetId)
  const submitExamMutation = useSubmitExamMutation(testSetId)

  // Answers state: { questionId: selectedOption }
  const [answers, setAnswers] = React.useState<{ [key: string]: string }>({})
  const [activeQuestionIndex, setActiveQuestionIndex] = React.useState(0)
  const [timeLeft, setTimeLeft] = React.useState(0) // in seconds
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = React.useState(false)
  const [startTime] = React.useState<number>(Date.now())

  // Initialize countdown timer (1 minute per question)
  React.useEffect(() => {
    if (questions && questions.length > 0) {
      setTimeLeft(questions.length * 60)
    }
  }, [questions])

  // Timer interval
  React.useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Auto submit when time runs out
          handleSubmitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Select Option
  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers({ ...answers, [questionId]: option })
  }

  // Calculate duration
  const getDurationMinutes = () => {
    const end = Date.now()
    const diff = end - startTime
    return Math.max(Math.round(diff / 60000), 1)
  }

  // Submit Exam
  const handleSubmitExam = () => {
    setIsSubmitDialogOpen(false)
    submitExamMutation.mutate(
      {
        answers,
        durationMinutes: getDurationMinutes(),
      },
      {
        onSuccess: (data) => {
          // Redirect to results page, passing the newly created TestResult ID
          router.push(`/practice/${testSetId}/results?resultId=${data.resultId}`)
        },
      }
    )
  }

  // Format Timer Text
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (loadingSet || loadingQuestions) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground font-semibold">Đang chuẩn bị đề thi...</p>
        </div>
      </div>
    )
  }

  if (!testSet || !questions || questions.length === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
        <HelpCircle className="h-12 w-12 text-muted-foreground" />
        <h4 className="text-lg font-bold">Không tìm thấy đề thi</h4>
        <Button onClick={() => router.push("/practice")}>Quay lại thư viện</Button>
      </div>
    )
  }

  const currentQuestion = questions[activeQuestionIndex]
  const answeredCount = Object.keys(answers).length

  return (
    <div className="min-h-screen bg-background flex flex-col">
      
      {/* Exam Top Header (Fixed) */}
      <div className="glass-panel border-b border-border/40 h-16 sticky top-0 z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm("Tiến trình thi sẽ bị hủy. Bạn có muốn thoát?")) {
                router.push("/practice")
              }
            }}
            className="p-2 rounded-lg bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h3 className="font-bold text-sm truncate max-w-xs sm:max-w-md">{testSet.name}</h3>
            <p className="text-[10px] text-muted-foreground">TOEIC Reading Practice</p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary animate-pulse-ring">
          <Clock className="h-4 w-4" />
          <span className="font-mono font-bold text-sm">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto grid gap-6 lg:grid-cols-12 items-start">
        
        {/* Left column: Active Question Display */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="glass-card border-l-4 border-l-primary">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-primary">
                  Câu hỏi {activeQuestionIndex + 1} / {questions.length}
                </span>
                <CardDescription className="text-xs mt-0.5">Part {currentQuestion.part} - Độ khó: {currentQuestion.difficulty}</CardDescription>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-bold">
                Incomplete Sentences
              </span>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Text */}
              <div className="text-base font-semibold leading-relaxed p-4 rounded-xl bg-secondary/30 border border-border/20 text-indigo-900 dark:text-indigo-200">
                {currentQuestion.question_text}
              </div>

              {/* Choices (Options) */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion._id] === opt.label
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleSelectOption(currentQuestion._id, opt.label)}
                      className={`flex items-center gap-4 w-full p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary shadow-sm font-semibold"
                          : "border-border/40 hover:bg-secondary/40 hover:border-border text-foreground"
                      }`}
                    >
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary text-muted-foreground"
                      }`}>
                        {opt.label}
                      </span>
                      <span className="text-sm">{opt.text}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
            
            {/* Question footer navigator */}
            <CardFooter className="flex justify-between border-t border-border/40 pt-4">
              <Button
                variant="outline"
                disabled={activeQuestionIndex === 0}
                onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
                className="text-xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span>Câu trước</span>
              </Button>
              <Button
                variant="outline"
                disabled={activeQuestionIndex === questions.length - 1}
                onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
                className="text-xs"
              >
                <span>Câu sau</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right column: Sticky Navigator Widget */}
        <div className="lg:col-span-4 sticky top-24">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Tiến Độ Làm Bài</span>
              </CardTitle>
              <CardDescription>
                Hoàn thành {answeredCount} / {questions.length} câu hỏi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question Number Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {questions.map((q, index) => {
                  const isAnswered = !!answers[q._id]
                  const isActive = activeQuestionIndex === index
                  return (
                    <button
                      key={q._id}
                      onClick={() => setActiveQuestionIndex(index)}
                      className={`h-9 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20 scale-105"
                          : isAnswered
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                      }`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-border/40">
                <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                  <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-bold transition-all duration-200 bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 w-full py-2.5 cursor-pointer">
                    <Send className="h-4 w-4" />
                    <span>Nộp bài thi</span>
                  </DialogTrigger>
                  <DialogContent className="glass-panel">
                    <DialogHeader>
                      <DialogTitle>Xác nhận nộp bài thi?</DialogTitle>
                      <DialogDescription>
                        Bạn đã làm {answeredCount} trên tổng số {questions.length} câu hỏi. Bạn có chắc chắn muốn nộp bài để xem điểm số?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                      <Button variant="ghost" onClick={() => setIsSubmitDialogOpen(false)}>
                        Làm tiếp
                      </Button>
                      <Button onClick={handleSubmitExam} disabled={submitExamMutation.isPending}>
                        {submitExamMutation.isPending ? "Đang chấm điểm..." : "Nộp bài"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <p className="text-[10px] text-center text-muted-foreground leading-normal">
                  Đề thi tự động nộp khi bộ đếm ngược kết thúc. Vui lòng kiểm tra kỹ đáp án.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
