'use client';

import {
  Layers,
  Trash2,
  HelpCircle,
  PlusCircle,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Card,
  CardTitle,
  CardHeader,
  CardFooter,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from '@/components/ui/select';
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

import { useAuthStore } from '@/store/authStore';
import { useTests } from '@/hooks/useTests';
import { useQuestions } from '@/hooks/useQuestions';
// Define Validation Schemas
const questionSchema = z.object({
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
}).superRefine((data, ctx) => {
  if (data.part !== '2' && (!data.optionD || data.optionD.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vui lòng nhập phương án D',
      path: ['optionD'],
    });
  }
});

type QuestionFormValues = z.infer<typeof questionSchema>;

const testSetSchema = z.object({
  name: z.string().trim().min(1, 'Tên đề thi không được để trống'),
  description: z.string(),
});

type TestSetFormValues = z.infer<typeof testSetSchema>;

function CreateTestContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const testSetIdParam = searchParams.get('testSetId');

  // Protect route
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const { useTestSets, useCreateTestSetMutation } = useTests();
  const { useCreateQuestionMutation } = useQuestions();

  const { data: testSets, isLoading: loadingTestSets } = useTestSets();
  const createTestSetMutation = useCreateTestSetMutation();
  const createQuestionMutation = useCreateQuestionMutation();

  // States
  const [selectedTestSetId, setSelectedTestSetId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Auto-select test set if provided in query params
  useEffect(() => {
    if (testSetIdParam) {
      setSelectedTestSetId(testSetIdParam);
    }
  }, [testSetIdParam]);
  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // React Hook Form for Question Builder
  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
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

  const selectedPart = questionForm.watch('part');

  const generateGroupId = () => {
    questionForm.setValue('groupId', `group_${Date.now()}`);
  };

  // React Hook Form for Test Set Dialog
  const testSetForm = useForm<TestSetFormValues>({
    resolver: zodResolver(testSetSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Create Test Set Submit handler
  const onTestSetSubmit = (values: TestSetFormValues) => {
    createTestSetMutation.mutate(
      {
        name: values.name,
        description: values.description,
        total_questions: 0,
        parts_count: 1,
      },
      {
        onSuccess: (newSet) => {
          setSelectedTestSetId(newSet._id);
          testSetForm.reset();
          setDialogOpen(false);
        },
      },
    );
  };

  // Add Question to current list in the session
  const onQuestionSubmit = (values: QuestionFormValues) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedTestSetId) {
      setErrorMsg('Vui lòng chọn hoặc tạo bộ đề thi trước khi thêm câu hỏi.');
      return;
    }

    const newQ = {
      id: `temp_${Date.now()}`,
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
    };

    setSessionQuestions([...sessionQuestions, newQ]);

    // Clear question form but preserve current part, difficulty, and group/passage info for convenience
    questionForm.reset({
      part: values.part,
      difficulty: values.difficulty,
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
      audioUrl: values.audioUrl || '',
      imageUrl: values.imageUrl || '',
      passageText: values.passageText || '',
      groupId: values.groupId || '',
    });
  };

  // Remove Question from list
  const handleRemoveQuestion = (id: string) => {
    setSessionQuestions(sessionQuestions.filter((q) => q.id !== id));
  };

  // Save All questions in the list to the backend database
  const handleSaveAllQuestions = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (sessionQuestions.length === 0) {
      setErrorMsg('Danh sách câu hỏi trống. Hãy thêm câu hỏi trước.');
      return;
    }

    try {
      const savePromises = sessionQuestions.map((q) => {
        return createQuestionMutation.mutateAsync({
          testSetId: selectedTestSetId,
          part: q.part,
          difficulty: q.difficulty,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          audioUrl: q.audioUrl,
          imageUrl: q.imageUrl,
          groupId: q.groupId,
          passageText: q.passageText,
          isActive: true,
        });
      });

      await Promise.all(savePromises);

      setSuccessMsg(`Lưu thành công ${sessionQuestions.length} câu hỏi vào đề thi!`);
      setSessionQuestions([]);
    } catch (error) {
      setErrorMsg('Gặp lỗi trong quá trình lưu câu hỏi. Vui lòng kiểm tra lại kết nối.');
    }
  };

  const triggerExcelUpload = () => {
    const fileInput = document.getElementById('excel-file-input');
    if (fileInput) {
      fileInput.click();
    }
  };

  const downloadExcelTemplate = () => {
    import('xlsx').then((xlsx) => {
      const templateData = [
        {
          'Part (Phần)': 5,
          'Difficulty (Độ khó)': 'medium',
          'Question Text (Câu hỏi)':
            'Customer service representatives must respond _______ to client inquiries.',
          'Option A (Đáp án A)': 'promptly',
          'Option B (Đáp án B)': 'prompt',
          'Option C (Đáp án C)': 'promptness',
          'Option D (Đáp án D)': 'prompted',
          'Correct Answer (Đáp án đúng)': 'A',
          'Explanation (Giải thích)':
            'Cần một trạng từ (promptly) để bổ nghĩa cho động từ "respond" trong câu.',
          'Group ID (Mã nhóm)': '',
          'Passage Text (Đoạn văn)': '',
          'Audio URL (Đường dẫn nghe)': '',
          'Image URL (Đường dẫn ảnh)': '',
        },
        {
          'Part (Phần)': 6,
          'Difficulty (Độ khó)': 'medium',
          'Question Text (Câu hỏi)': 'Blank [1]',
          'Option A (Đáp án A)': 'innovative',
          'Option B (Đáp án B)': 'innovation',
          'Option C (Đáp án C)': 'innovate',
          'Option D (Đáp án D)': 'innovator',
          'Correct Answer (Đáp án đúng)': 'B',
          'Explanation (Giải thích)': 'Sau tính từ sở hữu "our" cần danh từ.',
          'Group ID (Mã nhóm)': 'group_part6_demo1',
          'Passage Text (Đoạn văn)':
            'We are proud to announce our latest _______ in product design. Please check the attachment.',
          'Audio URL (Đường dẫn nghe)': '',
          'Image URL (Đường dẫn ảnh)': '',
        },
        {
          'Part (Phần)': 6,
          'Difficulty (Độ khó)': 'medium',
          'Question Text (Câu hỏi)': 'Blank [2]',
          'Option A (Đáp án A)': 'visit',
          'Option B (Đáp án B)': 'visiting',
          'Option C (Đáp án C)': 'visitor',
          'Option D (Đáp án D)': 'visited',
          'Correct Answer (Đáp án đúng)': 'A',
          'Explanation (Giải thích)': 'Sử dụng động từ nguyên mẫu sau "please".',
          'Group ID (Mã nhóm)': 'group_part6_demo1',
          'Passage Text (Đoạn văn)':
            'We are proud to announce our latest _______ in product design. Please check the attachment.',
          'Audio URL (Đường dẫn nghe)': '',
          'Image URL (Đường dẫn ảnh)': '',
        },
        {
          'Part (Phần)': 1,
          'Difficulty (Độ khó)': 'easy',
          'Question Text (Câu hỏi)': 'Look at the picture and choose the best statement.',
          'Option A (Đáp án A)': 'A man is typing on a computer.',
          'Option B (Đáp án B)': 'A man is writing in a notebook.',
          'Option C (Đáp án C)': 'A man is talking on the phone.',
          'Option D (Đáp án D)': 'A man is standing near the window.',
          'Correct Answer (Đáp án đúng)': 'A',
          'Explanation (Giải thích)': 'Người đàn ông đang gõ máy tính.',
          'Group ID (Mã nhóm)': '',
          'Passage Text (Đoạn văn)': '',
          'Audio URL (Đường dẫn nghe)': 'part1_q1.mp3',
          'Image URL (Đường dẫn ảnh)': 'part1_q1.jpg',
        },
        {
          'Part (Phần)': 2,
          'Difficulty (Độ khó)': 'medium',
          'Question Text (Câu hỏi)': 'Choose the best response.',
          'Option A (Đáp án A)': 'At 3:00 PM.',
          'Option B (Đáp án B)': 'Yes, I did.',
          'Option C (Đáp án C)': 'In the conference room.',
          'Option D (Đáp án D)': '',
          'Correct Answer (Đáp án đúng)': 'C',
          'Explanation (Giải thích)': 'Trả lời phù hợp cho câu hỏi "Where".',
          'Group ID (Mã nhóm)': '',
          'Passage Text (Đoạn văn)': '',
          'Audio URL (Đường dẫn nghe)': 'part2_q1.mp3',
          'Image URL (Đường dẫn ảnh)': '',
        },
      ];

      const worksheet = xlsx.utils.json_to_sheet(templateData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'TOEIC Questions Template');

      const maxColWidth = [
        { wch: 12 }, // Part
        { wch: 18 }, // Difficulty
        { wch: 45 }, // Question text
        { wch: 15 }, // Opt A
        { wch: 15 }, // Opt B
        { wch: 15 }, // Opt C
        { wch: 15 }, // Opt D
        { wch: 25 }, // Correct ans
        { wch: 40 }, // Explanation
        { wch: 20 }, // Group ID
        { wch: 50 }, // Passage text
        { wch: 25 }, // Audio
        { wch: 25 }, // Image
      ];
      worksheet['!cols'] = maxColWidth;

      xlsx.writeFile(workbook, 'TOEIC_Questions_Template.xlsx');
    });
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedTestSetId) {
      setErrorMsg('Vui lòng chọn hoặc tạo bộ đề thi trước khi nhập câu hỏi từ Excel.');
      e.target.value = '';
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
          setErrorMsg('Không thể đọc dữ liệu file.');
          return;
        }

        import('xlsx').then((xlsx) => {
          const workbook = xlsx.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = xlsx.utils.sheet_to_json<any>(worksheet);

          if (rawRows.length === 0) {
            setErrorMsg('File Excel không có dữ liệu hoặc không đúng định dạng.');
            return;
          }

          const getRowVal = (row: any, keys: string[]) => {
            const rowKeys = Object.keys(row);
            for (const k of keys) {
              if (row[k] !== undefined) return row[k];
            }

            const normalize = (str: string) => {
              return str
                .toLowerCase()
                .replace(/\([^)]*\)/g, '')
                .replace(/[\s\-_.,/\\:;'"?!@#$%^&*+=\[\]{}<>~`|]+/g, '');
            };

            for (const k of keys) {
              const normalizedTarget = normalize(k);
              const foundKey = rowKeys.find(
                (rk) => normalize(rk) === normalizedTarget,
              );
              if (foundKey && row[foundKey] !== undefined) return row[foundKey];
            }
            return undefined;
          };

          const parsedQuestions: any[] = [];
          const skippedRows: number[] = [];

          rawRows.forEach((row: any, idx: number) => {
            const partRaw = getRowVal(row, ['part', 'phần', 'part (phần)', 'toeic part']);
            const difficultyRaw = getRowVal(row, [
              'difficulty',
              'độ khó',
              'difficulty (độ khó)',
              'mức độ',
            ]);
            const questionText = getRowVal(row, [
              'questiontext',
              'question text',
              'câu hỏi',
              'nội dung câu hỏi',
              'question',
            ]);
            const optionA = getRowVal(row, ['optiona', 'option a', 'đáp án a', 'phương án a', 'a']);
            const optionB = getRowVal(row, ['optionb', 'option b', 'đáp án b', 'phương án b', 'b']);
            const optionC = getRowVal(row, ['optionc', 'option c', 'đáp án c', 'phương án c', 'c']);
            const optionD = getRowVal(row, ['optiond', 'option d', 'đáp án d', 'phương án d', 'd']);
            const correctAnswerRaw = getRowVal(row, [
              'correctanswer',
              'correct answer',
              'đáp án đúng',
              'đáp án',
              'correct_answer',
              'key',
            ]);
            const explanation =
              getRowVal(row, [
                'explanation',
                'giải thích',
                'giải thích chi tiết',
                'explanation (giải thích)',
              ]) || '';

            const groupId = getRowVal(row, ['groupid', 'group id', 'nhóm', 'mã nhóm', 'group_id']) || '';
            const passageText = getRowVal(row, ['passagetext', 'passage text', 'đoạn văn', 'đoạn văn đọc', 'passage_text']) || '';
            const audioUrl = getRowVal(row, ['audiourl', 'audio url', 'âm thanh', 'file nghe', 'đường dẫn nghe', 'audio_url']) || '';
            const imageUrl = getRowVal(row, ['imageurl', 'image url', 'hình ảnh', 'ảnh', 'đường dẫn ảnh', 'image_url']) || '';

            // Normalize Part (extract digits, e.g. "Part 6" -> "6")
            let part = String(partRaw || '').trim().replace(/\D/g, '');
            if (!['1', '2', '3', '4', '5', '6', '7'].includes(part)) {
              part = '5';
            }

            if (
              optionA === undefined ||
              optionB === undefined ||
              optionC === undefined ||
              (part !== '2' && optionD === undefined) ||
              correctAnswerRaw === undefined
            ) {
              skippedRows.push(idx + 2); // Excel rows are 1-indexed and header is row 1
              return;
            }

            // Normalize Difficulty
            let difficulty = String(difficultyRaw).trim().toLowerCase();
            if (difficulty === 'dễ' || difficulty === 'easy') {
              difficulty = 'easy';
            } else if (difficulty === 'trung bình' || difficulty === 'medium') {
              difficulty = 'medium';
            } else if (difficulty === 'khó' || difficulty === 'hard') {
              difficulty = 'hard';
            } else {
              difficulty = 'medium';
            }

            // Normalize Correct Answer
            let correctAnswer = String(correctAnswerRaw).trim().toUpperCase();
            if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
              correctAnswer = 'A';
            }

            const options = [
              { label: 'A', text: String(optionA).trim() },
              { label: 'B', text: String(optionB).trim() },
              { label: 'C', text: String(optionC).trim() },
            ];
            if (part !== '2') {
              options.push({ label: 'D', text: String(optionD || '').trim() });
            }

            parsedQuestions.push({
              id: `temp_${Date.now()}_${idx}`,
              part,
              difficulty,
              questionText: questionText !== undefined ? String(questionText).trim() : '',
              options,
              correctAnswer,
              explanation: String(explanation).trim(),
              audioUrl: String(audioUrl).trim(),
              imageUrl: String(imageUrl).trim(),
              passageText: String(passageText).trim(),
              groupId: String(groupId).trim(),
            });
          });

          if (parsedQuestions.length === 0) {
            setErrorMsg('Không tìm thấy câu hỏi hợp lệ nào trong file Excel.');
            e.target.value = '';
            return;
          }

          setSessionQuestions((prev) => [...prev, ...parsedQuestions]);

          let msg = `Đã nhập thành công ${parsedQuestions.length} câu hỏi từ file Excel vào danh sách tạm!`;
          if (skippedRows.length > 0) {
            msg += ` (Bỏ qua các dòng không hợp lệ: ${skippedRows.join(', ')})`;
          }
          setSuccessMsg(msg);
          e.target.value = '';
        });
      } catch (err) {
        setErrorMsg('Đã xảy ra lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng.');
        e.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  if (user && user.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Navigation / Heading */}
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
              <PlusCircle className="h-6 w-6 text-primary" />
              <span className="text-gradient">Tạo Đề Luyện Thi</span>
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
              <CardContent className="space-y-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Tên đề thi (Bộ đề)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      {loadingTestSets ? (
                        <div className="h-9 bg-secondary/80 animate-pulse rounded-lg" />
                      ) : (
                        <Select
                          value={selectedTestSetId}
                          onValueChange={(val) => setSelectedTestSetId(val || '')}
                          items={
                            testSets?.map((set) => ({
                              value: set._id,
                              label: `${set.name} (${set.total_questions} câu)`,
                            })) || []
                          }
                        >
                          <SelectTrigger className="w-full" size="lg">
                            <SelectValue
                              placeholder={
                                testSets && testSets.length > 0
                                  ? '-- Chọn bộ đề thi --'
                                  : 'Chưa có đề thi'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent alignItemWithTrigger={false}>
                            {testSets && testSets.length > 0 ? (
                              testSets.map((set) => (
                                <SelectItem key={set._id} value={set._id}>
                                  {set.name} ({set.total_questions} câu)
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-3 text-xs text-center text-muted-foreground">
                                Chưa có đề thi
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Create Test Set Dialog */}
                    <Dialog
                      open={dialogOpen}
                      onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) {
                          testSetForm.reset();
                        }
                      }}
                    >
                      <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all duration-200 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground px-4 h-9">
                        <PlusCircle className="h-4 w-4" />
                        <span>Tạo Đề Mới</span>
                      </DialogTrigger>

                      <DialogContent className="bg-background/80 backdrop-blur-md border-b border-border/40 ">
                        <Form {...testSetForm}>
                          <form onSubmit={testSetForm.handleSubmit(onTestSetSubmit)}>
                            <DialogHeader>
                              <DialogTitle>Tạo Đề Luyện Thi Mới</DialogTitle>
                              <DialogDescription>
                                Đề thi sẽ chứa các câu hỏi trắc nghiệm bạn nhập bên dưới.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <FormField
                                control={testSetForm.control}
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
                                control={testSetForm.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem className="space-y-1.5">
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
                            <DialogFooter>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setDialogOpen(false)}
                              >
                                Hủy
                              </Button>
                              <Button type="submit" disabled={createTestSetMutation.isPending}>
                                {createTestSetMutation.isPending ? 'Đang tạo...' : 'Tạo Đề'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="border-t border-border/30 pt-4 mt-2 space-y-3">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">
                    Hoặc Nhập Hàng Loạt Từ Excel
                  </label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={triggerExcelUpload}
                      className="cursor-pointer"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600 animate-pulse" />
                      Chọn file Excel / CSV...
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={downloadExcelTemplate}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Tải file Excel mẫu (.xlsx)
                    </Button>
                    <input
                      type="file"
                      id="excel-file-input"
                      className="hidden"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleExcelUpload}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question Builder Form */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <span>Bước 2: Nội dung câu hỏi (Incomplete Sentences)</span>
                </CardTitle>
                <CardDescription>
                  Nhập câu hỏi có khoảng trống và các phương án lựa chọn.
                </CardDescription>
              </CardHeader>
              <Form {...questionForm}>
                <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={questionForm.control}
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
                        control={questionForm.control}
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
                            control={questionForm.control}
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
                              control={questionForm.control}
                              name="audioUrl"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5 col-span-2 md:col-span-1">
                                  <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                                    URL âm thanh dùng chung
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ví dụ: audio/conversation1.mp3" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          {(selectedPart === '3' || selectedPart === '4' || selectedPart === '7') && (
                            <FormField
                              control={questionForm.control}
                              name="imageUrl"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5 col-span-2 md:col-span-1">
                                  <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                                    URL hình ảnh dùng chung (Nếu có)
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ví dụ: images/diagram1.png" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                        {(selectedPart === '6' || selectedPart === '7') && (
                          <FormField
                            control={questionForm.control}
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
                          control={questionForm.control}
                          name="audioUrl"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                                URL âm thanh tả cảnh
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Ví dụ: audio/part1_q1.mp3" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={questionForm.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                                URL hình ảnh tranh vẽ
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Ví dụ: images/part1_q1.jpg" {...field} />
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
                          control={questionForm.control}
                          name="audioUrl"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-[10px] font-bold text-muted-foreground uppercase">
                                URL âm thanh câu hỏi phản hồi
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Ví dụ: audio/part2_q1.mp3" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Question Text */}
                    <FormField
                      control={questionForm.control}
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
                          <FormDescription className="text-[10px] text-muted-foreground">
                            Lưu ý: Bạn nên sử dụng các ký tự liên tiếp _______ để đại diện cho chỗ
                            trống cần điền.
                          </FormDescription>
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
                          control={questionForm.control}
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
                          control={questionForm.control}
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
                          control={questionForm.control}
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
                            control={questionForm.control}
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
                      control={questionForm.control}
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
                                  <RadioGroupItem value={val} id={`correct-${val}`} />
                                  <label
                                    htmlFor={`correct-${val}`}
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
                      control={questionForm.control}
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
                  </CardContent>
                  <CardFooter className="flex justify-end gap-3 border-t border-border/40 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        questionForm.reset({
                          part: questionForm.getValues('part'),
                          difficulty: questionForm.getValues('difficulty'),
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
                        });
                      }}
                    >
                      Xóa Form
                    </Button>
                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                      Thêm vào danh sách tạm
                    </Button>
                  </CardFooter>
                </form>
              </Form>
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
                  Các câu hỏi đã soạn thảo trong phiên làm việc hiện tại (Chưa lưu vào cơ sở dữ
                  liệu).
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto max-h-[460px] space-y-4">
                {sessionQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {sessionQuestions.map((q, index) => {
                      const isGrouped = !!q.groupId;
                      return (
                        <div
                          key={q.id}
                          className={`p-3 rounded-lg border flex flex-col justify-between gap-2 transition-all ${
                            isGrouped
                              ? 'border-teal-500/20 bg-teal-500/[0.01] dark:bg-teal-500/[0.02] shadow-sm'
                              : 'border-border/40 bg-secondary/20'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-primary">
                                Câu {index + 1} (Part {q.part})
                              </span>
                              {q.groupId && (
                                <span className="text-[9px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">
                                  Nhóm: {q.groupId}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 bg-secondary text-muted-foreground rounded">
                              {q.difficulty}
                            </span>
                          </div>

                          {/* Group-specific elements */}
                          {q.passageText && (
                            <p className="text-[10px] text-muted-foreground bg-background/50 p-1.5 rounded border border-border/30 line-clamp-2 italic">
                              Đoạn văn: &quot;{q.passageText}&quot;
                            </p>
                          )}
                          {q.audioUrl && (
                            <p className="text-[10px] text-muted-foreground bg-background/50 p-1 px-1.5 rounded border border-border/30 truncate flex items-center gap-1 font-mono">
                              <span className="text-xs">🔊</span> {q.audioUrl}
                            </p>
                          )}
                          {q.imageUrl && (
                            <p className="text-[10px] text-muted-foreground bg-background/50 p-1 px-1.5 rounded border border-border/30 truncate flex items-center gap-1 font-mono">
                              <span className="text-xs">🖼️</span> {q.imageUrl}
                            </p>
                          )}

                          {q.questionText && (
                            <p className="text-xs font-medium text-foreground line-clamp-2">
                              {q.questionText}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                            <span>A. {q.options[0]?.text}</span>
                            <span>B. {q.options[1]?.text}</span>
                            <span>C. {q.options[2]?.text}</span>
                            {q.options[3] && <span>D. {q.options[3].text}</span>}
                          </div>
                          
                          <div className="flex justify-between items-center border-t border-border/20 pt-2 mt-1">
                            <span className="text-[10px] font-bold text-emerald-600">
                              Đáp án: {q.correctAnswer}
                            </span>
                            <button
                              onClick={() => handleRemoveQuestion(q.id)}
                              className="p-1 rounded text-destructive hover:bg-destructive/10 transition-all"
                              title="Xóa câu hỏi khỏi danh sách"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 px-6 border border-dashed border-border rounded-lg bg-secondary/10">
                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground/60 mb-2 animate-pulse" />
                    <h5 className="font-semibold text-sm">Danh sách trống</h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hãy soạn thảo câu hỏi ở cột bên trái và nhấn &quot;Thêm vào danh sách
                      tạm&quot; để gom dữ liệu.
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
                  {createQuestionMutation.isPending
                    ? 'Đang lưu câu hỏi...'
                    : `Lưu tất cả (${sessionQuestions.length} câu) vào cơ sở dữ liệu`}
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
  );
}

export default function CreateTestPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-background">
          <div className="h-10 bg-secondary/80 animate-pulse rounded w-32" />
        </div>
      }
    >
      <CreateTestContent />
    </Suspense>
  );
}
