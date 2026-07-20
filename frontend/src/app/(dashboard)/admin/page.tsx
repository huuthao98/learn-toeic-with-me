'use client';

import {
  Mic,
  Edit,
  Trash2,
  Layers,
  FileText,
  PlusCircle,
  ShieldCheck,
  ExternalLink,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { Button } from '@/components/ui/button';

import { useToeic } from '@/hooks/useToeic';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useInterview } from '@/hooks/useInterview';
import { useAuthStore } from '@/store/authStore';
import {
  ROUTES,
  getAdminTestToeicDetailRoute,
  getAdminTestDetailRoute,
  getAdminTestInterviewDetailRoute,
} from '@/constants/routes';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { toast } from 'sonner';

// Edit Zod Validation Schema
const editToeicSetSchema = z.object({
  name: z.string().trim().min(1, 'Tên đề thi không được để trống'),
  description: z.string(),
  status: z.enum(['draft', 'public', 'private']).optional(),
});

type EditToeicSetFormValues = z.infer<typeof editToeicSetSchema>;

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Protect page
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push(ROUTES.DASHBOARD);
    }
  }, [user, router]);

  const {
    useTestSets: useToeicSets,
    useDeleteTestSetMutation: useDeleteToeic,
    useUpdateTestSetMutation: useUpdateToeic,
  } = useToeic();
  const {
    useTestSets: useVocabSets,
    useDeleteTestSetMutation: useDeleteVocab,
    useUpdateTestSetMutation: useUpdateVocab,
  } = useVocabulary();
  const {
    useTestSets: useInterviewSets,
    useDeleteTestSetMutation: useDeleteInterview,
    useUpdateTestSetMutation: useUpdateInterview,
  } = useInterview();

  const { data: toeicSets, isLoading: loadingToeic } = useToeicSets();
  const { data: vocabSets, isLoading: loadingVocab } = useVocabSets();
  const { data: interviewSets, isLoading: loadingInterviewSets } =
    useInterviewSets();

  const loadingTests = loadingToeic || loadingVocab || loadingInterviewSets;

  const allTestSets = useMemo(() => {
    return [
      ...(toeicSets || []).map((set: any) => ({ ...set, type: 'toeic' })),
      ...(vocabSets || []).map((set: any) => ({ ...set, type: 'vocabulary' })),
      ...(interviewSets || []).map((set: any) => ({
        ...set,
        type: 'interview',
      })),
    ];
  }, [toeicSets, vocabSets, interviewSets]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<
    'toeic' | 'vocabulary' | 'interview' | null
  >(null);

  const updateToeicSetMutation = useUpdateToeic(selectedId || '');
  const updateVocabSetMutation = useUpdateVocab(selectedId || '');
  const updateInterviewSetMutation = useUpdateInterview(selectedId || '');

  const deleteToeicSetMutation = useDeleteToeic();
  const deleteVocabSetMutation = useDeleteVocab();
  const deleteInterviewSetMutation = useDeleteInterview();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const editForm = useForm<EditToeicSetFormValues>({
    resolver: zodResolver(editToeicSetSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'draft',
    },
  });

  const handleOpenEditModal = (set: any) => {
    setSelectedId(set._id);
    setSelectedType(set.type);
    editForm.reset({
      name: set.name,
      description: set.description || '',
      status: (set.status as 'draft' | 'public' | 'private') || 'draft',
    });
    setEditModalOpen(true);
  };

  const onEditSubmit = (values: EditToeicSetFormValues) => {
    const onSuccess = () => {
      toast.success('Cập nhật đề thi thành công!');
      setEditModalOpen(false);
    };
    const onError = (err: any) => {
      toast.error(err.response?.data?.message || 'Cập nhật đề thi thất bại.');
    };

    if (selectedType === 'toeic')
      updateToeicSetMutation.mutate(values, { onSuccess, onError });
    else if (selectedType === 'vocabulary')
      updateVocabSetMutation.mutate(values, { onSuccess, onError });
    else if (selectedType === 'interview')
      updateInterviewSetMutation.mutate(values, { onSuccess, onError });
  };

  const handleDeleteTestSet = (id: string) => {
    if (!selectedType) return;
    const onSuccess = () => {
      toast.success('Xóa đề thi thành công!');
      setDeleteModalOpen(false);
    };
    const onError = (err: any) => {
      toast.error(err.response?.data?.message || 'Xóa đề thi thất bại.');
      setDeleteModalOpen(false);
    };

    if (selectedType === 'toeic')
      deleteToeicSetMutation.mutate(id, { onSuccess, onError });
    else if (selectedType === 'vocabulary')
      deleteVocabSetMutation.mutate(id, { onSuccess, onError });
    else if (selectedType === 'interview')
      deleteInterviewSetMutation.mutate(id, { onSuccess, onError });
  };

  if (user && user.role !== 'admin') {
    return null;
  }

  return (
    <>
      <div className="space-y-8">
        {/* Title greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
              <span className="text-gradient">Cổng Quản Trị</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý danh sách các đề thi thử.
            </p>
          </div>

          <Button
            onClick={() => setCreateModalOpen(true)}
            className="font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tạo đề thi mới</span>
          </Button>
        </div>

        {/* Test Sets Grid Layout */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Layers className="h-5 w-5 text-indigo-500" />
              <span>Danh Sách Bộ Đề Thi ({allTestSets?.length || 0})</span>
            </h2>
          </div>

          {loadingTests ? (
            <div className="flex flex-wrap gap-8 items-start">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="flex-1 min-w-[320px] flex flex-col gap-4"
                >
                  <div className="h-8 bg-secondary/60 animate-pulse rounded w-1/3" />
                  <div className="h-44 bg-secondary/60 animate-pulse rounded-2xl" />
                </div>
              ))}
            </div>
          ) : allTestSets && allTestSets.length > 0 ? (
            <div className="flex flex-wrap gap-8 items-start">
              {(() => {
                const groupedSets = allTestSets.reduce(
                  (acc, set) => {
                    const type = set.type || 'other';
                    if (!acc[type]) acc[type] = [];
                    acc[type].push(set);
                    return acc;
                  },
                  {} as Record<string, typeof allTestSets>,
                );

                const testTypes = Object.keys(groupedSets).sort();

                return testTypes.map(type => (
                  <div
                    key={type}
                    className="flex-1 min-w-[400px] max-w-[500px] flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                      <h3 className="font-bold text-base uppercase text-muted-foreground tracking-wider">
                        {type === 'other' ? 'Khác' : type}
                      </h3>
                      <span className="bg-secondary/50 text-secondary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                        {groupedSets[type].length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-4">
                      {groupedSets[type].map((set: any) => (
                        <div
                          key={set._id}
                          className="group relative flex flex-col glass-card border border-border/40 hover:border-indigo-400/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEditModal(set)}
                              className="p-2 text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-full transition-colors cursor-pointer"
                              title="Chỉnh sửa đề thi"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedId(set._id);
                                setSelectedType(set.type);
                                setDeleteModalOpen(true);
                              }}
                              disabled={
                                deleteToeicSetMutation.isPending ||
                                deleteVocabSetMutation.isPending ||
                                deleteInterviewSetMutation.isPending
                              }
                              className="p-2 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-full transition-colors cursor-pointer"
                              title="Xóa đề thi"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-500/20">
                              <Layers className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0 pr-8">
                              <h3
                                className="font-bold text-base truncate text-foreground leading-tight mb-1"
                                title={set.name}
                              >
                                {set.name}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-semibold ${
                                    set.status === 'public'
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                      : set.status === 'private'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                        : 'bg-secondary text-secondary-foreground'
                                  }`}
                                >
                                  {set.status === 'public'
                                    ? 'Công khai'
                                    : set.status === 'private'
                                      ? 'Nội bộ'
                                      : 'Nháp'}
                                </span>
                                <span>•</span>
                                <span>
                                  {new Date(set.createdAt).toLocaleDateString(
                                    'vi-VN',
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 mt-2">
                            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                              {set.description ||
                                'Không có mô tả cho đề thi này.'}
                            </p>
                          </div>

                          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">
                                Số Câu Hỏi
                              </span>
                              <span className="font-bold text-sm text-foreground">
                                {set.totalQuestions} câu
                              </span>
                            </div>
                            <Link
                              href={(() => {
                                switch (set.type) {
                                  case 'toeic':
                                    return getAdminTestToeicDetailRoute(set._id);
                                  case 'interview':
                                    return getAdminTestInterviewDetailRoute(set._id);
                                  case 'vocabulary':
                                  default:
                                    return getAdminTestDetailRoute(set._id);
                                }
                              })()}
                              className="text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                            >
                              <span>Chi tiết</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-secondary/15 flex flex-col items-center justify-center">
              <Layers className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h5 className="font-semibold text-lg text-foreground">
                Chưa có đề thi nào
              </h5>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Hiện tại hệ thống chưa có bài kiểm tra nào. Bấm vào nút "Tạo đề
                thi mới" để bắt đầu xây dựng nội dung.
              </p>
              <Link
                href="#"
                onClick={e => {
                  e.preventDefault();
                  setCreateModalOpen(true);
                }}
                className="mt-6"
              >
                <Button className="font-medium">
                  <PlusCircle className="h-4 w-4 mr-2" /> Bắt đầu tạo
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => handleDeleteTestSet(selectedId!)}
        title="Xác nhận xóa bộ đề"
        description="Bạn có chắc chắn muốn xóa bộ đề này và tất cả câu hỏi liên quan? Hành động này không thể hoàn tác."
        confirmText="Xóa đề thi"
        cancelText="Hủy"
        variant="destructive"
        isLoading={
          deleteToeicSetMutation.isPending ||
          deleteVocabSetMutation.isPending ||
          deleteInterviewSetMutation.isPending
        }
      />

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent
          showCloseButton={false}
          className="bg-background/80 backdrop-blur-md border-b border-border/40 sm:max-w-2xl"
        >
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
              <DialogHeader className="flex flex-row items-center justify-between">
                <div>
                  <DialogTitle>Chỉnh Sửa Thông Tin Đề Thi</DialogTitle>
                  <DialogDescription>
                    Cập nhật tiêu đề, trạng thái và mô tả của bộ đề thi.
                  </DialogDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      updateToeicSetMutation.isPending ||
                      !editForm.formState.isDirty
                    }
                  >
                    {updateToeicSetMutation.isPending
                      ? 'Đang lưu...'
                      : 'Lưu thay đổi'}
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4 px-1">
                <div className="flex gap-6">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5 w-full">
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
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5 w-[25%]">
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
                            <SelectItem value="draft">Bản Nháp</SelectItem>
                            <SelectItem value="public">Công Khai</SelectItem>
                            <SelectItem value="private">Riêng Tư</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-foreground">
              Chọn Loại Đề Thi Cần Tạo
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Vui lòng chọn một trong các định dạng đề thi dưới đây để bắt đầu
              biên soạn.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Link
              href={ROUTES.ADMIN_CREATE_TEST_V2}
              onClick={() => setCreateModalOpen(false)}
            >
              <div className="flex items-start gap-4 p-5 rounded-xl border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                <div className="p-3.5 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                  <FileSpreadsheet className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    Đề thi TOEIC nâng cao (Tạo bằng Excel)
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Được khuyến nghị. Hỗ trợ tải lên đáp án hàng loạt bằng
                    Excel, phân nhóm câu hỏi theo Part, tích hợp Audio chung và
                    chia đôi màn hình xem file PDF song song cực kỳ tiện lợi.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              // href={ROUTES.ADMIN_CREATE_TEST} onClick={() => setCreateModalOpen(false)}
              href={''}
            >
              <div className="disabled flex items-start gap-4 p-5 rounded-xl border-2 border-border/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer group">
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Đề thi Trắc nghiệm Cơ bản
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Giao diện truyền thống để tạo đề thi trắc nghiệm. Nhập tay
                    từng câu hỏi và đáp án trực tiếp trên trình duyệt. Thích hợp
                    cho các bài kiểm tra ngắn hoặc ôn tập nhanh.
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href={ROUTES.ADMIN_CREATE_INTERVIEW_TEST}
              onClick={() => setCreateModalOpen(false)}
            >
              <div className="flex items-start gap-4 p-5 rounded-xl border-2 border-border/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer group">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm">
                  <Mic className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Đề thi Phỏng vấn / Speaking
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Đề thi chuyên biệt luyện kỹ năng Nói. Hỗ trợ câu hỏi bằng
                    văn bản kết hợp Audio. Người dùng sẽ trả lời bằng cách thu
                    âm giọng nói trực tiếp qua Microphone.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
