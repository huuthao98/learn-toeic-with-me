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
  BookOpen,
  Target,
  Sparkles,
  GraduationCap,
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
import { Badge } from '@/components/ui/badge';

import { useToeic } from '@/hooks/useToeic';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useInterview } from '@/hooks/useInterview';
import { useAuthStore } from '@/store/authStore';
import {
  ROUTES,
  getAdminTestToeicDetailRoute,
  getAdminTestDetailRoute,
  getAdminTestInterviewDetailRoute,
  getAdminDetailPracticeRoute,
} from '@/constants/routes';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { toast } from 'sonner';

// Edit Zod Validation Schema
const editToeicSetSchema = z.object({
  name: z.string().trim().min(1, 'Tên đề thi không được để trống'),
  description: z.string(),
  status: z.enum(['draft', 'public', 'private']).optional(),
  type: z.enum(['practice', 'exam']).optional(),
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
      ...(toeicSets || []).map((set: any) => ({
        ...set,
        category: 'toeic',
      })),
      ...(vocabSets || []).map((set: any) => ({
        ...set,
        category: 'vocabulary',
      })),
      ...(interviewSets || []).map((set: any) => ({
        ...set,
        category: 'interview',
      })),
    ];
  }, [toeicSets, vocabSets, interviewSets]);

  const groupedSets = useMemo(() => {
    const categories: Record<string, any[]> = {
      toeic: [],
      vocabulary: [],
      interview: [],
    };

    allTestSets.forEach(set => {
      const cat = set.category || 'other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(set);
    });

    return categories;
  }, [allTestSets]);

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
      type: 'practice',
    },
  });

  const handleOpenEditModal = (set: any) => {
    setSelectedId(set._id);
    setSelectedType(set.category);
    editForm.reset({
      name: set.name,
      description: set.description || '',
      status: (set.status as 'draft' | 'public' | 'private') || 'draft',
      type: (set.type as 'practice' | 'exam') || 'practice',
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

  const categoryMeta: Record<
    string,
    { title: string; icon: any; color: string; desc: string }
  > = {
    toeic: {
      title: 'Đề Thi TOEIC',
      icon: GraduationCap,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      desc: 'Quản lý bài thi đọc, nghe và cấu trúc TOEIC',
    },
    vocabulary: {
      title: 'Bộ Đề Từ Vựng',
      icon: BookOpen,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      desc: 'Quản lý các bộ từ vựng luyện tập theo chủ đề',
    },
    interview: {
      title: 'Đề Thi Phỏng Vấn (Speaking)',
      icon: Mic,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      desc: 'Quản lý đề thi nói và thu âm trực tiếp',
    },
  };

  return (
    <>
      <div className="space-y-10">
        {/* Title greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/5 via-secondary/10 to-background p-6 rounded-2xl border border-border/40 shadow-xs">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <span className="text-gradient">Cổng Quản Trị Hệ Thống</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Quản lý, chỉnh sửa và khởi tạo bộ đề thi TOEIC, Từ vựng và Phỏng
              vấn.
            </p>
          </div>

          <Button
            onClick={() => setCreateModalOpen(true)}
            size="lg"
            className="font-bold shadow-md shadow-primary/20 hover:shadow-primary/30 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Tạo đề thi mới</span>
          </Button>
        </div>

        {/* Test Sets Overview List */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Layers className="h-5 w-5 text-indigo-500" />
              <span>Danh Sách Bộ Đề Thi ({allTestSets?.length || 0})</span>
            </h2>
          </div>

          {loadingTests ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div
                  key={i}
                  className="h-48 bg-secondary/40 animate-pulse rounded-2xl border border-border/40"
                />
              ))}
            </div>
          ) : allTestSets && allTestSets.length > 0 ? (
            <div className="space-y-10">
              {['toeic', 'vocabulary', 'interview'].map(catKey => {
                const sets = groupedSets[catKey] || [];
                if (sets.length === 0) return null;

                const meta = categoryMeta[catKey] || {
                  title: catKey.toUpperCase(),
                  icon: Layers,
                  color: 'text-primary bg-primary/10 border-primary/20',
                  desc: '',
                };
                const IconComp = meta.icon;

                return (
                  <div key={catKey} className="space-y-4">
                    {/* Category Header */}
                    <div className="flex items-center justify-between border-b border-border/50 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl border ${meta.color}`}>
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-foreground">
                            {meta.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {meta.desc}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="font-bold text-xs px-3 py-1 rounded-full"
                      >
                        {sets.length} bộ đề
                      </Badge>
                    </div>

                    {/* Responsive Grid of Test Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sets.map((set: any) => {
                        return (
                          <div
                            key={set._id}
                            className="group relative flex flex-col bg-card/90 backdrop-blur-md border border-border/50 hover:border-primary/50 rounded-2xl p-5 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                          >
                            {/* Action Buttons (Edit / Delete) */}
                            <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all z-10">
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
                                  setSelectedType(set.category);
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

                            {/* Card Header: Title & Badges */}
                            <div className="flex flex-col gap-2 mb-3 pr-14">
                              <h4
                                className="font-bold text-lg text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors"
                                title={set.name}
                              >
                                {set.name}
                              </h4>

                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                {/* Practice vs Exam Type Badge for TOEIC */}
                                {set.category === 'toeic' && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold shadow-2xs ${
                                      set.type === 'exam'
                                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                    }`}
                                  >
                                    {set.type === 'exam' ? (
                                      <>
                                        <Sparkles className="w-3 h-3" /> Thi thử
                                        (Exam)
                                      </>
                                    ) : (
                                      <>
                                        <Target className="w-3 h-3" /> Luyện tập
                                        (Practice)
                                      </>
                                    )}
                                  </span>
                                )}

                                {/* Status Badge */}
                                <span
                                  className={`px-2.5 py-0.5 rounded-full font-semibold ${
                                    set.status === 'public'
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                      : set.status === 'private'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                        : 'bg-secondary text-secondary-foreground border border-border/40'
                                  }`}
                                >
                                  {set.status === 'public'
                                    ? 'Công khai'
                                    : set.status === 'private'
                                      ? 'Nội bộ'
                                      : 'Nháp'}
                                </span>
                              </div>
                            </div>

                            {/* Description */}
                            <div className="flex-1 mt-1 mb-4">
                              <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] leading-relaxed">
                                {set.description ||
                                  'Không có mô tả chi tiết cho bộ đề thi này.'}
                              </p>
                            </div>

                            {/* Footer: Question Count & Details Button */}
                            <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">
                                  Số câu hỏi
                                </span>
                                <span className="font-extrabold text-sm text-foreground">
                                  {set.totalQuestions || 0} câu
                                </span>
                              </div>

                              <Link
                                href={(() => {
                                  switch (set.category) {
                                    case 'toeic':
                                      if (set.type === 'exam') {
                                        return getAdminTestToeicDetailRoute(
                                          set._id,
                                        );
                                      }
                                      return getAdminDetailPracticeRoute(
                                        set._id,
                                      );
                                    case 'interview':
                                      return getAdminTestInterviewDetailRoute(
                                        set._id,
                                      );
                                    case 'vocabulary':
                                    default:
                                      return getAdminTestDetailRoute(set._id);
                                  }
                                })()}
                                className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs"
                              >
                                <span>Chi tiết</span>
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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

      {/* Delete Confirmation Modal */}
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
          className="bg-background/95 backdrop-blur-md border border-border/40 sm:max-w-2xl"
        >
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
              <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40">
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Chỉnh Sửa Thông Tin Đề Thi
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Cập nhật tiêu đề, chế độ và trạng thái của bộ đề thi.
                  </DialogDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditModalOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
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
                <div className="flex gap-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5 flex-1">
                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                          Tên Đề Thi
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ví dụ: Practice TOEIC 1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Mode select for TOEIC sets */}
                  {selectedType === 'toeic' && (
                    <FormField
                      control={editForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5 w-40">
                          <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                            Chế độ đề
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || 'practice'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn chế độ" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="practice">
                                Luyện tập (Practice)
                              </SelectItem>
                              <SelectItem value="exam">
                                Thi thử (Exam)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5 w-36">
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

            <Link href={''}>
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
