'use client';

import {
  Edit,
  Trash2,
  BookOpen,
  Calendar,
  HelpCircle,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/ui/confirm-modal';

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

import { useVocabulary } from '@/hooks/useVocabulary';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';

// Edit Zod Validation Schema
const editVocabularySetSchema = z.object({
  name: z.string().trim().min(1, 'Tên đề thi không được để trống'),
  description: z.string(),
  status: z.enum(['draft', 'public', 'private']).optional(),
});

type EditVocabularySetFormValues = z.infer<typeof editVocabularySetSchema>;

// Question Zod Validation Schema
const editQuestionSchema = z.object({
  questionText: z.string().trim().min(1, 'Vui lòng nhập từ vựng'),
  pinyin: z.string().optional(),
  optionA: z.string().trim().min(1, 'Vui lòng nhập đáp án A'),
  optionB: z.string().trim().min(1, 'Vui lòng nhập đáp án B'),
  optionC: z.string().trim().min(1, 'Vui lòng nhập đáp án C'),
  optionD: z.string().trim().min(1, 'Vui lòng nhập đáp án D'),
  correctAnswer: z.string().min(1, 'Vui lòng chọn đáp án đúng'),
  status: z.string().optional(),
  explanation: z.string().optional(),
});

type EditQuestionFormValues = z.infer<typeof editQuestionSchema>;

export const AdminTestVocabularyDetail = ({ id }: { id: string }) => {
  const router = useRouter();
  const { user } = useAuthStore();

  // Protect route
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push(ROUTES.DASHBOARD);
    }
  }, [user, router]);

  const {
    useTestSet,
    useTestQuestions,
    useUpdateTestSetMutation,
    useDeleteTestSetMutation,
    useDeleteQuestionMutation,
    useUpdateQuestionMutation,
  } = useVocabulary();

  const { data: testSet, isLoading: loadingTestSet } = useTestSet(id);
  const { data: questions, isLoading: loadingQuestions } = useTestQuestions(id);
  const deleteQuestionMutation = useDeleteQuestionMutation();
  const updateTestSetMutation = useUpdateTestSetMutation(id);
  const updateQuestionMutation = useUpdateQuestionMutation();
  const deleteTestSetMutation = useDeleteTestSetMutation();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [editQuestionDialogOpen, setEditQuestionDialogOpen] = useState(false);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [isDeleteTestSetOpen, setIsDeleteTestSetOpen] = useState(false);

  const editForm = useForm<EditVocabularySetFormValues>({
    resolver: zodResolver(editVocabularySetSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'draft',
    },
  });

  const editQuestionForm = useForm<EditQuestionFormValues>({
    resolver: zodResolver(editQuestionSchema),
    defaultValues: {
      questionText: '',
      pinyin: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      status: 'active',
      explanation: '',
    },
  });

  useEffect(() => {
    if (testSet) {
      editForm.reset({
        name: testSet.name,
        description: testSet.description || '',
        status: (testSet.status as 'draft' | 'public' | 'private') || 'draft',
      });
    }
  }, [testSet, editForm]);

  const onEditSubmit = (values: EditVocabularySetFormValues) => {
    updateTestSetMutation.mutate(
      {
        name: values.name,
        description: values.description,
        status: values.status,
      },
      {
        onSuccess: () => {
          toast.success('Cập nhật thông tin đề thi thành công!');
          setEditDialogOpen(false);
        },
        onError: (err: any) => {
          toast.error(
            err.response?.data?.message || 'Cập nhật đề thi thất bại.',
          );
        },
      },
    );
  };

  const handleOpenEditQuestion = (q: any) => {
    setEditingQuestion(q);
    const optionsMap =
      q.options?.reduce((acc: any, curr: any) => {
        acc[curr.label] = curr.text;
        return acc;
      }, {}) || {};

    editQuestionForm.reset({
      questionText: q.questionText || '',
      pinyin: q.pinyin || '',
      optionA: optionsMap['A'] || '',
      optionB: optionsMap['B'] || '',
      optionC: optionsMap['C'] || '',
      optionD: optionsMap['D'] || '',
      correctAnswer: (q.correctAnswer as any) || 'A',
      status: q.status || 'active',
      explanation: q.explanation || '',
    });
    setEditQuestionDialogOpen(true);
  };

  const onEditQuestionSubmit = (values: EditQuestionFormValues) => {
    if (!editingQuestion) return;

    updateQuestionMutation.mutate(
      {
        id: editingQuestion._id,
        data: {
          questionText: values.questionText || '',
          pinyin: values.pinyin || '',
          correctAnswer: values.correctAnswer,
          options: [
            { label: 'A', text: values.optionA },
            { label: 'B', text: values.optionB },
            { label: 'C', text: values.optionC },
            { label: 'D', text: values.optionD },
          ],
          isActive: values.status === 'active',
          explanation: values.explanation || '',
        },
      },
      {
        onSuccess: () => {
          toast.success('Cập nhật câu hỏi thành công!');
          setEditQuestionDialogOpen(false);
          setEditingQuestion(null);
        },
        onError: (err: any) => {
          toast.error(
            err.response?.data?.message || 'Cập nhật câu hỏi thất bại.',
          );
        },
      },
    );
  };

  const handleConfirmDeleteQuestion = () => {
    if (!deleteQuestionId) return;
    deleteQuestionMutation.mutate(deleteQuestionId, {
      onSuccess: () => {
        toast.success('Xóa câu hỏi thành công!');
        setDeleteQuestionId(null);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Xóa câu hỏi thất bại.');
        setDeleteQuestionId(null);
      },
    });
  };

  const handleConfirmDeleteTestSet = () => {
    deleteTestSetMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Xóa đề thi thành công!');
        router.push(ROUTES.ADMIN);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Xóa đề thi thất bại.');
        setIsDeleteTestSetOpen(false);
      },
    });
  };

  if (user && user.role !== 'admin') {
    return null;
  }

  return (
    <>
      <div className="space-y-8 animate-fade-in">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(ROUTES.ADMIN)}
              className="p-2 rounded-lg bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
              title="Quay lại"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-gradient">Chi Tiết Đề Từ Vựng</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Xem cấu trúc đề thi, danh sách câu hỏi và quản lý nội dung.
              </p>
            </div>
          </div>
        </div>

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
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-semibold gap-1.5"
                      />
                    }
                  >
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
                                    placeholder="Ví dụ: Vocabulary Test 1"
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
                                    placeholder="Ví dụ: Đề thi thử từ vựng cơ bản"
                                    {...field}
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
                                  value={field.value}
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
                  onClick={() => setIsDeleteTestSetOpen(true)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map((q, index) => (
              <Card key={q._id} className="glass-card overflow-hidden group">
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-row items-center justify-between mb-0">
                    <div className="flex items-start gap-2 flex-1 pr-4">
                      <div>
                        <p className="text-lg font-bold text-foreground leading-relaxed whitespace-pre-wrap">
                          {q.questionNumber || index + 1}. {q.questionText}
                        </p>
                        {q.pinyin && (
                          <p className="text-sm text-muted-foreground">
                            {q.pinyin}
                          </p>
                        )}
                      </div>
                    </div>
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
                          setDeleteQuestionId(q._id);
                        }}
                        disabled={deleteQuestionMutation.isPending}
                        className="cursor-pointer p-2 rounded-lg text-destructive hover:bg-destructive/10 hover:shadow-sm transition-all"
                        title="Xóa câu hỏi khỏi đề thi"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {q.options?.map((opt: any) => (
                      <div
                        key={opt.label}
                        className={`p-2 rounded-md border text-sm ${opt.label === q.correctAnswer ? 'bg-emerald-500/10 border-emerald-500/30 font-semibold text-emerald-700 dark:text-emerald-400' : 'bg-secondary/30 border-border/50 text-foreground'}`}
                      >
                        <span className="font-bold mr-2">{opt.label}.</span>
                        {opt.text}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-foreground leading-relaxed">
                      <span className="font-extrabold uppercase text-[10px] tracking-wider text-blue-600 block mb-1">
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
            <h4 className="font-bold text-lg text-foreground">
              Không có câu hỏi nào
            </h4>
          </div>
        )}
      </div>

      {/* Edit Question Dialog */}
      <Dialog
        open={editQuestionDialogOpen}
        onOpenChange={setEditQuestionDialogOpen}
      >
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-xl">
          <Form {...editQuestionForm}>
            <form
              onSubmit={editQuestionForm.handleSubmit(onEditQuestionSubmit)}
            >
              <DialogHeader>
                <DialogTitle>Chỉnh Sửa Câu Hỏi</DialogTitle>
                <DialogDescription>
                  Cập nhật nội dung từ vựng và các đáp án.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editQuestionForm.control}
                    name="questionText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Từ vựng (Question)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ví dụ: 儿子" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editQuestionForm.control}
                    name="pinyin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pinyin (Tùy chọn)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ví dụ: ér zi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={editQuestionForm.control}
                    name="optionA"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Đáp án A</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập đáp án A..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editQuestionForm.control}
                    name="optionB"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Đáp án B</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập đáp án B..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editQuestionForm.control}
                    name="optionC"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Đáp án C</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập đáp án C..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editQuestionForm.control}
                    name="optionD"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Đáp án D</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập đáp án D..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editQuestionForm.control}
                  name="correctAnswer"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Đáp án đúng</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn đáp án đúng" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">Đáp án A</SelectItem>
                          <SelectItem value="B">Đáp án B</SelectItem>
                          <SelectItem value="C">Đáp án C</SelectItem>
                          <SelectItem value="D">Đáp án D</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editQuestionForm.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Giải thích (Tùy chọn)</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Giải thích thêm cho từ vựng..."
                          className="w-full min-h-[80px] p-3 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditQuestionDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={updateQuestionMutation.isPending}
                >
                  {updateQuestionMutation.isPending
                    ? 'Đang lưu...'
                    : 'Lưu thay đổi'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={!!deleteQuestionId}
        onClose={() => setDeleteQuestionId(null)}
        onConfirm={handleConfirmDeleteQuestion}
        title="Xóa Câu Hỏi"
        description="Bạn có chắc chắn muốn xóa câu hỏi này khỏi đề thi? Hành động này không thể hoàn tác."
        variant="destructive"
        isLoading={deleteQuestionMutation.isPending}
      />

      <ConfirmModal
        isOpen={isDeleteTestSetOpen}
        onClose={() => setIsDeleteTestSetOpen(false)}
        onConfirm={handleConfirmDeleteTestSet}
        title="Xóa Đề Thi"
        description="Bạn có chắc chắn muốn xóa toàn bộ đề thi này? Mọi câu hỏi và kết quả thi liên quan cũng sẽ bị xóa vĩnh viễn!"
        variant="destructive"
        isLoading={deleteTestSetMutation.isPending}
      />
    </>
  );
};
