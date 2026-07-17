'use client';

import {
  Play,
  Pause,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Edit,
  Trash2,
  Calendar,
} from 'lucide-react';
import * as z from 'zod';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Document, Page, pdfjs } from 'react-pdf';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { Button } from '@/components/ui/button';
import { useToeic } from '@/hooks/useToeic';


import {
  Dialog,
  DialogTitle,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MediaUploadInput } from '@/components/MediaUploadInput';
import { ConfirmModal } from '@/components/ui/confirm-modal';

// Edit Zod Validation Schema
const editToeicSetSchema = z.object({
  name: z.string().trim().min(1, 'Tên đề thi không được để trống'),
  description: z.string().optional(),
  audioUrl: z.string().optional(),
  readingPdfUrl: z.string().optional(),
  listeningPdfUrl: z.string().optional(),
  status: z.enum(['draft', 'public', 'private']).optional(),
});

type EditToeicSetFormValues = z.infer<typeof editToeicSetSchema>;

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const AdminTestToeicDetail = ({ id }: { id: string }) => {
  const router = useRouter();

  // API hooks
  const {
    useTestSet,
    useTestQuestions,
    useUpdateTestSetMutation,
    useDeleteTestSetMutation,
    useUpsertBulkQuestionsMutation,
  } = useToeic();

  const { data: ToeicSet, isLoading: isTestLoading } = useTestSet(id);
  const { data: questions, isLoading: isQuestionsLoading } =
    useTestQuestions(id);

  const updateToeicSetMutation = useUpdateTestSetMutation(id);
  const deleteToeicSetMutation = useDeleteTestSetMutation();
  const upsertQuestionsMutation = useUpsertBulkQuestionsMutation();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Edit form hook (for test set)
  const editForm = useForm<EditToeicSetFormValues>({
    resolver: zodResolver(editToeicSetSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'draft',
    },
  });

  // Sync ToeicSet data to form
  useEffect(() => {
    if (ToeicSet) {
      editForm.reset({
        name: ToeicSet.name,
        description: ToeicSet.description || '',
        audioUrl: ToeicSet.audioUrl,
        readingPdfUrl: ToeicSet.readingPdfUrl,
        listeningPdfUrl: ToeicSet.listeningPdfUrl,
        status: (ToeicSet.status as 'draft' | 'public' | 'private') || 'draft',
      });
    }
  }, [ToeicSet, editForm]);

  const onEditSubmit = (values: EditToeicSetFormValues) => {
    updateToeicSetMutation.mutate(
      {
        name: values.name,
        description: values.description,
        audioUrl: values.audioUrl,
        readingPdfUrl: values.readingPdfUrl,
        listeningPdfUrl: values.listeningPdfUrl,
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

  const handleAnswerKeyUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async evt => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsName =
        wb.SheetNames.find(n => n.includes('Template')) || wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const data = XLSX.utils.sheet_to_json<any>(ws);

      const questionsToUpsert = data
        .map(row => {
          const getVal = (searchKeys: string[]) => {
            const k = Object.keys(row).find(key =>
              searchKeys.some(sk =>
                key.toLowerCase().includes(sk.toLowerCase()),
              ),
            );
            return k ? row[k] : undefined;
          };

          const qNumRaw = getVal(['Số thứ tự', 'question number']);
          const partRaw = getVal(['part', 'phần']);
          const ansRaw = getVal(['correct answer', 'đáp án đúng']);
          const expRaw = getVal(['explanation', 'giải thích']);

          const qNum = parseInt(String(qNumRaw), 10);
          const part = String(partRaw).trim();

          return {
            questionNumber: qNum,
            part: part,
            correctAnswer: String(ansRaw).toUpperCase().trim(),
            explanation: expRaw || '',
            isActive: true,
          };
        })
        .filter(
          q =>
            !isNaN(q.questionNumber) &&
            q.correctAnswer &&
            q.correctAnswer !== 'UNDEFINED',
        );

      if (questionsToUpsert.length === 0) {
        toast.error('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
        return;
      }

      upsertQuestionsMutation.mutate(
        { testSetId: id, questions: questionsToUpsert },
        {
          onSuccess: () => {
            toast.success(
              `Đã cập nhật đáp án cho ${questionsToUpsert.length} câu hỏi!`,
            );
          },
          onError: (err: any) => {
            toast.error(
              err.response?.data?.message || 'Cập nhật đáp án thất bại.',
            );
          },
        },
      );
    };
    reader.readAsBinaryString(file);
  };

  const handleDeleteToeicSet = () => {
    deleteToeicSetMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Xóa đề thi thành công!');
        setDeleteModalOpen(false);
        router.push(ROUTES.ADMIN);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Xóa đề thi thất bại.');
        setDeleteModalOpen(false);
      },
    });
  };

  const [audioPlaying, setAudioPlaying] = useState(false);

  // PDF Viewer states
  const [activePdf, setActivePdf] = useState<'reading' | 'listening'>(
    'listening',
  );
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [pdfContainerWidth, setPdfContainerWidth] = useState<number>(0);
  const pdfWrapperRef = useRef<HTMLDivElement>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Set default active PDF if one is missing
  useEffect(() => {
    if (ToeicSet) {
      if (!ToeicSet.readingPdfUrl && ToeicSet.listeningPdfUrl) {
        setActivePdf('listening');
      } else if (ToeicSet.readingPdfUrl && !ToeicSet.listeningPdfUrl) {
        setActivePdf('reading');
      }
    }
  }, [ToeicSet]);

  useEffect(() => {
    if (pdfWrapperRef.current) {
      setPdfContainerWidth(pdfWrapperRef.current.clientWidth);
    }
    const handleResize = () => {
      if (pdfWrapperRef.current)
        setPdfContainerWidth(pdfWrapperRef.current.clientWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setAudioPlaying(!audioPlaying);
    }
  };

  if (isTestLoading || isQuestionsLoading) {
    return <div className="p-8 text-center">Đang tải dữ liệu...</div>;
  }

  if (!ToeicSet) {
    return (
      <div className="p-8 text-center text-red-500">Không tìm thấy đề thi.</div>
    );
  }

  // Sort questions just in case
  const sortedQuestions = [...(questions || [])].sort(
    (a, b) => a.questionNumber - b.questionNumber,
  );

  // Group questions by part
  const groupedQuestions = sortedQuestions.reduce(
    (acc, q) => {
      const part = q.part || 'Khác';
      if (!acc[part]) {
        acc[part] = [];
      }
      acc[part].push(q);
      return acc;
    },
    {} as Record<string, typeof sortedQuestions>,
  );

  const sortedParts = Object.keys(groupedQuestions).sort((a, b) =>
    a.localeCompare(b),
  );

  const currentPdfUrl =
    activePdf === 'reading' ? ToeicSet.readingPdfUrl : ToeicSet.listeningPdfUrl;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="w-1/2 border-r bg-slate-200/50 dark:bg-slate-800/50 flex flex-col relative">
        {/* PDF Tabs */}
        {(ToeicSet.readingPdfUrl || ToeicSet.listeningPdfUrl) && (
          <div className="flex justify-between p-2 gap-2 bg-white dark:bg-slate-900 border-b shrink-0 z-10">
            <div className="flex gap-2 items-center">
              {ToeicSet.listeningPdfUrl && (
                <Button
                  variant={activePdf === 'listening' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActivePdf('listening')}
                >
                  Listening PDF
                </Button>
              )}
              {ToeicSet.readingPdfUrl && (
                <Button
                  variant={activePdf === 'reading' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActivePdf('reading')}
                >
                  Reading PDF
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPdfScale(s => Math.max(0.5, s - 0.2))}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <span className="text-xs w-12 text-center">
                {Math.round(pdfScale * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPdfScale(s => Math.min(2.5, s + 0.2))}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-border mx-2" />
              <Button
                variant="outline"
                size="sm"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber(p => p - 1)}
              >
                Prev
              </Button>
              <span className="text-xs">
                Trang {pageNumber} / {numPages || '-'}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pageNumber >= (numPages || 1)}
                onClick={() => setPageNumber(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <div
          className="flex-1 overflow-auto p-4 custom-scrollbar"
          ref={pdfWrapperRef}
        >
          {currentPdfUrl ? (
            <div className="flex justify-center">
              <Document
                file={`/api/proxy-pdf?url=${encodeURIComponent(currentPdfUrl)}`}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="p-4">Đang tải PDF...</div>}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={pdfScale}
                  width={pdfContainerWidth ? pdfContainerWidth - 40 : undefined}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-xl"
                />
              </Document>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Đề thi này không có file PDF
            </div>
          )}
        </div>
      </div>

      <div className="w-1/2 flex flex-col bg-white dark:bg-slate-900">
        {/* Top Header & Metadata Card */}
        <div className="p-4 border-b bg-white dark:bg-slate-900 shrink-0 z-10 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className={'border-primary/25'}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg text-foreground">
              Chi tiết đề thi TOEIC
            </h1>

            {ToeicSet.status === 'public' && (
              <Label className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Công Khai
              </Label>
            )}
            {ToeicSet.status === 'private' && (
              <Label className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                Riêng Tư
              </Label>
            )}
            {(!ToeicSet.status || ToeicSet.status === 'draft') && (
              <Label className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Bản Nháp
              </Label>
            )}
          </div>

          <Card className="glass-card gap-0 overflow-hidden relative border-primary/25">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-cyan-500" />
            <CardHeader className="pb-4 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-foreground">
                  {ToeicSet.name}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  {ToeicSet.description}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {/* Edit Metadata Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground px-2.5 h-8 text-xs font-semibold transition-all duration-200 cursor-pointer">
                    <Edit className="h-3.5 w-3.5" />
                    <span>Chỉnh sửa</span>
                  </DialogTrigger>
                  <DialogContent
                    showCloseButton={false}
                    className="bg-background/80 backdrop-blur-md border-b border-border/40 sm:max-w-2xl "
                  >
                    <Form {...editForm}>
                      <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
                        <DialogHeader className="flex flex-row items-center justify-between">
                          <div>
                            <DialogTitle>
                              Chỉnh Sửa Thông Tin Đề Thi
                            </DialogTitle>
                            <DialogDescription>
                              Cập nhật tiêu đề và mô tả của bộ đề thi.
                            </DialogDescription>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setEditDialogOpen(false)}
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
                        <div className="space-y-4 py-4 h-full overflow-y-auto px-1 custom-scrollbar ">
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
                                  File Âm Thanh Chung (Audio URL) *
                                </FormLabel>
                                <FormControl>
                                  <MediaUploadInput
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    acceptTypes="audio/*"
                                    placeholder="Tải lên hoặc dán link Audio (.mp3)"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={editForm.control}
                            name="listeningPdfUrl"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5 mt-4">
                                <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                                  File PDF Listening (Tùy chọn)
                                </FormLabel>
                                <FormControl>
                                  <MediaUploadInput
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    acceptTypes=".pdf"
                                    allowPdfCompression={true}
                                    placeholder="Tải lên hoặc dán link PDF..."
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={editForm.control}
                            name="readingPdfUrl"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5 mt-4">
                                <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                                  File PDF Đề Thi (Reading/Writing) *
                                </FormLabel>
                                <FormControl>
                                  <MediaUploadInput
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    acceptTypes=".pdf"
                                    allowPdfCompression={true}
                                    placeholder="Tải lên hoặc dán link PDF..."
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-1.5 mt-4 p-4 border border-emerald-500/30 bg-emerald-50/50 rounded-lg">
                            <FormLabel className="text-xs font-semibold text-emerald-700 uppercase flex items-center gap-2">
                              Cập Nhật Đáp Án Bằng Excel
                            </FormLabel>
                            <p className="text-xs text-muted-foreground mb-2">
                              Tải lên file Excel (.xlsx) chứa đáp án mới để ghi
                              đè lên bộ câu hỏi hiện tại.
                            </p>
                            {upsertQuestionsMutation.isPending ? (
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm font-medium text-emerald-600">
                                  Đang cập nhật...
                                </span>
                              </div>
                            ) : (
                              <Input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleAnswerKeyUpload}
                                className="cursor-pointer"
                              />
                            )}
                          </div>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={deleteToeicSetMutation.isPending}
                  className="h-8 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xóa đề</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-border/40 pt-4 text-sm">
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
                    {new Date(ToeicSet.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="space-y-1 flex-1">
                  <span className="text-xs text-muted-foreground uppercase font-bold block">
                    ID Đề thi
                  </span>
                  <span
                    className="font-mono text-xs text-muted-foreground block truncate mt-1.5"
                    title={ToeicSet._id}
                  >
                    {ToeicSet._id}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PDF Controls */}
        <div className="shrink-0 flex gap-2 items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-t border-border/50">
          {ToeicSet.audioUrl && (
            <div className=" w-full flex items-center gap-4 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2">
              <audio
                ref={audioRef}
                src={ToeicSet.audioUrl}
                onEnded={() => setAudioPlaying(false)}
                className="hidden"
              />
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={toggleAudio}
              >
                {audioPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <div className="text-sm font-medium">Listening Audio</div>
              <audio
                controls
                src={ToeicSet.audioUrl}
                className="h-8 w-full ml-2"
              />
            </div>
          )}
        </div>

        {/* Answer Key */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 border-l border-border/50 relative">
          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-0 custom-scrollbar">
            {sortedParts.length === 0 && (
              <div className="text-center text-muted-foreground p-4 mt-4">
                Chưa có dữ liệu đáp án.
              </div>
            )}

            {sortedParts.map(part => (
              <div key={part} className="mb-2 last:mb-0">
                <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10 py-2 border-b mb-3 -mx-4 px-4 shadow-sm">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                    {part === 'Khác' ? 'Phần khác' : `Part ${part}`}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {groupedQuestions[part].map((q: any) => {
                    return (
                      <div
                        key={q._id}
                        className="flex items-center justify-between gap-2 p-2 w-[120px] rounded-lg border bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-center">
                          <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                            Câu {q.questionNumber}
                          </span>
                        </div>

                        <div className="w-7 h-7 flex items-center justify-center rounded-full border text-xs font-bold transition-all bg-emerald-500 border-emerald-500 text-white shadow-sm ring-2 ring-emerald-100 ring-offset-1 dark:ring-emerald-900/50 dark:ring-offset-slate-900">
                          {q.correctAnswer}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteToeicSet}
        title="Xác nhận xóa bộ đề"
        description="Bạn có chắc chắn muốn xóa bộ đề này và tất cả câu hỏi liên quan? Hành động này không thể hoàn tác."
        confirmText="Xóa đề thi"
        cancelText="Hủy"
        variant="destructive"
        isLoading={deleteToeicSetMutation.isPending}
      />
    </div>
  );
};
