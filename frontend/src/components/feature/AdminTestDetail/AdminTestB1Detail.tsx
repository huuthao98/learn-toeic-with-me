'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileEdit,
  Check,
  X,
  Search,
  BookOpen,
  Headphones,
  Mic,
  PenTool,
  Globe,
  Lock,
  Save,
  Unlock,
  Award,
  Sparkles,
} from 'lucide-react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

import { useB1 } from '@/hooks/useB1';
import { B1Question } from '@/api/b1';
import { toast } from 'sonner';
import { MediaUploadInput } from '@/components/MediaUploadInput';

interface AdminTestB1DetailProps {
  testId: string;
}

const editB1SetSchema = z.object({
  name: z.string().trim().min(1, 'Tên đề thi không được để trống'),
  description: z.string(),
  status: z.enum(['draft', 'public', 'private']),
  accessLevel: z.enum(['external', 'vip0', 'vip1', 'vip2', 'vip3']),
  audioUrl: z.string().optional(),
});

type EditB1SetFormValues = z.infer<typeof editB1SetSchema>;

const editQuestionSchema = z.object({
  questionText: z.string().optional(),
  passageContext: z.string().optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  audioUrl: z.string().optional(),
  note: z.string().optional(),
  setId: z.coerce.number().optional(),
  optionA: z.string().optional(),
  optionB: z.string().optional(),
  optionC: z.string().optional(),
  optionD: z.string().optional(),
});

type EditQuestionFormValues = z.infer<typeof editQuestionSchema>;

