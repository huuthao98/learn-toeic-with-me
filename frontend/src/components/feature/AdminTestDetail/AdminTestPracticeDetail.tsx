'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  Edit,
  Trash2,
  Upload,
  CheckCircle,
  Volume2,
  Search,
  Target,
  Sparkles,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { useToeic, ToeicQuestion } from '@/hooks/useToeic';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { ROUTES } from '@/constants/routes';

// Edit Test Set Zod Schema
const editToeicSetSchema = z.object({
  name: z.string().trim().min(1, 'Tên đề thi không được để trống'),
  description: z.string().optional(),
  status: z.enum(['draft', 'public', 'private']).optional(),
  type: z.enum(['practice', 'exam']).optional(),
});

type EditToeicSetFormValues = z.infer<typeof editToeicSetSchema>;

// Edit Question Zod Schema (passageContext edited separately on card)
const editQuestionSchema = z.object({
  questionNumber: z.coerce.number().min(1, 'Số câu hỏi phải lớn hơn 0'),
  part: z.string().min(1, 'Part không được để trống'),
  questionText: z.string().optional(),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().optional(),
  blankPosition: z.string().optional(),
  optionA: z.string().optional(),
  optionB: z.string().optional(),
  optionC: z.string().optional(),
  optionD: z.string().optional(),
});

type EditQuestionFormValues = z.infer<typeof editQuestionSchema>;

interface AdminTestPracticeDetailProps {
  id: string;
}

