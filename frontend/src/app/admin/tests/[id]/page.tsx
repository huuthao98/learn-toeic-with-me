'use client';

import {
  Edit,
  Trash2,
  BookOpen,
  Calendar,
  HelpCircle,
  ArrowLeft,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaUploadInput } from '@/components/MediaUploadInput';

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

  const { useTestSet, useTestQuestions, useUpdateTestSetMutation, useDeleteTestSetMutation } =
    useTests();
  const { useDeleteQuestionMutation, useUpdateQuestionMutation } = useQuestions();

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
      audioUrl: '',
      imageUrl: '',
      passageText: '',
      groupId: '',
    },
  });

  const selectedPart = editQuestionForm.watch('part');

  const generateGroupId = () => {
    editQuestionForm.setValue('groupId', `group_${Date.now()}`);
  };

  // Sync testSet data to form
  useEffect(() => {
    if (testSet) {
      editForm.reset({
        name: testSet.name,
        description: testSet.description || '',
        audioUrl: testSet.audioUrl || '',
        status: (testSet.status as "draft" | "public" | "private") || 'draft',
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
          setErrorMsg(err.response?.data?.message || 'Cập nhật đề thi thất bại.');
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
            ...(values.part !== '2' ? [{ label: 'D', text: values.optionD || '' }] : []),
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
          setErrorMsg(err.response?.data?.message || 'Cập nhật câu hỏi thất bại.');
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

          <Link href={`/admin/create-test?testSetId=${id}`}>
            <Button className="font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Thêm câu hỏi mới</span>
            </Button>
          </Link>
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
          <Card className="glass-card overflow-hidden relative border-primary/25">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-cyan-500" />
            <CardHeader className="pb-4 flex flex-row items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-black text-foreground">
                  {testSet.name}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {testSet.description || 'Đề thi thử TOEIC Reading chuẩn hóa.'}
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
                                  <Input placeholder="Ví dụ: TOEIC Exam 2026 - Test 1" {...field} />
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Chọn trạng thái" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="draft">Bản Nháp (Draft)</SelectItem>
                                    <SelectItem value="public">Công Khai (Public)</SelectItem>
                                    <SelectItem value="private">Riêng Tư (Private)</SelectItem>
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
                          <Button type="submit" disabled={updateTestSetMutation.isPending}>
                            {updateTestSetMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
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
                  <span>{deleteTestSetMutation.isPending ? 'Đang xóa...' : 'Xóa đề'}</span>
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
                    {testSet.total_questions} câu
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-bold block">
                    Số phần (Parts)
                  </span>
                  <span className="font-black text-lg text-teal-600 dark:text-teal-400">
                    {testSet.parts_count} phần
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
        <div className="border-b border-border pb-4 pt-2">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <span>Danh Sách Câu Hỏi ({questions?.length || 0})</span>
          </h2>
        </div>

        {/* Questions Catalog */}
        {loadingQuestions ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-56 bg-secondary/60 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : questions && questions.length > 0 ? (
          <div className="space-y-6">
            {questions.map((q, index) => (
              <Card key={q._id} className="glass-card relative overflow-hidden group">
                <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-primary">Câu {index + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                        Part {q.part}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          q.difficulty === 'easy'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : q.difficulty === 'medium'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditQuestion(q)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 hover:shadow-sm transition-all"
                      title="Chỉnh sửa câu hỏi"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q._id)}
                      disabled={deleteQuestionMutation.isPending}
                      className="p-2 rounded-lg text-destructive hover:bg-destructive/10 hover:shadow-sm transition-all"
                      title="Xóa câu hỏi khỏi đề thi"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Group / Media indicators for Admin review */}
                  {q.group_id && (
                    <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">
                      Nhóm: {q.group_id}
                    </div>
                  )}

                  {q.passage_text && (
                    <div className="text-xs leading-relaxed text-foreground/90 whitespace-pre-line font-serif p-3 bg-secondary/10 border border-border/30 rounded-lg max-h-48 overflow-y-auto">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 bg-primary/10 text-primary rounded w-fit block mb-2">
                        Đoạn văn đọc
                      </span>
                      {q.passage_text}
                    </div>
                  )}

                  {q.audio_url && (
                    <div className="p-2 bg-secondary/10 border border-border/20 rounded-lg flex items-center justify-center">
                      <audio src={q.audio_url} controls className="w-full max-w-md h-8" />
                    </div>
                  )}

                  {q.image_url && (
                    <div className="flex justify-center bg-secondary/5 rounded-lg p-2 border border-border/20">
                      <img
                        src={q.image_url}
                        alt="Question Diagram"
                        className="max-h-40 object-contain rounded"
                      />
                    </div>
                  )}

                  {/* Question Text */}
                  {q.question_text && (
                    <p className="text-sm font-semibold text-foreground leading-relaxed whitespace-pre-wrap">
                      {q.question_text}
                    </p>
                  )}

                  {/* Multiple Choices Grid */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {q.options.map((opt) => {
                      const isCorrect = opt.label === q.correct_answer;
                      return (
                        <div
                          key={opt.label}
                          className={`p-3 rounded-lg border text-sm flex items-center justify-between gap-2 transition-all ${
                            isCorrect
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-300 font-bold'
                              : 'bg-secondary/10 border-border/50 text-muted-foreground'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCorrect
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-secondary text-muted-foreground'
                              }`}
                            >
                              {opt.label}
                            </span>
                            <span>{opt.text}</span>
                          </span>

                          {isCorrect && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Section */}
                  {q.explanation && (
                    <div className="p-3.5 rounded-lg bg-secondary/35 border border-border/30 text-xs text-muted-foreground leading-relaxed">
                      <span className="font-extrabold uppercase text-[10px] tracking-wider text-primary block mb-1">
                        Giải thích chi tiết:
                      </span>
                      <p className="whitespace-pre-wrap">{q.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-xl bg-secondary/15 flex flex-col items-center justify-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground/60 mb-3 animate-bounce" />
            <h4 className="font-bold text-lg text-foreground">Không có câu hỏi nào</h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Đề thi này hiện tại chưa chứa câu hỏi nào. Nhấp nút phía trên để bắt đầu thêm câu hỏi
              mới.
            </p>
          </div>
        )}
      </div>

      <Dialog open={editQuestionDialogOpen} onOpenChange={setEditQuestionDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-5xl bg-background/80 backdrop-blur-md border border-border/40 max-h-[110vh] flex flex-col p-0 overflow-hidden"
        >
          <Form {...editQuestionForm}>
            <form
              onSubmit={editQuestionForm.handleSubmit(onEditQuestionSubmit)}
              className="flex flex-col max-h-[110vh] overflow-hidden"
            >
              <DialogHeader className="px-6 py-4 border-b border-border/40 flex flex-row items-center justify-between gap-4 shrink-0 bg-background/95 backdrop-blur-md">
                <div className="space-y-1">
                  <DialogTitle>Chỉnh Sửa Câu Hỏi</DialogTitle>
                  <DialogDescription>
                    Cập nhật các thuộc tính và đáp án của câu hỏi này.
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditQuestionDialogOpen(false)}
                    className="cursor-pointer"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateQuestionMutation.isPending}
                    className="cursor-pointer"
                  >
                    {updateQuestionMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </div>
              </DialogHeader>
              <div className="space-y-4 p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editQuestionForm.control}
                    name="part"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                          TOEIC Part
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          items={[
                            { value: '1', label: 'Part 1: Photos (Tranh tả cảnh)' },
                            { value: '2', label: 'Part 2: Question-Response (Hỏi & Đáp)' },
                            { value: '3', label: 'Part 3: Conversations (Hội thoại)' },
                            { value: '4', label: 'Part 4: Talks (Bài nói ngắn)' },
                            { value: '5', label: 'Part 5: Incomplete Sentences (Điền câu)' },
                            { value: '6', label: 'Part 6: Text Completion (Điền đoạn văn)' },
                            { value: '7', label: 'Part 7: Reading Comprehension (Đọc hiểu)' },
                          ]}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent alignItemWithTrigger={false}>
                            <SelectItem value="1">Part 1: Photos (Tranh tả cảnh)</SelectItem>
                            <SelectItem value="2">Part 2: Question-Response (Hỏi & Đáp)</SelectItem>
                            <SelectItem value="3">Part 3: Conversations (Hội thoại)</SelectItem>
                            <SelectItem value="4">Part 4: Talks (Bài nói ngắn)</SelectItem>
                            <SelectItem value="5">Part 5: Incomplete Sentences</SelectItem>
                            <SelectItem value="6">Part 6: Text Completion</SelectItem>
                            <SelectItem value="7">Part 7: Reading Comprehension</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editQuestionForm.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                          Độ khó
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          items={[
                            { value: 'easy', label: 'Easy (Dễ)' },
                            { value: 'medium', label: 'Medium (Trung bình)' },
                            { value: 'hard', label: 'Hard (Khó)' },
                          ]}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent alignItemWithTrigger={false}>
                            <SelectItem value="easy">Easy (Dễ)</SelectItem>
                            <SelectItem value="medium">Medium (Trung bình)</SelectItem>
                            <SelectItem value="hard">Hard (Khó)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Conditional Fields based on Part */}
                {['3', '4', '6', '7'].includes(selectedPart) && (
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                    <div className="text-xs font-bold text-primary flex items-center justify-between">
                      <span>THÔNG TIN NHÓM CÂU HỎI (DÙNG CHUNG)</span>
                      <button
                        type="button"
                        onClick={generateGroupId}
                        className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 rounded-md transition-all font-bold uppercase tracking-wider"
                      >
                        Tạo Group ID mới
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={editQuestionForm.control}
                        name="groupId"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5 col-span-2 md:col-span-1">
                            <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                              Group ID (Mã nhóm)
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Mã nhóm dùng chung (ví dụ: group_1)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {(selectedPart === '3' || selectedPart === '4') && (
                        <FormField
                          control={editQuestionForm.control}
                          name="audioUrl"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5 col-span-2 md:col-span-1">
                              <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                                URL âm thanh dùng chung
                              </FormLabel>
                              <FormControl>
                                <MediaUploadInput acceptTypes="audio/*,video/*" placeholder="Ví dụ: audio/conversation1.mp3" {...field} onUploadError={setErrorMsg} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      {(selectedPart === '3' || selectedPart === '4' || selectedPart === '7') && (
                        <FormField
                          control={editQuestionForm.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5 col-span-2 md:col-span-1">
                              <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                                URL hình ảnh dùng chung (Nếu có)
                              </FormLabel>
                              <FormControl>
                                <MediaUploadInput acceptTypes="image/*" placeholder="Ví dụ: images/diagram1.png" {...field} onUploadError={setErrorMsg} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                    {(selectedPart === '6' || selectedPart === '7') && (
                      <FormField
                        control={editQuestionForm.control}
                        name="passageText"
                        render={({ field }) => (
                          <FormItem className="space-y-1.5">
                            <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                              Đoạn văn đọc dùng chung (Passage Text)
                            </FormLabel>
                            <FormControl>
                              <textarea
                                placeholder="Nhập nội dung đoạn văn đọc dùng chung..."
                                className="w-full text-sm p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary h-28 transition-all"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {selectedPart === '1' && (
                  <div className="p-4 rounded-xl border border-border bg-secondary/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editQuestionForm.control}
                      name="audioUrl"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                            URL âm thanh tả cảnh
                          </FormLabel>
                          <FormControl>
                            <MediaUploadInput acceptTypes="audio/*,video/*" placeholder="Ví dụ: audio/part1_q1.mp3" {...field} onUploadError={setErrorMsg} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editQuestionForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                            URL hình ảnh tranh vẽ
                          </FormLabel>
                          <FormControl>
                            <MediaUploadInput acceptTypes="image/*" placeholder="Ví dụ: images/part1_q1.jpg" {...field} onUploadError={setErrorMsg} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {selectedPart === '2' && (
                  <div className="p-4 rounded-xl border border-border bg-secondary/10">
                    <FormField
                      control={editQuestionForm.control}
                      name="audioUrl"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                            URL âm thanh câu hỏi phản hồi
                          </FormLabel>
                          <FormControl>
                            <MediaUploadInput acceptTypes="audio/*,video/*" placeholder="Ví dụ: audio/part2_q1.mp3" {...field} onUploadError={setErrorMsg} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Question Text */}
                <FormField
                  control={editQuestionForm.control}
                  name="questionText"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                        Nội dung câu hỏi (Chứa khoảng trống)
                      </FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Ví dụ: The CEO requested that the marketing department _______ the quarterly report before Friday."
                          className="w-full text-sm p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary h-24 transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Multiple Choices Inputs */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Các đáp án lựa chọn
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={editQuestionForm.control}
                      name="optionA"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <span className="font-bold text-sm text-muted-foreground w-4 shrink-0">
                            A
                          </span>
                          <div className="flex-1">
                            <FormControl>
                              <Input placeholder="Nhập đáp án A" {...field} />
                            </FormControl>
                            <FormMessage className="text-[10px] mt-0.5" />
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editQuestionForm.control}
                      name="optionB"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <span className="font-bold text-sm text-muted-foreground w-4 shrink-0">
                            B
                          </span>
                          <div className="flex-1">
                            <FormControl>
                              <Input placeholder="Nhập đáp án B" {...field} />
                            </FormControl>
                            <FormMessage className="text-[10px] mt-0.5" />
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editQuestionForm.control}
                      name="optionC"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <span className="font-bold text-sm text-muted-foreground w-4 shrink-0">
                            C
                          </span>
                          <div className="flex-1">
                            <FormControl>
                              <Input placeholder="Nhập đáp án C" {...field} />
                            </FormControl>
                            <FormMessage className="text-[10px] mt-0.5" />
                          </div>
                        </FormItem>
                      )}
                    />
                    {selectedPart !== '2' && (
                      <FormField
                        control={editQuestionForm.control}
                        name="optionD"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <span className="font-bold text-sm text-muted-foreground w-4 shrink-0">
                              D
                            </span>
                            <div className="flex-1">
                              <FormControl>
                                <Input placeholder="Nhập đáp án D" {...field} />
                              </FormControl>
                              <FormMessage className="text-[10px] mt-0.5" />
                            </div>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* Correct Answer Selection */}
                <FormField
                  control={editQuestionForm.control}
                  name="correctAnswer"
                  render={({ field }) => (
                    <FormItem className="space-y-2 pt-2">
                      <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase block">
                        Đáp án đúng
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex gap-6"
                        >
                          {['A', 'B', 'C', ...(selectedPart !== '2' ? ['D'] : [])].map((val) => (
                            <div key={val} className="flex items-center gap-2">
                              <RadioGroupItem value={val} id={`edit-correct-${val}`} />
                              <label
                                htmlFor={`edit-correct-${val}`}
                                className="text-sm font-bold cursor-pointer"
                              >
                                {val}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Explanation */}
                <FormField
                  control={editQuestionForm.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                        Giải thích chi tiết (Không bắt buộc)
                      </FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Giải thích ngữ pháp hoặc từ vựng của câu để hỗ trợ học viên tự học..."
                          className="w-full text-sm p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary h-20 transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