export function AdminTestB1Detail({ testId }: AdminTestB1DetailProps) {
  const router = useRouter();
  const { useTestSet, useTestQuestions, useUpdateTestSetMutation, useUpdateQuestionMutation } =
    useB1();
  const { data: testSet, isLoading: isTestLoading } = useTestSet(testId);
  const { data: questions, isLoading: isQuestionsLoading } = useTestQuestions(testId);
  const updateMutation = useUpdateTestSetMutation(testId);
  const updateQuestionMutation = useUpdateQuestionMutation(testId);

  const [activeSkill, setActiveSkill] = useState<'listening' | 'reading' | 'writing' | 'speaking'>(
    'listening',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<B1Question | null>(null);
  const [editQModalOpen, setEditQModalOpen] = useState(false);

  const editForm = useForm<EditB1SetFormValues>({
    resolver: zodResolver(editB1SetSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'draft',
      accessLevel: 'external',
      audioUrl: '',
    },
  });

  const editQForm = useForm<EditQuestionFormValues>({
    resolver: zodResolver(editQuestionSchema),
    defaultValues: {
      questionText: '',
      passageContext: '',
      correctAnswer: '',
      explanation: '',
      audioUrl: '',
      note: '',
      setId: undefined,
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
    },
  });

  const handleOpenEditModal = () => {
    if (!testSet) return;
    editForm.reset({
      name: testSet.name,
      description: testSet.description || '',
      status: (testSet.status as 'draft' | 'public' | 'private') || 'draft',
      accessLevel:
        (testSet.accessLevel as 'external' | 'vip0' | 'vip1' | 'vip2' | 'vip3') || 'external',
      audioUrl: testSet.audioUrl || '',
    });
    setEditModalOpen(true);
  };

  const onEditSubmit = (values: EditB1SetFormValues) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Cập nhật đề thi B1 thành công!');
        setEditModalOpen(false);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Cập nhật thất bại.');
      },
    });
  };

  const handleOpenEditQuestion = (q: B1Question) => {
    setEditingQuestion(q);
    editQForm.reset({
      questionText: q.questionText || '',
      passageContext: q.passageContext || '',
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || '',
      audioUrl: q.audioUrl || '',
      note: q.note || '',
      setId: q.setId ?? undefined,
      optionA: q.options?.find(o => o.label === 'A')?.text || '',
      optionB: q.options?.find(o => o.label === 'B')?.text || '',
      optionC: q.options?.find(o => o.label === 'C')?.text || '',
      optionD: q.options?.find(o => o.label === 'D')?.text || '',
    });
    setEditQModalOpen(true);
  };

  const onEditQuestionSubmit = (values: EditQuestionFormValues) => {
    if (!editingQuestion) return;
    const payload: any = {
      questionText: values.questionText,
      passageContext: values.passageContext,
      correctAnswer: values.correctAnswer,
      explanation: values.explanation,
      audioUrl: values.audioUrl,
      note: values.note,
      setId: values.setId,
    };
    if (editingQuestion.questionType === 'multiple_choice') {
      payload.options = [
        { label: 'A', text: values.optionA || '' },
        { label: 'B', text: values.optionB || '' },
        { label: 'C', text: values.optionC || '' },
        { label: 'D', text: values.optionD || '' },
      ];
    }
    updateQuestionMutation.mutate(
      { questionId: editingQuestion._id, data: payload },
      {
        onSuccess: () => {
          toast.success('Cập nhật câu hỏi thành công!');
          setEditQModalOpen(false);
          setEditingQuestion(null);
        },
      },
    );
  };

  const filteredQuestions = useMemo(() => {
    if (!questions) return [];
    let list = questions.filter(q => q.skill === activeSkill);
    if (searchQuery) {
      list = list.filter(
        q =>
          q.questionText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.passageContext?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return list;
  }, [questions, activeSkill, searchQuery]);

  if (isTestLoading || isQuestionsLoading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-10 bg-secondary/60 rounded w-1/3" />
        <div className="h-32 bg-secondary/60 rounded-2xl" />
      </div>
    );
  }

  if (!testSet) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-destructive">Không tìm thấy Đề thi B1!</h2>
        <Button onClick={() => router.back()} className="mt-4">
          Quay lại
        </Button>
      </div>
    );
  }

  const skills = [
    {
      id: 'listening',
      label: 'Listening',
      icon: <Headphones className="w-4 h-4 mr-2" />,
    },
    {
      id: 'reading',
      label: 'Reading',
      icon: <BookOpen className="w-4 h-4 mr-2" />,
    },
    {
      id: 'writing',
      label: 'Writing',
      icon: <PenTool className="w-4 h-4 mr-2" />,
    },
    {
      id: 'speaking',
      label: 'Speaking',
      icon: <Mic className="w-4 h-4 mr-2" />,
    },
  ] as const;

  const renderAccessLevelBadge = (level: string) => {
    switch (level) {
      case 'vip0':
        return (
          <Badge
            className="flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
            variant="outline"
          >
            <Unlock className="w-3.5 h-3.5" />
            Member (Đăng nhập)
          </Badge>
        );
      case 'vip1':
        return (
          <Badge
            className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            variant="outline"
          >
            <Award className="w-3.5 h-3.5" />
            VIP 1 (Silver)
          </Badge>
        );
      case 'vip2':
        return (
          <Badge
            className="flex items-center gap-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
            variant="outline"
          >
            <Award className="w-3.5 h-3.5" />
            VIP 2 (Gold)
          </Badge>
        );
      case 'vip3':
        return (
          <Badge
            className="flex items-center gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
            variant="outline"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            VIP 3 (Platinum)
          </Badge>
        );
      case 'external':
      default:
        return (
          <Badge
            className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            variant="outline"
          >
            <Globe className="w-3.5 h-3.5" />
            External (Công khai)
          </Badge>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 mt-6 px-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="w-full">
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">{testSet.name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {/* Status Badge */}
            <Badge variant={testSet.status === 'public' ? 'default' : 'secondary'}>
              {testSet.status.toUpperCase()}
            </Badge>

            {/* Access Level Badge */}
            {renderAccessLevelBadge(testSet.accessLevel || 'external')}
          </div>
          {testSet.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">{testSet.description}</p>
          )}
          {testSet.audioUrl && (
            <div className="mt-4 p-3 bg-secondary/30 rounded-xl border border-border/50 max-w-xl">
              <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                Audio Đề Thi (Listening)
              </span>
              <audio controls className="w-full h-8" src={testSet.audioUrl} />
            </div>
          )}
        </div>

        {/* Edit Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenEditModal}
          className="flex items-center gap-2 shrink-0"
        >
          <FileEdit className="w-4 h-4" />
          Chỉnh sửa
        </Button>
      </div>

      {/* Skill Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 border-b border-border/50 pb-2">
        {skills.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSkill(s.id)}
            className={`flex items-center px-4 py-2 rounded-t-lg transition-colors border-b-2 font-semibold ${
              activeSkill === s.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:bg-secondary/50'
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm câu hỏi hoặc nội dung bài đọc..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-10 bg-secondary/10 rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground">Không có câu hỏi nào trong kỹ năng này.</p>
          </div>
        ) : (
          filteredQuestions.map((q, index) => (
            <Card key={q._id || index} className="overflow-hidden shadow-sm gap-2">
              <div className="flex bg-secondary/30 border-b border-border/50 px-4 py-2 items-center justify-between">
                <span className="font-semibold text-sm">
                  {q.questionNumber ? `Câu ${q.questionNumber}` : `Task / Part ${q.part}`}
                  {q.part && ` (Part ${q.part})`}
                </span>
                <div className="flex items-center gap-2">
                  {q.setId && (
                    <Badge variant="outline" className="text-xs bg-background">
                      Set: {q.setId}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleOpenEditQuestion(q)}
                    className="flex items-center gap-1"
                  >
                    <FileEdit className="w-3 h-3" />
                    Sửa
                  </Button>
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                {q.passageContext && (
                  <div className="bg-secondary/20 p-4 rounded-lg text-sm border border-border/50 font-serif leading-relaxed">
                    <p className="whitespace-pre-wrap">{q.passageContext}</p>
                  </div>
                )}

                {q.audioUrl && (
                  <div className="my-2 p-2 bg-secondary/10 rounded-lg border border-border/40">
                    <span className="text-xs font-semibold text-muted-foreground block mb-1">
                      File nghe câu hỏi:
                    </span>
                    <audio controls className="w-full max-w-md h-8" src={q.audioUrl} />
                  </div>
                )}

                {q.questionText && <p className="font-semibold">{q.questionText}</p>}

                {q.questionType === 'multiple_choice' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {q.options.map(opt => (
                      <div
                        key={opt.label}
                        className={`p-3 rounded-lg border text-sm flex gap-3 items-start ${
                          opt.label === q.correctAnswer
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium'
                            : 'bg-background border-border text-foreground'
                        }`}
                      >
                        <span className="font-bold shrink-0">{opt.label}.</span>
                        <span>{opt.text}</span>
                        {opt.label === q.correctAnswer && (
                          <Check className="w-4 h-4 ml-auto text-emerald-500 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {q.explanation && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                    <span className="font-semibold block mb-1">Giải thích:</span>
                    {q.explanation}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent
          showCloseButton={false}
          className="bg-background/95 backdrop-blur-md border border-border/40 sm:max-w-lg"
        >
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
              <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
                <div>
                  <DialogTitle className="text-xl font-bold">Chỉnh Sửa Đề Thi B1</DialogTitle>
                  <DialogDescription className="text-sm">
                    Cập nhật tên, trạng thái và phạm vi truy cập.
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setEditModalOpen(false)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateMutation.isPending || !editForm.formState.isDirty}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4 px-1">
                {/* Name */}
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                        Tên Đề Thi
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ví dụ: B1 VSTEP Mock Test 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                        Mô tả
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Mô tả ngắn về đề thi..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Audio URL */}
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
                          acceptTypes="audio/*"
                          placeholder="Tải lên hoặc dán link Audio (.mp3)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  {/* Status */}
                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5 flex-1">
                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                          Trạng thái
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn trạng thái">
                                {(val: any) => {
                                  if (val === 'draft') return 'Bản Nháp (Draft)';
                                  if (val === 'public') return 'Công Khai (Public)';
                                  if (val === 'private') return 'Riêng Tư (Private)';
                                  return val || 'Chọn trạng thái';
                                }}
                              </SelectValue>
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

                  {/* Access Level */}
                  <FormField
                    control={editForm.control}
                    name="accessLevel"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5 flex-1">
                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                          Phạm vi truy cập
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn phạm vi">
                                {(val: any) => {
                                  if (val === 'external') return 'External (Công khai)';
                                  if (val === 'vip0') return 'Member (Đăng nhập)';
                                  if (val === 'vip1') return 'VIP 1 (Silver)';
                                  if (val === 'vip2') return 'VIP 2 (Gold)';
                                  if (val === 'vip3') return 'VIP 3 (Diamond)';
                                  return val || 'Chọn phạm vi';
                                }}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="external">
                              <span className="flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                                External (Công khai)
                              </span>
                            </SelectItem>
                            <SelectItem value="vip0">
                              <span className="flex items-center gap-2">
                                <Unlock className="w-3.5 h-3.5 text-blue-500" />
                                Member (Đăng nhập)
                              </span>
                            </SelectItem>
                            <SelectItem value="vip1">
                              <span className="flex items-center gap-2">
                                <Award className="w-3.5 h-3.5 text-amber-500" />
                                VIP 1 (Silver)
                              </span>
                            </SelectItem>
                            <SelectItem value="vip2">
                              <span className="flex items-center gap-2">
                                <Award className="w-3.5 h-3.5 text-orange-500" />
                                VIP 2 (Gold)
                              </span>
                            </SelectItem>
                            <SelectItem value="vip3">
                              <span className="flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                VIP 3 (Platinum)
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {/* Edit Question Modal */}
      <Dialog open={editQModalOpen} onOpenChange={setEditQModalOpen}>
        <DialogContent
          showCloseButton={false}
          className="bg-background/95 backdrop-blur-md border border-border/40 sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Form {...editQForm}>
            <form onSubmit={editQForm.handleSubmit(onEditQuestionSubmit)}>
              <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
                <div>
                  <DialogTitle className="text-xl font-bold">Chỉnh Sửa Câu Hỏi</DialogTitle>
                  <DialogDescription className="text-sm">
                    {editingQuestion?.questionNumber
                      ? `Câu ${editingQuestion.questionNumber}`
                      : `Task / Part ${editingQuestion?.part}`}{' '}
                    &bull; {editingQuestion?.skill} &bull; {editingQuestion?.questionType}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setEditQModalOpen(false)}
                  >
                    <X className="w-4 h-4 mr-1" /> Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateQuestionMutation.isPending || !editQForm.formState.isDirty}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {updateQuestionMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4 px-1">
                {/* Passage Context */}
                <FormField
                  control={editQForm.control}
                  name="passageContext"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                        Ngữ cảnh / Passage Context
                      </FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={4}
                          placeholder="Nội dung bài đọc, hội thoại..."
                          className="w-full text-sm px-3 py-2 rounded-md border border-input bg-background resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Audio URL */}
                <FormField
                  control={editQForm.control}
                  name="audioUrl"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                        Audio URL (câu hỏi)
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

                {/* Question Text + Set ID */}
                <div className="flex gap-3">
                  <FormField
                    control={editQForm.control}
                    name="questionText"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5 flex-1">
                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                          Nội dung câu hỏi
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập câu hỏi..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editQForm.control}
                    name="setId"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5 w-28 shrink-0">
                        <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                          Set ID
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1, 2, 3..."
                            {...field}
                            value={field.value ?? ''}
                            onChange={e =>
                              field.onChange(
                                e.target.value === '' ? undefined : Number(e.target.value),
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Options for multiple_choice */}
                {editingQuestion?.questionType === 'multiple_choice' && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Các đáp án
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(['A', 'B', 'C', 'D'] as const).map(label => (
                        <FormField
                          key={label}
                          control={editQForm.control}
                          name={`option${label}` as any}
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs font-semibold">
                                Đáp án {label}
                                {editingQuestion.correctAnswer === label && (
                                  <span className="ml-1 text-emerald-600">(Correct)</span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <Input placeholder={`Nội dung đáp án ${label}...`} {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>

                    {/* Correct Answer */}
                    <FormField
                      control={editQForm.control}
                      name="correctAnswer"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                            Đáp án đúng
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn đáp án đúng">
                                  {field.value || 'Chọn đáp án đúng'}
                                </SelectValue>
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
                )}

                {/* Explanation */}
                <FormField
                  control={editQForm.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                        Giải thích
                      </FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          rows={3}
                          placeholder="Giải thích đáp án..."
                          className="w-full text-sm px-3 py-2 rounded-md border border-input bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Note */}
                <FormField
                  control={editQForm.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase">
                        Ghi chú (nội bộ)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ghi chú cho admin..." {...field} />
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
    </div>
  );
}
