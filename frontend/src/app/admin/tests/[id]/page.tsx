'use client';

import {
  Edit,
  Trash2,
  BookOpen,
  Calendar,
  HelpCircle,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  FileSpreadsheet,
  Copy,
  Check,
} from 'lucide-react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';

import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MediaUploadInput } from '@/components/MediaUploadInput';
import { AddInterviewQuestionDialog } from '@/components/admin/AddInterviewQuestionDialog';
import { ExcelUploadDialog } from '@/components/admin/ExcelUploadDialog';

import { useTests } from '@/hooks/useTests';
import { useQuestions } from '@/hooks/useQuestions';
import { useAuthStore } from '@/store/authStore';

// Edit Zod Validation Schema
const editTestSetSchema = z.object({
  name: z.string().trim().min(1, 'Tên đề thi không được để trống'),
  description: z.string(),
  audioUrl: z.string().optional(),
  status: z.enum(['draft', 'public', 'private']).optional(),
});

type EditTestSetFormValues = z.infer<typeof editTestSetSchema>;

// Question Zod Validation Schema
const editQuestionSchema = z
  .object({
    part: z.string().min(1, 'Vui lòng chọn Part'),
    difficulty: z.string().min(1, 'Vui lòng chọn độ khó'),
    questionText: z.string().trim().optional(),
    optionA: z.string().trim().min(1, 'Vui lòng nhập phương án A'),
    optionB: z.string().trim().min(1, 'Vui lòng nhập phương án B'),
    optionC: z.string().trim().min(1, 'Vui lòng nhập phương án C'),
    optionD: z.string().trim().optional(),
    correctAnswer: z.string().min(1, 'Vui lòng chọn đáp án đúng'),
    explanation: z.string().optional(),
    audioUrl: z.string().trim().optional(),
    imageUrl: z.string().trim().optional(),
    passageText: z.string().trim().optional(),
    groupId: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.part !== '2' && (!data.optionD || data.optionD.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vui lòng nhập phương án D',
        path: ['optionD'],
      });
    }
  });

type EditQuestionFormValues = z.infer<typeof editQuestionSchema>;