export function AdminTestPracticeDetail({ id }: AdminTestPracticeDetailProps) {
  const router = useRouter();

  const {
    useTestSet,
    useTestQuestions,
    useUpdateTestSetMutation,
    useDeleteTestSetMutation,
    useUpsertBulkQuestionsMutation,
    useUpdateQuestionMutation,
    useDeleteQuestionMutation,
  } = useToeic();

  const { data: testSet, isLoading: isTestLoading } = useTestSet(id);
  const { data: questions, isLoading: isQuestionsLoading } = useTestQuestions(id);

  const updateToeicSetMutation = useUpdateTestSetMutation(id);
  const deleteToeicSetMutation = useDeleteTestSetMutation();
  const upsertQuestionsMutation = useUpsertBulkQuestionsMutation();
  const updateQuestionMutation = useUpdateQuestionMutation(id);
  const deleteQuestionMutation = useDeleteQuestionMutation(id);

  // Test set edit / delete modals
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Single question edit / delete modals
  const [editingQuestion, setEditingQuestion] = useState<ToeicQuestion | null>(null);
  const [isEditQuestionModalOpen, setIsEditQuestionModalOpen] = useState(false);

  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [isDeleteQuestionModalOpen, setIsDeleteQuestionModalOpen] = useState(false);

  // Separate edit modal for Passage Context (edit directly from card)
  const [editingPassageQuestion, setEditingPassageQuestion] = useState<ToeicQuestion | null>(null);
  const [editingPassageText, setEditingPassageText] = useState<string>('');
  const [isEditPassageModalOpen, setIsEditPassageModalOpen] = useState(false);

  const [selectedPart, setSelectedPart] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form for test set editing
  const editForm = useForm<EditToeicSetFormValues>({
    resolver: zodResolver(editToeicSetSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'draft',
      type: 'practice',
    },
  });
  console.log(editingPassageQuestion);
  // Form for single question editing
  const questionForm = useForm<EditQuestionFormValues>({
    resolver: zodResolver(editQuestionSchema) as any,
    defaultValues: {
      questionNumber: 1,
      part: '5',
      questionText: '',
      correctAnswer: 'A',
      explanation: '',
      blankPosition: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
    },
  });

  const handleOpenEditDialog = () => {
    if (testSet) {
      editForm.reset({
        name: testSet.name,
        description: testSet.description || '',
        status: (testSet.status as 'draft' | 'public' | 'private') || 'draft',
        type: (testSet.type as 'practice' | 'exam') || 'practice',
      });
      setEditDialogOpen(true);
    }
  };

  const onEditSubmit = (values: EditToeicSetFormValues) => {
    updateToeicSetMutation.mutate(
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
          toast.error(err.response?.data?.message || 'Cập nhật đề thi thất bại.');
        },
      },
    );
  };

  const handleDeleteTestSet = () => {
    deleteToeicSetMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Xóa đề thi thành công!');
        router.push(ROUTES.ADMIN);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Xóa đề thi thất bại.');
        setDeleteModalOpen(false);
      },
    });
  };

  // Open Edit Single Question Dialog
  const handleOpenEditQuestion = (q: ToeicQuestion) => {
    setEditingQuestion(q);
    const getOptText = (lbl: string) => q.options?.find(o => o.label === lbl)?.text || '';

    questionForm.reset({
      questionNumber: q.questionNumber,
      part: q.part || '5',
      questionText: q.questionText || '',
      correctAnswer: (q.correctAnswer as 'A' | 'B' | 'C' | 'D') || 'A',
      explanation: q.explanation || '',
      blankPosition: q.blankPosition || '',
      optionA: getOptText('A'),
      optionB: getOptText('B'),
      optionC: getOptText('C'),
      optionD: getOptText('D'),
    });
    setIsEditQuestionModalOpen(true);
  };

  // Submit Single Question Edit
  const onQuestionFormSubmit = async (values: EditQuestionFormValues) => {
    if (!editingQuestion) return;

    const options = [
      { label: 'A', text: values.optionA || '' },
      { label: 'B', text: values.optionB || '' },
      { label: 'C', text: values.optionC || '' },
      { label: 'D', text: values.optionD || '' },
    ];

    try {
      await updateQuestionMutation.mutateAsync({
        questionId: editingQuestion._id,
        data: {
          questionNumber: values.questionNumber,
          part: values.part,
          questionText: values.questionText,
          correctAnswer: values.correctAnswer,
          explanation: values.explanation,
          blankPosition: values.blankPosition,
          options,
        },
      });

      toast.success(`Đã cập nhật câu ${values.questionNumber} thành công!`);
      setIsEditQuestionModalOpen(false);
      setEditingQuestion(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi cập nhật câu hỏi.');
    }
  };

  // Delete Single Question
  const handleDeleteSingleQuestion = async () => {
    if (!deletingQuestionId) return;

    try {
      await deleteQuestionMutation.mutateAsync(deletingQuestionId);
      toast.success('Đã xóa câu hỏi thành công!');
      setIsDeleteQuestionModalOpen(false);
      setDeletingQuestionId(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Xóa câu hỏi thất bại.');
    }
  };

  // Open Edit Passage Context directly from Card
  const handleOpenEditPassage = (q: ToeicQuestion) => {
    setEditingPassageQuestion(q);
    setEditingPassageText(q.passageContext || '');
    setIsEditPassageModalOpen(true);
  };

  // Submit Edit Passage Context (Updates passageContext directly for the selected question)
  const handleSavePassage = async () => {
    if (!editingPassageQuestion) return;

    try {
      await updateQuestionMutation.mutateAsync({
        questionId: editingPassageQuestion._id,
        data: { passageContext: editingPassageText },
      });

      toast.success('Đã cập nhật bài đọc thành công!');
      setIsEditPassageModalOpen(false);
      setEditingPassageQuestion(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Cập nhật bài đọc thất bại.');
    }
  };

  // Upload JSON file directly (e.g. test1 copy.json)
  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const questionsArray: any[] = Array.isArray(data) ? data : data.questions || [];

      if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
        toast.error('File JSON không hợp lệ hoặc không có câu hỏi nào.');
        return;
      }

      await upsertQuestionsMutation.mutateAsync({
        testSetId: id,
        questions: questionsArray,
      });

      toast.success(`Đã cập nhật thành công ${questionsArray.length} câu hỏi!`);
    } catch (err: any) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi đọc hoặc tải dữ liệu từ file JSON.');
    }
  };

  // Helper to compute question number range for a passage set based on setId or passageContext
  const getQuestionNumbersForSet = (q: ToeicQuestion, allQuestions?: ToeicQuestion[]) => {
    if (!allQuestions || allQuestions.length === 0) return `${q.questionNumber}`;

    let setQuestions: ToeicQuestion[] = [];
    if (q.setId) {
      setQuestions = allQuestions.filter(item => item.setId === q.setId);
    } else if (q.passageContext) {
      setQuestions = allQuestions.filter(item => item.passageContext === q.passageContext);
    }

    if (setQuestions.length === 0) setQuestions = [q];

    const nums = setQuestions.map(item => item.questionNumber).sort((a, b) => a - b);
    if (nums.length === 1) return `${nums[0]}`;
    const minNum = nums[0];
    const maxNum = nums[nums.length - 1];
    return `${minNum} - ${maxNum}`;
  };

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    if (!questions) return [];

    let list = [...questions].sort((a, b) => a.questionNumber - b.questionNumber);

    if (selectedPart !== 'all') {
      list = list.filter(q => q.part === selectedPart);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        q =>
          q.questionText?.toLowerCase().includes(query) ||
          q.explanation?.toLowerCase().includes(query) ||
          q.passageContext?.toLowerCase().includes(query) ||
          q.questionNumber.toString().includes(query),
      );
    }

    return list;
  }, [questions, selectedPart, searchQuery]);

  // Group questions by Part for stats
  const partStats = useMemo(() => {
    if (!questions) return {};
    const stats: Record<string, number> = {};
    questions.forEach(q => {
      stats[q.part] = (stats[q.part] || 0) + 1;
    });
    return stats;
  }, [questions]);

  // Render Part 6 blanks helper
  const renderPassageWithBlanks = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[\d+\])/g);
    return (
      <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-serif bg-secondary/20 p-4 rounded-xl border border-border/50 shadow-inner">
        {parts.map((part, idx) => {
          if (part.match(/^\[\d+\]$/)) {
            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1 mx-1.5 align-baseline font-bold"
              >
                <span className="text-muted-foreground/80 font-mono tracking-tighter">____</span>
                <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-md shadow-2xs border border-primary/30 text-xs">
                  {part}
                </span>
              </span>
            );
          }
          return (
            <span
              key={part + idx}
              className="[&_strong]:font-bold [&_b]:font-bold"
              dangerouslySetInnerHTML={{ __html: part }}
            />
          );
        })}
      </div>
    );
  };

  if (isTestLoading || isQuestionsLoading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 space-y-6">
        <div className="h-8 bg-secondary/60 animate-pulse rounded w-1/4" />
        <div className="h-32 bg-secondary/60 animate-pulse rounded-2xl" />
        <div className="h-64 bg-secondary/60 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!testSet) {
    return (
      <div className="max-w-6xl mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-destructive">Không tìm thấy đề thi</h2>
        <Button className="mt-4" variant="outline" onClick={() => router.push(ROUTES.ADMIN)}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4 sm:px-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => router.push(ROUTES.ADMIN)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại Cổng Quản Trị
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenEditDialog}
            className="flex items-center gap-1.5 font-semibold cursor-pointer"
          >
            <Edit className="w-4 h-4 text-indigo-500" /> Sửa đề thi
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center gap-1.5 font-semibold cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Xóa bộ đề
          </Button>
        </div>
      </div>

      {/* Header Info Card */}
      <Card className="border-border/40 shadow-xs bg-gradient-to-r from-card via-secondary/10 to-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold px-3 py-1 text-xs flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" /> Luyện tập (Practice Mode)
                </Badge>

                <Badge
                  variant="outline"
                  className={`font-semibold ${
                    testSet.status === 'public'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : testSet.status === 'private'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {testSet.status === 'public'
                    ? 'Công khai'
                    : testSet.status === 'private'
                      ? 'Nội bộ'
                      : 'Nháp'}
                </Badge>
              </div>

              <CardTitle className="text-2xl font-extrabold text-foreground">
                {testSet.name}
              </CardTitle>
              {testSet.description && (
                <CardDescription className="text-sm mt-1.5">{testSet.description}</CardDescription>
              )}
            </div>

            {/* Quick Upload Action */}
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <Input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleJsonUpload}
                  disabled={upsertQuestionsMutation.isPending}
                />
                <Button
                  variant="default"
                  size="sm"
                  disabled={upsertQuestionsMutation.isPending}
                  className="font-bold shadow-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {upsertQuestionsMutation.isPending ? 'Đang nạp...' : 'Nhập câu hỏi (JSON)'}
                </Button>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground mt-4 py-3">
          <div className="flex items-center gap-6">
            <span>
              Tổng số câu hỏi:{' '}
              <strong className="text-foreground font-bold">{questions?.length || 0}</strong>
            </span>
            <span>
              Cập nhật lần cuối:{' '}
              <strong className="text-foreground">
                {new Date((testSet as any).updatedAt || Date.now()).toLocaleDateString('vi-VN')}
              </strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Part Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <Button
              size="sm"
              variant={selectedPart === 'all' ? 'default' : 'outline'}
              className="rounded-xl font-bold text-xs"
              onClick={() => setSelectedPart('all')}
            >
              Tất cả ({questions?.length || 0})
            </Button>
            {['3', '4', '5', '6', '7'].map(partNum => (
              <Button
                key={partNum}
                size="sm"
                variant={selectedPart === partNum ? 'default' : 'outline'}
                className="rounded-xl font-bold text-xs"
                onClick={() => setSelectedPart(partNum)}
              >
                Part {partNum} ({partStats[partNum] || 0})
              </Button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo nội dung câu hỏi..."
              className="pl-9 h-9 text-xs rounded-xl"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Questions Display Section */}
        {filteredQuestions.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 border-border/50 bg-secondary/10 rounded-2xl">
            <HelpCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h4 className="font-bold text-lg text-foreground">Không tìm thấy câu hỏi nào</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Thử tìm kiếm với từ khóa khác hoặc tải lên câu hỏi mới từ file JSON.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredQuestions.map(q => (
              <Card
                key={q._id}
                className="gap-1 overflow-hidden border-border/40 shadow-xs hover:shadow-md transition-all duration-200"
              >
                {/* Separate Passage Context Block */}
                {q.passageContext && (
                  <div className="mx-4 mt-4 p-4 rounded-2xl bg-secondary/30 border border-border/50 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-border/30">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                        <span>Bài đọc / Đoạn văn ({q.passageType || 'Passage'}):</span>
                        <span className="text-primary font-extrabold normal-case bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-md text-[11px]">
                          Nội dung bài đọc hỗ trợ câu {getQuestionNumbersForSet(q, questions)}
                        </span>
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 rounded-lg font-bold cursor-pointer shrink-0"
                        onClick={() => handleOpenEditPassage(q)}
                      >
                        <Edit className="w-3 h-3 mr-1" /> Sửa bài đọc
                      </Button>
                    </div>

                    {q.part === '6' ? (
                      renderPassageWithBlanks(q.passageContext)
                    ) : (
                      <div
                        className="text-sm leading-relaxed text-foreground whitespace-pre-wrap font-serif p-2 [&_strong]:font-bold [&_b]:font-bold"
                        dangerouslySetInnerHTML={{ __html: q.passageContext }}
                      />
                    )}
                  </div>
                )}
                <CardHeader className="bg-secondary/20 pt-4 pb-3 border-b border-border/10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-primary bg-primary/10 px-3 py-1 rounded-xl text-xs font-extrabold">
                        Câu {q.questionNumber}
                      </span>
                      <Badge variant="outline" className="text-xs font-medium">
                        Part {q.part}
                      </Badge>
                      {q.blankPosition && (
                        <Badge variant="secondary" className="text-xs font-bold">
                          Vị trí: {q.blankPosition}
                        </Badge>
                      )}
                    </div>

                    {/* Action buttons for single question */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/10 rounded-lg cursor-pointer"
                        onClick={() => handleOpenEditQuestion(q)}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Sửa câu
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                        onClick={() => {
                          setDeletingQuestionId(q._id);
                          setIsDeleteQuestionModalOpen(true);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Media audio/image preview if exists */}
                  {q.audioUrl && (
                    <div className="mt-3 flex items-center gap-3 p-2 rounded-lg bg-background border border-border/50">
                      <Volume2 className="w-4 h-4 text-primary shrink-0" />
                      <audio controls src={q.audioUrl} className="w-full h-8" />
                    </div>
                  )}

                  {q.imageUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-border/50 max-w-md">
                      <img
                        src={q.imageUrl}
                        alt={`Câu ${q.questionNumber}`}
                        className="w-full h-auto object-contain max-h-64"
                      />
                    </div>
                  )}

                  {q.questionText && (
                    <CardTitle
                      className="text-base font-bold mt-3 leading-snug [&_strong]:font-bold [&_b]:font-bold"
                      dangerouslySetInnerHTML={{ __html: q.questionText }}
                    />
                  )}
                </CardHeader>

                <CardContent className="pt-2 space-y-4">
                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options?.map(opt => {
                      const isCorrect = opt.label === q.correctAnswer;
                      return (
                        <div
                          key={opt.label}
                          className={`p-3 rounded-xl border text-sm flex items-center gap-3 transition-all ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                              : 'border-border/50 bg-background text-foreground'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-500 text-white'
                                : 'bg-secondary text-muted-foreground border border-border/50'
                            }`}
                          >
                            {opt.label}
                          </span>
                          <span className="leading-relaxed flex-1">{opt.text}</span>
                          {isCorrect && (
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Box */}
                  {q.explanation && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Giải thích chi tiết:
                      </p>
                      <p className="text-sm text-foreground leading-relaxed mt-1">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Test Set Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-xl bg-background/95 backdrop-blur-md">
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
              <DialogHeader className="pb-2 border-b border-border/40">
                <DialogTitle className="text-xl font-bold">
                  Chỉnh Sửa Bộ Đề Thi Luyện Tập
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Cập nhật tên, mô tả và chế độ hiển thị cho bộ đề này.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                        Tên Bộ Đề
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Tên bộ đề thi..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <FormField
                    control={editForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-1 flex-1">
                        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                          Loại bộ đề
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="practice">Luyện tập (Practice)</SelectItem>
                            <SelectItem value="exam">Thi thử (Exam)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-1 flex-1">
                        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                          Trạng thái
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                        Mô tả bộ đề
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập mô tả..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={updateToeicSetMutation.isPending}>
                  {updateToeicSetMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Single Question Modal (Cleaned, without passageContext) */}
      <Dialog open={isEditQuestionModalOpen} onOpenChange={setIsEditQuestionModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar bg-background/95 backdrop-blur-md">
          <Form {...questionForm}>
            <form onSubmit={questionForm.handleSubmit(onQuestionFormSubmit)}>
              <DialogHeader className="pb-2 border-b border-border/40">
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Edit className="w-5 h-5 text-primary" />
                  Chỉnh Sửa Câu Hỏi Số {editingQuestion?.questionNumber}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Cập nhật câu hỏi, lựa chọn đáp án và nội dung giải thích chi tiết.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={questionForm.control}
                    name="questionNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                          Số câu
                        </FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={questionForm.control}
                    name="part"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                          Part
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn Part" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['3', '4', '5', '6', '7'].map(p => (
                              <SelectItem key={p} value={p}>
                                Part {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={questionForm.control}
                    name="correctAnswer"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                          Đáp án đúng
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn đáp án" />
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
                </div>

                <FormField
                  control={questionForm.control}
                  name="questionText"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                        Nội dung câu hỏi
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập nội dung câu hỏi..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Options A, B, C, D */}
                <div className="space-y-3 pt-2">
                  <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                    Các lựa chọn đáp án
                  </FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={questionForm.control}
                      name="optionA"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 bg-secondary text-foreground font-bold rounded-lg flex items-center justify-center text-xs shrink-0 border border-border/50">
                                A
                              </span>
                              <Input placeholder="Đáp án A..." {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={questionForm.control}
                      name="optionB"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 bg-secondary text-foreground font-bold rounded-lg flex items-center justify-center text-xs shrink-0 border border-border/50">
                                B
                              </span>
                              <Input placeholder="Đáp án B..." {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={questionForm.control}
                      name="optionC"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 bg-secondary text-foreground font-bold rounded-lg flex items-center justify-center text-xs shrink-0 border border-border/50">
                                C
                              </span>
                              <Input placeholder="Đáp án C..." {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={questionForm.control}
                      name="optionD"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 bg-secondary text-foreground font-bold rounded-lg flex items-center justify-center text-xs shrink-0 border border-border/50">
                                D
                              </span>
                              <Input placeholder="Đáp án D..." {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={questionForm.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem className="space-y-1 pt-2">
                      <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                        Giải thích chi tiết (Tiếng Việt)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập giải thích ngữ pháp, từ vựng hoặc trích dẫn..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditQuestionModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={updateQuestionMutation.isPending}>
                  {updateQuestionMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Passage Context Modal */}
      <Dialog open={isEditPassageModalOpen} onOpenChange={setIsEditPassageModalOpen}>
        <DialogContent className="sm:max-w-4xl md:max-w-5xl w-[95vw] max-h-[90vh] flex flex-col bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl rounded-2xl p-6">
          <DialogHeader className="pb-3 border-b border-border/40 shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <FileText className="w-5.5 h-5.5 text-indigo-500" />
              Chỉnh Sửa Bài Đọc / Đoạn Văn (Part {editingPassageQuestion?.part})
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Cập nhật nội dung đoạn văn bài đọc cho câu hỏi này.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4 flex-1 flex flex-col min-h-0">
            <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
              <span>
                Nội dung bài đọc hỗ trợ câu{' '}
                {editingPassageQuestion
                  ? getQuestionNumbersForSet(editingPassageQuestion, questions)
                  : ''}
                ,...
              </span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Kéo góc để tùy chỉnh chiều cao
              </span>
            </label>
            <textarea
              rows={14}
              className="w-full flex-1 min-h-[380px] max-h-[60vh] p-4 text-sm font-serif leading-relaxed bg-secondary/15 dark:bg-secondary/30 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-y custom-scrollbar"
              placeholder="Nhập nội dung bài đọc..."
              value={editingPassageText}
              onChange={e => setEditingPassageText(e.target.value)}
            />
          </div>

          <div className="flex justify-end items-center gap-3 pt-3 border-t border-border/40 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditPassageModalOpen(false)}
              className="font-semibold"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSavePassage}
              disabled={updateQuestionMutation.isPending || upsertQuestionsMutation.isPending}
              className="font-bold px-5 cursor-pointer shadow-xs"
            >
              {updateQuestionMutation.isPending || upsertQuestionsMutation.isPending
                ? 'Đang lưu...'
                : 'Cập nhật bài đọc'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Single Question Modal */}
      <ConfirmModal
        isOpen={isDeleteQuestionModalOpen}
        onClose={() => setIsDeleteQuestionModalOpen(false)}
        onConfirm={handleDeleteSingleQuestion}
        title="Xác nhận xóa câu hỏi?"
        description="Bạn có chắc chắn muốn xóa câu hỏi này khỏi bộ đề thi? Thao tác này không thể khôi phục."
        confirmText="Xóa câu hỏi"
        cancelText="Hủy"
        variant="destructive"
        isLoading={deleteQuestionMutation.isPending}
      />

      {/* Delete Test Set Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteTestSet}
        title="Xác nhận xóa bộ đề thi?"
        description="Bạn có chắc chắn muốn xóa bộ đề thi luyện tập này cùng toàn bộ các câu hỏi bên trong? Thao tác này không thể khôi phục."
        confirmText="Xóa luôn"
        cancelText="Hủy"
        variant="destructive"
        isLoading={deleteToeicSetMutation.isPending}
      />
    </div>
  );
}
