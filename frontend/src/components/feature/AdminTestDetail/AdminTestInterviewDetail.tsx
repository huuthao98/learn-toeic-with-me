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
import { MediaUploadInput } from '@/components/MediaUploadInput';
import { AddInterviewQuestionDialog } from '@/components/admin/AddInterviewQuestionDialog';
import { ExcelUploadDialog } from '@/components/admin/ExcelUploadDialog';

import { useInterview } from '@/hooks/useInterview';

import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';

// Edit Zod Validation Schema
const editInterviewTopicSchema = z.object({
  name: z.string().trim().min(1, 'Tên đề thi không được để trống'),
  description: z.string(),
  status: z.enum(['draft', 'public', 'private']).optional(),
});

type EditInterviewTopicFormValues = z.infer<typeof editInterviewTopicSchema>;

// Question Zod Validation Schema
const editQuestionSchema = z.object({
  questionText: z.string().trim().min(1, 'Vui lòng nhập câu hỏi'),
  correctAnswer: z.string().trim().min(1, 'Vui lòng nhập câu trả lời'),
  status: z.string().optional(),
  explanation: z.string().optional(),
});

type EditQuestionFormValues = z.infer<typeof editQuestionSchema>;

export const AdminTestInterviewDetail = ({ id }: { id: string }) => {
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
    useUpsertBulkQuestionsMutation,
    useDeleteQuestionMutation,
    useUpdateQuestionMutation,
  } = useInterview();

  const { data: testSet, isLoading: loadingInterviewTopic } = useTestSet(id);
  const { data: questions, isLoading: loadingQuestions } = useTestQuestions(id);
  const deleteQuestionMutation = useDeleteQuestionMutation();
  const updateInterviewTopicMutation = useUpdateTestSetMutation(id);
  const updateQuestionMutation = useUpdateQuestionMutation();
  const upsertQuestionsMutation = useUpsertBulkQuestionsMutation();
  const deleteInterviewTopicMutation = useDeleteTestSetMutation();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [editQuestionDialogOpen, setEditQuestionDialogOpen] = useState(false);
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [isAddExcelOpen, setIsAddExcelOpen] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [isDeleteInterviewTopicOpen, setIsDeleteInterviewTopicOpen] = useState(false);

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
  const editForm = useForm<EditInterviewTopicFormValues>({
    resolver: zodResolver(editInterviewTopicSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'draft',
    },
  });

  // Edit question form hook
  const editQuestionForm = useForm<EditQuestionFormValues>({
    resolver: zodResolver(editQuestionSchema),
    defaultValues: {
      questionText: '',
      correctAnswer: '',
      status: 'active',
      explanation: '',
    },
  });

  // Sync testSet data to form
  useEffect(() => {
    if (testSet) {
      editForm.reset({
        name: testSet.name,
        description: testSet.description || '',
        status: (testSet.status as 'draft' | 'public' | 'private') || 'draft',
      });
    }
  }, [testSet, editForm]);

  const onEditSubmit = (values: EditInterviewTopicFormValues) => {
    updateInterviewTopicMutation.mutate(
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
    editQuestionForm.reset({
      questionText: q.questionText || '',
      correctAnswer: q.correctAnswer || '',
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

  const handleConfirmDeleteInterviewTopic = () => {
    deleteInterviewTopicMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Xóa đề thi thành công!');
        router.push(ROUTES.ADMIN);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Xóa đề thi thất bại.');
        setIsDeleteInterviewTopicOpen(false);
      },
    });
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
              onClick={() => router.push(ROUTES.ADMIN)}
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
        </div>

        {/* Metadata Details Card */}
        {loadingInterviewTopic ? (
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
                            disabled={updateInterviewTopicMutation.isPending}
                          >
                            {updateInterviewTopicMutation.isPending
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
                  onClick={() => setIsDeleteInterviewTopicOpen(true)}
                  disabled={deleteInterviewTopicMutation.isPending}
                  className="h-8 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>
                    {deleteInterviewTopicMutation.isPending ? 'Đang xóa...' : 'Xóa đề'}
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
                    {q.questionText && (
                      <div className="flex items-start gap-2 flex-1 pr-4">
                        <p className="text-sm font-semibold text-foreground leading-relaxed whitespace-pre-wrap">
                          {q.questionNumber || index}. {q.questionText}
                        </p>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(q.questionText);
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
                  {expandedQuestions.has(q._id) && (
                    <>

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

      {/* Edit Question Dialog */}
      <Dialog
        open={editQuestionDialogOpen}
        onOpenChange={setEditQuestionDialogOpen}
      >
        <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-xl">
          <Form {...editQuestionForm}>
            <form
              onSubmit={editQuestionForm.handleSubmit(onEditQuestionSubmit)}
            >
              <DialogHeader>
                <DialogTitle>Chỉnh Sửa Câu Hỏi</DialogTitle>
                <DialogDescription>
                  Cập nhật nội dung câu hỏi và câu trả lời.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <FormField
                  control={editQuestionForm.control}
                  name="questionText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Câu hỏi</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Nội dung câu hỏi phỏng vấn..."
                          className="w-full min-h-[80px] p-3 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editQuestionForm.control}
                  name="correctAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Câu trả lời mẫu</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Câu trả lời gợi ý hoặc barem điểm..."
                          className="w-full min-h-[120px] p-3 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editQuestionForm.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giải thích (Tùy chọn)</FormLabel>
                      <FormControl>
                        <textarea
                          placeholder="Giải thích thêm cho câu trả lời..."
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

      <AddInterviewQuestionDialog
        isOpen={isAddManualOpen}
        onClose={() => setIsAddManualOpen(false)}
        testSetId={id}
        onSuccess={msg => toast.success(msg)}
      />

      <ExcelUploadDialog
        isOpen={isAddExcelOpen}
        onClose={() => setIsAddExcelOpen(false)}
        testSetId={id}
        onSuccess={msg => toast.success(msg)}
      />

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
        isOpen={isDeleteInterviewTopicOpen}
        onClose={() => setIsDeleteInterviewTopicOpen(false)}
        onConfirm={handleConfirmDeleteInterviewTopic}
        title="Xóa Đề Thi"
        description="Bạn có chắc chắn muốn xóa toàn bộ đề thi này? Mọi câu hỏi và kết quả thi liên quan cũng sẽ bị xóa vĩnh viễn!"
        variant="destructive"
        isLoading={deleteInterviewTopicMutation.isPending}
      />
    </DashboardLayout>
  );
};
