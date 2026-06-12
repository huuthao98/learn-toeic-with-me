'use client';

import {
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as XLSX from 'xlsx';

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
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MediaUploadInput } from '@/components/MediaUploadInput';

import { uploadApi } from '@/api/upload';
import { testsApi } from '@/api/tests';
import { useAuthStore } from '@/store/authStore';
import { useTests } from '@/hooks/useTests';
import { useQuestions } from '@/hooks/useQuestions';

// Schema cho TestSet
const testSetSchema = z.object({
  name: z.string().trim().min(1, 'Tên đề thi không được để trống'),
  description: z.string(),
  audioUrl: z.string().optional(),
  status: z.enum(['draft', 'public', 'private']),
});

type TestSetFormValues = z.infer<typeof testSetSchema>;

// Helper functions for template downloads
const downloadAnswerKeyTemplate = () => {
  const instructions = [
    ['HƯỚNG DẪN NHẬP ĐÁP ÁN (ANSWER KEY)'],
    ['1. File này dùng để đẩy trước danh sách 200 câu hỏi và đáp án cho đề thi.'],
    ['2. Các cột bắt buộc: "Số thứ tự câu", "Phần (Part)", "Đáp án đúng".'],
    ['3. Đáp án đúng của Part 2 là A, B hoặc C. Các Part khác là A, B, C hoặc D.'],
    ['4. Độ khó mặc định là "medium" (có thể điền "easy", "medium", "hard").'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 80 }];

  const data = Array.from({ length: 200 }, (_, i) => {
    const qNum = i + 1;
    let part = '1';
    if (qNum > 6 && qNum <= 31) part = '2';
    else if (qNum > 31 && qNum <= 70) part = '3';
    else if (qNum > 70 && qNum <= 100) part = '4';
    else if (qNum > 100 && qNum <= 130) part = '5';
    else if (qNum > 130 && qNum <= 146) part = '6';
    else if (qNum > 146 && qNum <= 200) part = '7';

    return {
      'Số thứ tự câu': qNum,
      'Phần (Part)': part,
      'Độ khó (Difficulty)': 'medium',
      'Đáp án đúng': '',
      'Giải thích': '',
    };
  });

  const wsData = XLSX.utils.json_to_sheet(data);
  wsData['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 40 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Hướng Dẫn');
  XLSX.utils.book_append_sheet(wb, wsData, 'Template Nhập Đáp Án');
  XLSX.writeFile(wb, 'AnswerKey_Template.xlsx');
};

const downloadContentTemplate = () => {
  const instructions = [
    ['HƯỚNG DẪN NHẬP NỘI DUNG (CONTENT)'],
    ['1. File này dùng để đẩy nội dung câu hỏi cho Part 3, 4, 5, 6, 7.'],
    [
      '2. KHÔNG cần nhập Part 1 và Part 2 vào file này (hệ thống đã tự động gán đáp án A, B, C, D).',
    ],
    [
      '3. Các cột bắt buộc cần tạo đúng tên: "Số thứ tự câu", "Câu hỏi", "Option A", "Option B", "Option C", "Option D".',
    ],
    [
      '4. Nếu có đoạn văn, thêm cột "Đoạn văn (Passage)". Nếu câu hỏi thuộc một nhóm, thêm cột "Mã nhóm (Group ID)".',
    ],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 80 }];

  const data = Array.from({ length: 200 }, (_, i) => {
    const qNum = i + 1;
    let part = '1';
    if (qNum > 6 && qNum <= 31) part = '2';
    else if (qNum > 31 && qNum <= 70) part = '3';
    else if (qNum > 70 && qNum <= 100) part = '4';
    else if (qNum > 100 && qNum <= 130) part = '5';
    else if (qNum > 130 && qNum <= 146) part = '6';
    else if (qNum > 146 && qNum <= 200) part = '7';

    if (part === '1' || part === '2') return null; // Skip Part 1 and 2

    return {
      'Số thứ tự câu': qNum,
      'Phần (Part)': part,
      'Câu hỏi': '',
      'Option A': '',
      'Option B': '',
      'Option C': '',
      'Option D': '',
      'Đoạn văn (Passage)': '',
      'Mã nhóm (Group ID)': '',
    };
  }).filter(Boolean);

  const wsData = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Hướng Dẫn');
  XLSX.utils.book_append_sheet(wb, wsData, 'Template Nội Dung');
  XLSX.writeFile(wb, 'Content_Template.xlsx');
};

