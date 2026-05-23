"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { useAuthStore } from "@/store/authStore"
import { useTests, TestSet } from "@/hooks/useTests"
import { useQuestions } from "@/hooks/useQuestions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Sparkles,
  PlusCircle,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  AlertCircle,
  ArrowLeft,
  Settings,
} from "lucide-react"

export default function CreateTestPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  // Protect route
  React.useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, router])

  const { useTestSets, useCreateTestSetMutation } = useTests()
  const { useCreateQuestionMutation } = useQuestions()

  const { data: testSets, isLoading: loadingTestSets } = useTestSets()
  const createTestSetMutation = useCreateTestSetMutation()
  const createQuestionMutation = useCreateQuestionMutation()

  // Form State
  const [selectedTestSetId, setSelectedTestSetId] = React.useState<string>("")
  const [newTestSetName, setNewTestSetName] = React.useState("")
  const [newTestSetDesc, setNewTestSetDesc] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)

  // Current editing question state
  const [part, setPart] = React.useState("5") // Default to Part 5 (Incomplete Sentences)
  const [difficulty, setDifficulty] = React.useState("medium")
  const [questionText, setQuestionText] = React.useState("")
  const [optionA, setOptionA] = React.useState("")
  const [optionB, setOptionB] = React.useState("")
  const [optionC, setOptionC] = React.useState("")
  const [optionD, setOptionD] = React.useState("")
  const [correctAnswer, setCorrectAnswer] = React.useState("A")
  const [explanation, setExplanation] = React.useState("")

  // List of unsaved questions in this session
  const [sessionQuestions, setSessionQuestions] = React.useState<any[]>([])
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  // Create Test Set
  const handleCreateTestSet = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTestSetName.trim()) return

    createTestSetMutation.mutate(
      {
        name: newTestSetName,
        description: newTestSetDesc,
        total_questions: 0,
        parts_count: 1,
      },
      {
        onSuccess: (newSet) => {
          setSelectedTestSetId(newSet._id)
          setNewTestSetName("")
          setNewTestSetDesc("")
          setDialogOpen(false)
        },
      }
    )
  }

  // Add Question to current list in the session
  const handleAddQuestionToList = () => {
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!selectedTestSetId) {
      setErrorMsg("Vui lòng chọn hoặc tạo bộ đề thi trước khi thêm câu hỏi.")
      return
    }
    if (!questionText.trim()) {
      setErrorMsg("Nội dung câu hỏi không được để trống (phải chứa khoảng trống '_______').")
      return
    }
    if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ cả 4 phương án lựa chọn A, B, C, D.")
      return
    }

    const newQ = {
      id: `temp_${Date.now()}`,
      part,
      difficulty,
      questionText,
      options: [
        { label: "A", text: optionA },
        { label: "B", text: optionB },
        { label: "C", text: optionC },
        { label: "D", text: optionD },
      ],
      correctAnswer,
      explanation,
    }

    setSessionQuestions([...sessionQuestions, newQ])

    // Clear question form
    setQuestionText("")
    setOptionA("")
    setOptionB("")
    setOptionC("")
    setOptionD("")
    setCorrectAnswer("A")
    setExplanation("")
  }

  // Remove Question from list
  const handleRemoveQuestion = (id: string) => {
    setSessionQuestions(sessionQuestions.filter((q) => q.id !== id))
  }

  // Save All questions in the list to the backend database
  const handleSaveAllQuestions = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)

    if (sessionQuestions.length === 0) {
      setErrorMsg("Danh sách câu hỏi trống. Hãy thêm câu hỏi trước.")
      return
    }

    try {
      // Loop and save each question using react query mutation
      // (For real apps we can make a bulk-insert API, but here we run promises sequentially/concurrently)
      const savePromises = sessionQuestions.map((q) => {
        return createQuestionMutation.mutateAsync({
          testSetId: selectedTestSetId,
          part: q.part,
          difficulty: q.difficulty,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          isActive: true,
        })
      })

      await Promise.all(savePromises)

      setSuccessMsg(`Lưu thành công ${sessionQuestions.length} câu hỏi vào đề thi!`)
      setSessionQuestions([])
    } catch (error) {
      setErrorMsg("Gặp lỗi trong quá trình lưu câu hỏi. Vui lòng kiểm tra lại kết nối.")
    }
  }

  if (user && user.role !== "admin") {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Navigation / Heading */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin")}
            className="p-2 rounded-lg bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
            title="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="text-gradient">Tạo Đề Luyện Thi</span>
              <PlusCircle className="h-6 w-6 text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Thêm đề thi trắc nghiệm mới và nhập nội dung câu hỏi điền từ (Incomplete Sentences).
            </p>
          </div>
        </div>

        {/* Status banners */}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* Form Create Question (Left Column) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Bước 1: Chọn hoặc Tạo Đề Thi</span>
                </CardTitle>
                <CardDescription>Chọn đề thi mục tiêu để thêm câu hỏi.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-end gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Tên đề thi (Bộ đề)</label>
                  {loadingTestSets ? (
                    <div className="h-10 bg-secondary/80 animate-pulse rounded" />
                  ) : (
                    <Select value={selectedTestSetId} onValueChange={(val) => setSelectedTestSetId(val || "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="-- Chọn bộ đề thi --" />
                      </SelectTrigger>
                      <SelectContent>
                        {testSets?.map((set) => (
                          <SelectItem key={set._id} value={set._id}>
                            {set.name} ({set.total_questions} câu)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Create Test Set Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-all duration-200 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground px-4 h-9">
                    <PlusCircle className="h-4 w-4" />
                    <span>Tạo Đề Mới</span>
                  </DialogTrigger>
                  <DialogContent className="glass-panel">
                    <form onSubmit={handleCreateTestSet}>
                      <DialogHeader>
                        <DialogTitle>Tạo Đề Luyện Thi Mới</DialogTitle>
                        <DialogDescription>
                          Đề thi sẽ chứa các câu hỏi trắc nghiệm bạn nhập bên dưới.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Tên Đề Thi</label>
                          <Input
                            placeholder="Ví dụ: TOEIC Exam 2026 - Test 1"
                            value={newTestSetName}
                            onChange={(e) => setNewTestSetName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Mô tả đề thi</label>
                          <Input
                            placeholder="Ví dụ: Đề thi thử kỹ năng đọc Part 5 cấu trúc mới"
                            value={newTestSetDesc}
                            onChange={(e) => setNewTestSetDesc(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                          Hủy
                        </Button>
                        <Button type="submit" disabled={createTestSetMutation.isPending}>
                          {createTestSetMutation.isPending ? "Đang tạo..." : "Tạo Đề"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Question Builder Form */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <span>Bước 2: Nội dung câu hỏi (Incomplete Sentences)</span>
                </CardTitle>
                <CardDescription>Nhập câu hỏi có khoảng trống và các phương án lựa chọn.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">TOEIC Part</label>
                    <Select value={part} onValueChange={(val) => setPart(val || "5")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">Part 5: Incomplete Sentences</SelectItem>
                        <SelectItem value="6">Part 6: Text Completion</SelectItem>
                        <SelectItem value="7">Part 7: Reading Comprehension</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Độ khó</label>
                    <Select value={difficulty} onValueChange={(val) => setDifficulty(val || "medium")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy (Dễ)</SelectItem>
                        <SelectItem value="medium">Medium (Trung bình)</SelectItem>
                        <SelectItem value="hard">Hard (Khó)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Nội dung câu hỏi (Chứa khoảng trống)</label>
                  <textarea
                    placeholder="Ví dụ: The CEO requested that the marketing department _______ the quarterly report before Friday."
                    className="w-full text-sm p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary h-24 transition-all"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">Lưu ý: Bạn nên sử dụng các ký tự liên tiếp _______ để đại diện cho chỗ trống cần điền.</p>
                </div>

                {/* Multiple Choices Inputs */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Các đáp án lựa chọn</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-muted-foreground w-4">A</span>
                      <Input placeholder="Nhập đáp án A" value={optionA} onChange={(e) => setOptionA(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-muted-foreground w-4">B</span>
                      <Input placeholder="Nhập đáp án B" value={optionB} onChange={(e) => setOptionB(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-muted-foreground w-4">C</span>
                      <Input placeholder="Nhập đáp án C" value={optionC} onChange={(e) => setOptionC(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-muted-foreground w-4">D</span>
                      <Input placeholder="Nhập đáp án D" value={optionD} onChange={(e) => setOptionD(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Correct Answer Selection */}
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Đáp án đúng</label>
                  <RadioGroup value={correctAnswer} onValueChange={setCorrectAnswer} className="flex gap-6">
                    {["A", "B", "C", "D"].map((val) => (
                      <div key={val} className="flex items-center gap-2">
                        <RadioGroupItem value={val} id={`correct-${val}`} />
                        <label htmlFor={`correct-${val}`} className="text-sm font-bold cursor-pointer">{val}</label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Explanation */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Giải thích chi tiết (Không bắt buộc)</label>
                  <textarea
                    placeholder="Giải thích ngữ pháp hoặc từ vựng của câu để hỗ trợ học viên tự học..."
                    className="w-full text-sm p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary h-20 transition-all"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3 border-t border-border/40 pt-4">
                <Button variant="ghost" onClick={() => {
                  setQuestionText("")
                  setOptionA("")
                  setOptionB("")
                  setOptionC("")
                  setOptionD("")
                  setCorrectAnswer("A")
                  setExplanation("")
                }}>
                  Xóa Form
                </Button>
                <Button onClick={handleAddQuestionToList} className="bg-teal-600 hover:bg-teal-700 text-white">
                  Thêm vào danh sách tạm
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Session Questions list (Right Column) */}
          <div className="lg:col-span-5 flex flex-col">
            <Card className="glass-card flex-1 flex flex-col h-full">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    <span>Danh sách câu hỏi tạm thời</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                    {sessionQuestions.length} câu
                  </span>
                </CardTitle>
                <CardDescription>
                  Các câu hỏi đã soạn thảo trong phiên làm việc hiện tại (Chưa lưu vào cơ sở dữ liệu).
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto max-h-[460px] space-y-4">
                {sessionQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {sessionQuestions.map((q, index) => (
                      <div key={q.id} className="p-3 rounded-lg border border-border/40 bg-secondary/20 flex flex-col justify-between gap-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-bold text-primary">Câu {index + 1} (Part {q.part})</span>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 bg-secondary text-muted-foreground rounded">
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-foreground line-clamp-2">{q.questionText}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                          <span>A. {q.options[0].text}</span>
                          <span>B. {q.options[1].text}</span>
                          <span>C. {q.options[2].text}</span>
                          <span>D. {q.options[3].text}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-border/20 pt-2 mt-1">
                          <span className="text-[10px] font-bold text-emerald-600">Đáp án: {q.correctAnswer}</span>
                          <button
                            onClick={() => handleRemoveQuestion(q.id)}
                            className="p-1 rounded text-destructive hover:bg-destructive/10 transition-all"
                            title="Xóa câu hỏi khỏi danh sách"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 px-6 border border-dashed border-border rounded-lg bg-secondary/10">
                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground/60 mb-2 animate-pulse" />
                    <h5 className="font-semibold text-sm">Danh sách trống</h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hãy soạn thảo câu hỏi ở cột bên trái và nhấn &quot;Thêm vào danh sách tạm&quot; để gom dữ liệu.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t border-border/40 pt-4 flex flex-col gap-2">
                <Button
                  onClick={handleSaveAllQuestions}
                  disabled={sessionQuestions.length === 0 || createQuestionMutation.isPending}
                  className="w-full font-bold shadow-md shadow-primary/10"
                >
                  {createQuestionMutation.isPending ? "Đang lưu câu hỏi..." : `Lưu tất cả (${sessionQuestions.length} câu) vào cơ sở dữ liệu`}
                </Button>
                <p className="text-[9px] text-center text-muted-foreground">
                  Nhấn nút để gửi tất cả câu hỏi lưu tạm thời ở trên lên máy chủ lưu trữ.
                </p>
              </CardFooter>
            </Card>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