export default function TestSetDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user } = useAuthStore();

  // Protect route
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const {
    useTestSet,
    useTestQuestions,
    useUpdateTestSetMutation,
    useDeleteTestSetMutation,
  } = useTests();
  const { useDeleteQuestionMutation, useUpdateQuestionMutation } =
    useQuestions();

  const { data: testSet, isLoading: loadingTestSet } = useTestSet(id);
  const { data: questions, isLoading: loadingQuestions } = useTestQuestions(id);
  const deleteQuestionMutation = useDeleteQuestionMutation();
  const updateTestSetMutation = useUpdateTestSetMutation(id);
  const updateQuestionMutation = useUpdateQuestionMutation();
  const deleteTestSetMutation = useDeleteTestSetMutation();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [editQuestionDialogOpen, setEditQuestionDialogOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [isAddExcelOpen, setIsAddExcelOpen] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleQuestionExpand = (id: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Edit form hook (for test set)
  const editForm = useForm<EditTestSetFormValues>({
    resolver: zodResolver(editTestSetSchema),
    defaultValues: {
      name: '',
      description: '',
      audioUrl: '',
      status: 'draft',
    },
  });

  // Edit question form hook
  const editQuestionForm = useForm<EditQuestionFormValues>({
    resolver: zodResolver(editQuestionSchema),
    defaultValues: {
      part: '5',
      difficulty: 'medium',
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
    },
  });

  // Sync testSet data to form
  useEffect(() => {
    if (testSet) {
      editForm.reset({
        name: testSet.name,
        description: testSet.description || '',
        audioUrl: testSet.audioUrl || '',
        status: (testSet.status as 'draft' | 'public' | 'private') || 'draft',
      });
    }
  }, [testSet, editForm]);

  const onEditSubmit = (values: EditTestSetFormValues) => {
    updateTestSetMutation.mutate(
      {
        name: values.name,
        description: values.description,
        audioUrl: values.audioUrl,
        status: values.status,
      },
      {
        onSuccess: () => {
          setSuccessMsg('Cập nhật thông tin đề thi thành công!');
          setEditDialogOpen(false);
          setTimeout(() => setSuccessMsg(null), 3000);
        },
        onError: (err: any) => {
          setErrorMsg(
            err.response?.data?.message || 'Cập nhật đề thi thất bại.',
          );
          setTimeout(() => setErrorMsg(null), 3000);
        },
      },
    );
  };

  const handleOpenEditQuestion = (q: any) => {
    setEditingQuestion(q);
    editQuestionForm.reset({
      part: q.part,
      difficulty: q.difficulty,
      questionText: q.question_text || '',
      optionA: q.options[0]?.text || '',
      optionB: q.options[1]?.text || '',
      optionC: q.options[2]?.text || '',
      optionD: q.options[3]?.text || '',
      correctAnswer: q.correct_answer,
      explanation: q.explanation || '',
      audioUrl: q.audio_url || '',
      imageUrl: q.image_url || '',
      passageText: q.passage_text || '',
      groupId: q.group_id || '',
    });
    setEditQuestionDialogOpen(true);
  };

  const onEditQuestionSubmit = (values: EditQuestionFormValues) => {
    if (!editingQuestion) return;

    updateQuestionMutation.mutate(
      {
        id: editingQuestion._id,
        data: {
          part: values.part,
          difficulty: values.difficulty,
          questionText: values.questionText || '',
          options: [
            { label: 'A', text: values.optionA },
            { label: 'B', text: values.optionB },
            { label: 'C', text: values.optionC },
            ...(values.part !== '2'
              ? [{ label: 'D', text: values.optionD || '' }]
              : []),
          ],
          correctAnswer: values.correctAnswer,
          explanation: values.explanation || '',
          audioUrl: values.audioUrl || '',
          imageUrl: values.imageUrl || '',
          passageText: values.passageText || '',
          groupId: values.groupId || '',
        },
      },
      {
        onSuccess: () => {
          setSuccessMsg('Cập nhật câu hỏi thành công!');
          setEditQuestionDialogOpen(false);
          setEditingQuestion(null);
          setTimeout(() => setSuccessMsg(null), 3000);
        },
        onError: (err: any) => {
          setErrorMsg(
            err.response?.data?.message || 'Cập nhật câu hỏi thất bại.',
          );
          setTimeout(() => setErrorMsg(null), 3000);
        },
      },
    );
  };
  const handleDeleteQuestion = (questionId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi đề thi?')) {
      deleteQuestionMutation.mutate(questionId, {
        onSuccess: () => {
          setSuccessMsg('Xóa câu hỏi thành công!');
          setTimeout(() => setSuccessMsg(null), 3000);
        },
        onError: (err: any) => {
          setErrorMsg(err.response?.data?.message || 'Xóa câu hỏi thất bại.');
          setTimeout(() => setErrorMsg(null), 3000);
        },
      });
    }
  };

  const handleDeleteTestSet = () => {
    if (
      confirm(
        'Bạn có chắc chắn muốn xóa toàn bộ đề thi này? Mọi câu hỏi và kết quả thi liên quan cũng sẽ bị xóa vĩnh viễn!',
      )
    ) {
      deleteTestSetMutation.mutate(id, {
        onSuccess: () => {
          router.push('/admin');
        },
        onError: (err: any) => {
          setErrorMsg(err.response?.data?.message || 'Xóa đề thi thất bại.');
          setTimeout(() => setErrorMsg(null), 3000);
        },
      });
    }
  };

  if (user && user.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 rounded-lg bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
              title="Quay lại"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-gradient">Chi Tiết Đề Thi</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Xem cấu trúc đề thi, danh sách câu hỏi và quản lý nội dung.
              </p>
            </div>
          </div>
          {testSet?.testType === 'interview' && (
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <Button
                variant="outline"
                className="gap-2 shadow-sm"
                onClick={() => setIsAddManualOpen(true)}
              >
                <PlusCircle className="h-4 w-4" />
                Thêm 1 câu
              </Button>
              <Button
                variant="default"
                className="gap-2 shadow-md shadow-primary/20"
                onClick={() => setIsAddExcelOpen(true)}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Nhập Excel
              </Button>
            </div>
          )}
        </div>

        {/* Global Messages */}
        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2 animate-shake">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Metadata Details Card */}
        {loadingTestSet ? (
          <div className="h-44 bg-secondary/80 animate-pulse rounded-xl" />
        ) : testSet ? (
          <Card className="glass-card gap-0 overflow-hidden relative border-primary/25">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-cyan-500" />
            <CardHeader className="pb-4 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-foreground">
                  {testSet.name}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {testSet.description}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {/* Edit Metadata Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground px-2.5 h-8 text-xs font-semibold transition-all duration-200 cursor-pointer">
                    <Edit className="h-3.5 w-3.5" />
                    <span>Chỉnh sửa</span>
                  </DialogTrigger>
                  <DialogContent className="bg-background/80 backdrop-blur-md border-b border-border/40">
                    <Form {...editForm}>
                      <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
                        <DialogHeader>
                          <DialogTitle>Chỉnh Sửa Thông Tin Đề Thi</DialogTitle>
                          <DialogDescription>
                            Cập nhật tiêu đề và mô tả của bộ đề thi.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <FormField
                            control={editForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                                  Tên Đề Thi
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ví dụ: TOEIC Exam 2026 - Test 1"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5 mt-4">
                                <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                                  Mô tả đề thi
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ví dụ: Đề thi thử kỹ năng đọc Part 5 cấu trúc mới"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="audioUrl"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5 mt-4">
                                <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                                  File Âm Thanh Chung (Audio URL)
                                </FormLabel>
                                <FormControl>
                                  <MediaUploadInput
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    placeholder="Tải lên hoặc dán link Audio (.mp3)"
                                    type="audio"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={editForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5 mt-4">
                                <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                                  Trạng thái
                                </FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Chọn trạng thái" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="draft">
                                      Bản Nháp (Draft)
                                    </SelectItem>
                                    <SelectItem value="public">
                                      Công Khai (Public)
                                    </SelectItem>
                                    <SelectItem value="private">
                                      Riêng Tư (Private)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setEditDialogOpen(false)}
                          >
                            Hủy
                          </Button>
                          <Button
                            type="submit"
                            disabled={updateTestSetMutation.isPending}
                          >
                            {updateTestSetMutation.isPending
                              ? 'Đang lưu...'
                              : 'Lưu thay đổi'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteTestSet}
                  disabled={deleteTestSetMutation.isPending}
                  className="h-8 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>
                    {deleteTestSetMutation.isPending ? 'Đang xóa...' : 'Xóa đề'}
                  </span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-border/40 pt-4 text-sm">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-bold block">
                    Tổng số câu
                  </span>
                  <span className="font-black text-lg text-primary">
                    {questions?.length || 0}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-bold block">
                    Thời gian tạo
                  </span>
                  <span className="font-medium text-foreground flex items-center gap-1.5 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(testSet.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-bold block">
                    ID Đề thi
                  </span>
                  <span
                    className="font-mono text-xs text-muted-foreground block truncate mt-1.5"
                    title={testSet._id}
                  >
                    {testSet._id}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="p-6 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>Không tìm thấy thông tin đề thi này.</span>
          </div>
        )}

        {/* Questions Header */}
        <div className="border-b border-border pb-1 pt-2 mb-1">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <span>Danh Sách Câu Hỏi ({questions?.length || 0})</span>
          </h2>
        </div>

        {loadingQuestions ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div
                key={i}
                className="h-56 bg-secondary/60 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : questions && questions.length > 0 ? (
          <div className="space-y-2">
            {questions.map((q, index) => (
              <Card
                key={q._id}
                className="flex-row justify-between glass-card overflow-hidden group"
              >
                <CardContent className="p-2 space-y-4 flex-1">
                  <div
                    className="flex flex-row items-center justify-between mb-0 cursor-pointer select-none"
                    onClick={() => toggleQuestionExpand(q._id)}
                  >
                    {q.question_text && (
                      <div className="flex items-start gap-2 flex-1 pr-4">
                        <p className="text-sm font-semibold text-foreground leading-relaxed whitespace-pre-wrap">
                          {q.question_number || index}. {q.question_text}
                        </p>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(q.question_text);
                            setCopiedId(q._id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className={`mt-0.5 p-1 shrink-0 rounded-md transition-all cursor-pointer ${
                            copiedId === q._id
                              ? 'text-green-500 bg-green-500/10 opacity-100'
                              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80 opacity-0 group-hover:opacity-100'
                          }`}
                          title="Sao chép nội dung câu hỏi"
                        >
                          {copiedId === q._id ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleOpenEditQuestion(q);
                        }}
                        className="cursor-pointer p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 hover:shadow-sm transition-all"
                        title="Chỉnh sửa câu hỏi"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteQuestion(q._id);
                        }}
                        disabled={deleteQuestionMutation.isPending}
                        className="cursor-pointer p-2 rounded-lg text-destructive hover:bg-destructive/10 hover:shadow-sm transition-all"
                        title="Xóa câu hỏi khỏi đề thi"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {expandedQuestions.has(q._id) && (
                    <>
                      <p className="m-0 text-sm font-medium">Câu trả lời:</p>
                      {q.correct_answer && (
                        <div className="p-3.5 rounded-lg bg-green-200/35 border border-border/30 text-xs text-foreground leading-relaxed">
                          <p className="whitespace-pre-wrap">
                            {q.correct_answer}
                          </p>
                        </div>
                      )}
                      {q.explanation && (
                        <div className="p-3.5 rounded-lg bg-green-200/35 border border-border/30 text-xs text-foreground leading-relaxed">
                          <span className="font-extrabold uppercase text-[10px] tracking-wider text-primary block mb-1">
                            Giải thích chi tiết:
                          </span>
                          <p className="whitespace-pre-wrap">{q.explanation}</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-xl bg-secondary/15 flex flex-col items-center justify-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground/60 mb-3 animate-bounce" />
            <h4 className="font-bold text-lg text-foreground">
              Không có câu hỏi nào
            </h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Đề thi này hiện tại chưa chứa câu hỏi nào. Nhấp nút phía trên để
              bắt đầu thêm câu hỏi mới.
            </p>
          </div>
        )}
      </div>

      {testSet?.testType === 'interview' && (
        <>
          <AddInterviewQuestionDialog
            isOpen={isAddManualOpen}
            onClose={() => setIsAddManualOpen(false)}
            testSetId={id}
            onSuccess={msg => {
              setSuccessMsg(msg);
              setTimeout(() => setSuccessMsg(null), 3000);
            }}
          />

          <ExcelUploadDialog
            isOpen={isAddExcelOpen}
            onClose={() => setIsAddExcelOpen(false)}
            testSetId={id}
            onSuccess={msg => {
              setSuccessMsg(msg);
              setTimeout(() => setSuccessMsg(null), 3000);
            }}
          />
        </>
      )}
    </DashboardLayout>
  );
}