const downloadExampleTemplate = () => {
  import('xlsx').then((XLSX) => {
    const templateData = [
      {
        'Số thứ tự câu': 101,
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
      },
      {
        'Số thứ tự câu': 131,
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
        'Passage Text (Đoạn văn)': 'We are proud of our _______ in the tech industry.',
      },
    ];

    const wsData = XLSX.utils.json_to_sheet(templateData);
    wsData['!cols'] = [
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 50 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 40 },
      { wch: 20 },
      { wch: 40 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsData, 'Ví Dụ Tổng Hợp');
    XLSX.writeFile(wb, 'Example_Template.xlsx');
  });
};

function CreateTestContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { useCreateTestSetMutation } = useTests();
  const { useUpsertQuestionsMutation, useFetchQuestions } = useQuestions();

  const createTestSetMutation = useCreateTestSetMutation();
  const upsertQuestionsMutation = useUpsertQuestionsMutation();

  const [step, setStep] = useState(1);
  const [testSetId, setTestSetId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Deferred file states
  const [testSetAudioFile, setTestSetAudioFile] = useState<File | null>(null);
  const [part1ImageFiles, setPart1ImageFiles] = useState<Record<string, File>>({});
  const [contentQuestionsToUpsert, setContentQuestionsToUpsert] = useState<any[] | null>(null);
  const [isFinalSaving, setIsFinalSaving] = useState(false);

  // For Step 3 (Part 1 Images)
  const [part1Questions, setPart1Questions] = useState<any[]>([]);
  const { refetch: fetchP1 } = useFetchQuestions({ testSetId, part: '1', limit: 6 });

  // Protect route
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const testSetForm = useForm<TestSetFormValues>({
    resolver: zodResolver(testSetSchema),
    defaultValues: {
      name: '',
      description: '',
      audioUrl: '',
      status: 'draft',
    },
  });

  // STEP 1: Create Test Set
  const onTestSetSubmit = (values: TestSetFormValues) => {
    createTestSetMutation.mutate(
      {
        name: values.name,
        description: values.description,
        total_questions: 200,
        parts_count: 7,
        status: values.status,
      },
      {
        onSuccess: (newSet) => {
          setTestSetId(newSet._id);
          setStep(2);
          setSuccessMsg('Đã tạo đề thi thành công. Mời bạn tải lên file Đáp Án.');
          setErrorMsg(null);
        },
        onError: () => setErrorMsg('Lỗi tạo đề thi.'),
      },
    );
  };

  // STEP 2: Upload Answer Key
  const handleAnswerKeyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      // Find the template sheet (ignore instructions)
      const wsName = wb.SheetNames.find((n) => n.includes('Template')) || wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const data = XLSX.utils.sheet_to_json<any>(ws);

      const questionsToUpsert = data
        .map((row) => {
          const getVal = (searchKeys: string[]) => {
            const k = Object.keys(row).find((key) =>
              searchKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase())),
            );
            return k ? row[k] : undefined;
          };

          const qNumRaw = getVal(['số thứ tự', 'question number', 'câu số']);
          const partRaw = getVal(['part', 'phần']);
          const diffRaw = getVal(['difficulty', 'độ khó']);
          const ansRaw = getVal(['correct answer', 'đáp án đúng', 'answer']);
          const expRaw = getVal(['explanation', 'giải thích']);

          const qNum = parseInt(String(qNumRaw), 10);
          const part = String(partRaw).replace(/\D/g, ''); // Extract just the number

          // Auto-fill options for Part 1 and Part 2
          let options: { label: string; text: string }[] = [];
          if (part === '1') {
            options = [
              { label: 'A', text: 'A' },
              { label: 'B', text: 'B' },
              { label: 'C', text: 'C' },
              { label: 'D', text: 'D' },
            ];
          } else if (part === '2') {
            options = [
              { label: 'A', text: 'A' },
              { label: 'B', text: 'B' },
              { label: 'C', text: 'C' },
            ];
          }

          return {
            questionNumber: qNum,
            part: part,
            difficulty: diffRaw || 'medium',
            correctAnswer: String(ansRaw).toUpperCase().trim(),
            explanation: expRaw || '',
            questionText: '',
            options,
            isActive: true,
          };
        })
        .filter(
          (q) => !isNaN(q.questionNumber) && q.correctAnswer && q.correctAnswer !== 'UNDEFINED',
        );

      if (questionsToUpsert.length === 0) {
        setErrorMsg('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
        return;
      }

      upsertQuestionsMutation.mutate(
        { testSetId, questions: questionsToUpsert },
        {
          onSuccess: () => {
            setSuccessMsg(`Đã tải lên đáp án cho ${questionsToUpsert.length} câu hỏi!`);
            fetchP1().then((res) => {
              if (res.data?.data) {
                setPart1Questions(
                  res.data.data.sort((a: any, b: any) => a.question_number - b.question_number),
                );
              }
              setStep(3);
            });
          },
          onError: () => setErrorMsg('Lỗi khi lưu đáp án.'),
        },
      );
    };
    reader.readAsBinaryString(file);
  };

  // STEP 3: Save Part 1 Images locally and go to next step
  const handleSavePart1Images = async () => {
    setStep(4);
  };

  // STEP 4: Upload Content Excel
  const handleContentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsName = wb.SheetNames.find((n) => n.includes('Template')) || wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const data = XLSX.utils.sheet_to_json<any>(ws);

      const questionsToUpsert = data
        .map((row) => {
          const getVal = (searchKeys: string[]) => {
            const k = Object.keys(row).find((key) =>
              searchKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase())),
            );
            return k ? row[k] : undefined;
          };

          const qNumRaw = getVal(['số thứ tự', 'question number', 'câu số']);
          const partRaw = getVal(['part', 'phần']);
          const textRaw = getVal(['câu hỏi', 'question text', 'question']);
          const optARaw = getVal(['option a', 'đáp án a']);
          const optBRaw = getVal(['option b', 'đáp án b']);
          const optCRaw = getVal(['option c', 'đáp án c']);
          const optDRaw = getVal(['option d', 'đáp án d']);
          const passageRaw = getVal(['đoạn văn', 'passage']);
          const groupRaw = getVal(['mã nhóm', 'group id']);

          const qNum = parseInt(String(qNumRaw), 10);
          const part = String(partRaw).replace(/\D/g, '');

          return {
            questionNumber: qNum,
            part: part,
            questionText: textRaw || '',
            options: [
              { label: 'A', text: optARaw || '' },
              { label: 'B', text: optBRaw || '' },
              { label: 'C', text: optCRaw || '' },
              { label: 'D', text: optDRaw || '' },
            ].filter((o) => o.text !== ''), // Optional D for part 2
            passageText: passageRaw || '',
            groupId: groupRaw || '',
          };
        })
        .filter((q) => !isNaN(q.questionNumber));

      setContentQuestionsToUpsert(questionsToUpsert);
      setSuccessMsg(
        `Đã tải file thành công (${questionsToUpsert.length} câu hỏi). Hãy nhấn "Lưu Toàn Bộ Đề Thi" để tải lên hệ thống.`,
      );
    };
    reader.readAsBinaryString(file);
  };

  // STEP 4: Final Save Action
  const handleFinalSave = async () => {
    const hasContent = contentQuestionsToUpsert && contentQuestionsToUpsert.length > 0;
    const hasAudio = !!testSetAudioFile;
    const hasPart1Images = Object.keys(part1ImageFiles).length > 0;

    if (!hasContent && !hasAudio && !hasPart1Images) {
      setErrorMsg('Chưa có dữ liệu nào để lưu. Hãy tải lên file nội dung hoặc file audio.');
      return;
    }

    setIsFinalSaving(true);
    setErrorMsg(null);
    setSuccessMsg('Đang tải các file lên Cloudinary, vui lòng không tắt trang...');

    try {
      // 1. Upload Test Set Audio
      if (testSetAudioFile) {
        const res = await uploadApi.uploadMedia(testSetAudioFile);
        await testsApi.updateTestSet(testSetId, { audioUrl: res.url });
      }

      // 2. Upload Part 1 Images
      const updatedPart1Qs = [...part1Questions];
      for (let i = 0; i < updatedPart1Qs.length; i++) {
        const q = updatedPart1Qs[i];
        const file = part1ImageFiles[q._id];
        if (file) {
          const res = await uploadApi.uploadMedia(file);
          q.image_url = res.url;
        }
      }

      // 3. Combine questions and upsert (only if there's data to combine)
      const p1ToUpsert = updatedPart1Qs
        .filter((q) => q.image_url) // Only include Part 1 questions that have an image
        .map((q) => ({
          questionNumber: q.question_number,
          part: q.part,
          imageUrl: q.image_url,
        }));

      const allQuestions = [...p1ToUpsert, ...(contentQuestionsToUpsert ?? [])];

      if (allQuestions.length > 0) {
        upsertQuestionsMutation.mutate(
          { testSetId, questions: allQuestions },
          {
            onSuccess: () => {
              setSuccessMsg(`Hoàn tất! Đã lưu đề thi và ${allQuestions.length} câu hỏi.`);
              setStep(5);
              setIsFinalSaving(false);
            },
            onError: () => {
              setErrorMsg('Lỗi khi lưu câu hỏi.');
              setIsFinalSaving(false);
            },
          },
        );
      } else {
        // Only audio was uploaded, no questions to upsert
        setSuccessMsg('Hoàn tất! Đã lưu audio cho đề thi.');
        setStep(5);
        setIsFinalSaving(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Đã xảy ra lỗi trong quá trình tải file. Vui lòng thử lại.');
      setIsFinalSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Layers className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Tạo Đề Thi Mới</h1>
            <p className="text-sm text-muted-foreground">
              Quy trình 4 bước để khởi tạo và tải lên dữ liệu cho một bộ đề hoàn chỉnh.
            </p>
          </div>
          <Button variant="outline" onClick={downloadExampleTemplate} className="gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Tải File Hướng Dẫn Chung
          </Button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-destructive/10 border-l-4 border-destructive text-destructive rounded-md text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-md text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {successMsg}
          </div>
        )}

        {/* STEPPER UI */}
        <div className="flex items-center justify-between mb-8 px-4 relative z-0">
          <div className="absolute top-4 left-8 right-8 h-0.5 -z-10">
            {/* Background line */}
            <div className="absolute inset-0 bg-border" />
            {/* Active progress line */}
            <div
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-500 ease-in-out"
              style={{ width: `${((Math.min(step, 4) - 1) / 3) * 100}%` }}
            />
          </div>
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  step >= num
                    ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                    : 'bg-secondary text-muted-foreground border border-border'
                }`}
              >
                {step > num ? <CheckCircle2 className="h-4 w-4" /> : num}
              </div>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider ${step >= num ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {num === 1 && 'Khởi tạo'}
                {num === 2 && 'Đáp án'}
                {num === 3 && 'Ảnh Part 1'}
                {num === 4 && 'Nội dung'}
              </span>
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="bg-primary/5 py-4">
              <CardTitle>Bước 1: Khởi Tạo Đề Thi</CardTitle>
              <CardDescription>Nhập thông tin cơ bản cho đề thi.</CardDescription>
            </CardHeader>
            <Form {...testSetForm}>
              <form onSubmit={testSetForm.handleSubmit(onTestSetSubmit)}>
                <CardContent className="space-y-4 py-4">
                  <FormField
                    control={testSetForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên đề thi</FormLabel>
                        <FormControl>
                          <Input placeholder="Ví dụ: TOEIC Mock Test 2026" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={testSetForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả chung</FormLabel>
                        <FormControl>
                          <Input placeholder="Dùng để thi cuối khóa..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={testSetForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trạng thái hiển thị</FormLabel>
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
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end pt-4 border-t">
                  <Button type="submit" disabled={createTestSetMutation.isPending}>
                    {createTestSetMutation.isPending ? 'Đang tạo...' : 'Lưu và Tiếp Tục'}{' '}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="bg-primary/5 py-4">
              <CardTitle>Bước 2: Tải Lên Đáp Án (Answer Key)</CardTitle>
              <CardDescription>
                Upload danh sách đáp án để hệ thống tự động sinh ra 200 câu hỏi (trống nội dung).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 py-6 flex flex-col items-center justify-center">
              <div className="flex items-center gap-4 w-full p-4 border rounded-xl bg-secondary/20">
                <FileSpreadsheet className="h-10 w-10 text-emerald-600" />
                <div className="flex-1">
                  <h4 className="font-bold">Template File Đáp Án</h4>
                  <p className="text-xs text-muted-foreground">
                    Tải file mẫu Excel và điền đúng định dạng trước khi upload.
                  </p>
                </div>
                <Button variant="outline" onClick={downloadAnswerKeyTemplate}>
                  Tải Template
                </Button>
              </div>

              <div className="border-2 border-dashed border-border rounded-xl p-8 w-full flex flex-col items-center justify-center hover:bg-secondary/10 transition-colors relative">
                {upsertQuestionsMutation.isPending && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-sm font-bold text-primary">Đang xử lý dữ liệu...</p>
                  </div>
                )}
                <Upload className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h4 className="font-bold mb-1">Tải lên file Excel đã điền</h4>
                <p className="text-xs text-muted-foreground mb-4">Hỗ trợ định dạng .xlsx</p>
                <Input
                  type="file"
                  accept=".xlsx, .xls"
                  className="max-w-xs cursor-pointer"
                  onChange={handleAnswerKeyUpload}
                  disabled={upsertQuestionsMutation.isPending}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="bg-primary/5 py-4">
              <CardTitle>Bước 3: Tải Lên Ảnh Part 1</CardTitle>
              <CardDescription>
                Gắn hình ảnh cho 6 câu đầu tiên của Part 1 (không bắt buộc).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {part1Questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Không tìm thấy câu hỏi Part 1 nào để đính kèm ảnh.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {part1Questions.map((q, idx) => (
                    <div
                      key={q._id || q.question_number}
                      className="p-4 border rounded-xl bg-background space-y-2"
                    >
                      <div className="font-bold text-sm text-primary">Câu {q.question_number}</div>
                      <div className="text-xs text-muted-foreground">
                        Đáp án đã đẩy: {q.correct_answer}
                      </div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setPart1ImageFiles((prev) => ({ ...prev, [q._id]: file }));
                          } else {
                            const newFiles = { ...part1ImageFiles };
                            delete newFiles[q._id];
                            setPart1ImageFiles(newFiles);
                          }
                        }}
                      />
                      {part1ImageFiles[q._id] && (
                        <p className="text-xs text-emerald-600">
                          Đã chọn: {part1ImageFiles[q._id].name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-4 border-t">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
              </Button>
              <Button onClick={handleSavePart1Images} disabled={upsertQuestionsMutation.isPending}>
                {upsertQuestionsMutation.isPending ? 'Đang lưu...' : 'Lưu Ảnh & Tiếp Tục'}{' '}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="bg-primary/5 py-4">
              <CardTitle>Bước 4: Tải Lên Nội Dung (Content)</CardTitle>
              <CardDescription>
                Upload file nội dung câu hỏi cho Part 3, 4, 5, 6, 7. Dữ liệu sẽ được tự động ghép
                nối vào các đáp án đã tạo ở Bước 2 thông qua "Số thứ tự câu".
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6 flex flex-col items-center justify-center">
              <div className="flex items-center gap-4 w-full p-4 border rounded-xl bg-secondary/20">
                <FileSpreadsheet className="h-10 w-10 text-emerald-600" />
                <div className="flex-1">
                  <h4 className="font-bold">Template File Nội Dung</h4>
                  <p className="text-xs text-muted-foreground">
                    Tải file mẫu Excel và điền đúng định dạng.
                  </p>
                </div>
                <Button variant="outline" onClick={downloadContentTemplate}>
                  Tải Template
                </Button>
              </div>

              <div className="border-2 border-dashed border-border rounded-xl p-8 w-full flex flex-col items-center justify-center hover:bg-secondary/10 transition-colors relative">
                {upsertQuestionsMutation.isPending && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-sm font-bold text-primary">Đang xử lý dữ liệu...</p>
                  </div>
                )}
                <Upload className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h4 className="font-bold mb-1">Tải lên file Nội Dung đã điền</h4>
                <p className="text-xs text-muted-foreground mb-4">Hỗ trợ định dạng .xlsx</p>
                <Input
                  type="file"
                  accept=".xlsx, .xls"
                  className="max-w-xs cursor-pointer"
                  onChange={handleContentUpload}
                  disabled={upsertQuestionsMutation.isPending}
                />
              </div>
              <div className="w-full space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  File Audio Chung (Part 1-4)
                </label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setTestSetAudioFile(file);
                    else setTestSetAudioFile(null);
                  }}
                />
                {testSetAudioFile && (
                  <p className="text-xs text-emerald-600 mt-1">Đã chọn: {testSetAudioFile.name}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => setStep(3)}
                disabled={upsertQuestionsMutation.isPending || isFinalSaving}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
              </Button>
              <Button
                onClick={handleFinalSave}
                disabled={
                  // !contentQuestionsToUpsert ||
                  // contentQuestionsToUpsert.length === 0 ||
                  isFinalSaving || upsertQuestionsMutation.isPending
                }
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isFinalSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử lý...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Lưu Toàn Bộ Đề Thi
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <Card className="shadow-lg border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold">Hoàn Tất Tạo Đề Thi!</h2>
              <p className="text-muted-foreground max-w-md">
                Bộ đề đã được tải lên hoàn chỉnh với cả đáp án và nội dung. Bạn có thể kiểm tra lại
                trong danh sách đề thi.
              </p>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => router.push('/admin')}>
                  Về Danh Sách Đề
                </Button>
                <Button onClick={() => window.location.reload()}>Tạo Đề Mới</Button>
              </div>
            </CardContent>
          </Card>
        )}
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
