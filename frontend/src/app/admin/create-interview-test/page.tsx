'use client';

import {
  Layers,
  ArrowRight,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import * as z from 'zod';
import * as XLSX from 'xlsx';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, Suspense } from 'react';
import { toast } from 'sonner';

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
import { useTests } from '@/hooks/useTests';
import { useAuthStore } from '@/store/authStore';
import { useQuestions } from '@/hooks/useQuestions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AddInterviewQuestionDialog } from '@/components/admin/AddInterviewQuestionDialog';
import { ROUTES } from '@/constants/routes';

// Schema cho TestSet
const testSetSchema = z.object({
  name: z.string().trim().min(1, 'Tên đề thi không được để trống'),
  description: z.string(),
  status: z.enum(['draft', 'public', 'private']),
  testType: z.enum(['interview']),
});

type TestSetFormValues = z.infer<typeof testSetSchema>;

const downloadInterviewTemplate = () => {
  const instructions = [
    ['HƯỚNG DẪN NHẬP CÂU HỎI PHỎNG VẤN'],
    ['1. File này dùng để đẩy câu hỏi phỏng vấn (tự luận).'],
    [
      '2. Các cột bắt buộc: "Số thứ tự câu", "Lĩnh vực", "Câu hỏi", "Câu trả lời mẫu", "Giải thích".',
    ],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 80 }];

  const data = [
    {
      'Số thứ tự câu': 1,
      'Lĩnh vực': 'Frontend',
      'Câu hỏi': 'Event Loop là gì?',
      'Câu trả lời mẫu':
        'Event Loop là cơ chế giúp Node.js / Browser xử lý các tác vụ bất đồng bộ...',
      'Giải thích': 'Tham khảo thêm ở MDN Web Docs.',
    },
  ];

  const wsData = XLSX.utils.json_to_sheet(data);
  wsData['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 50 },
    { wch: 50 },
    { wch: 50 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Hướng Dẫn');
  XLSX.utils.book_append_sheet(wb, wsData, 'Template Nhập Liệu');
  XLSX.writeFile(wb, 'Interview_Template.xlsx');
};

function CreateInterviewTestContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { useCreateTestSetMutation } = useTests();
  const { useUpsertQuestionsMutation } = useQuestions();

  const createTestSetMutation = useCreateTestSetMutation();
  const upsertQuestionsMutation = useUpsertQuestionsMutation();

  const [step, setStep] = useState(1);
  const [testSetId, setTestSetId] = useState<string | null>(null);
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);

  // Protect route
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push(ROUTES.DASHBOARD);
    }
  }, [user, router]);

  const testSetForm = useForm<TestSetFormValues>({
    resolver: zodResolver(testSetSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'draft',
      testType: 'interview',
      category: '',
    } as TestSetFormValues,
  });

  // STEP 1: Create Test Set
  const onTestSetSubmit = (values: TestSetFormValues) => {
    createTestSetMutation.mutate(
      {
        name: values.name,
        description: values.description,
        status: values.status,
        testType: 'interview',
      },
      {
        onSuccess: newSet => {
          setTestSetId(newSet._id);
          setStep(2);
          toast.success('Đã tạo đề thi. Mời bạn tải lên file Phỏng vấn.');
        },
        onError: () => toast.error('Lỗi tạo đề thi.'),
      },
    );
  };

  const handleInterviewUpload = async (
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

          const qNumRaw = getVal(['số thứ tự', 'question number', 'câu số']);
          const categoryRaw = getVal(['lĩnh vực', 'category']);
          const questionRaw = getVal(['câu hỏi', 'question']);
          const answerRaw = getVal(['câu trả lời', 'answer']);
          const expRaw = getVal(['giải thích', 'explanation']);

          const qNum = parseInt(String(qNumRaw), 10);

          return {
            questionNumber: qNum,
            part: '1',
            difficulty: 'medium',
            questionText: questionRaw || '',
            category: categoryRaw || '',
            correctAnswer: answerRaw || 'TEXT',
            explanation: expRaw || '',
            options: [],
            isActive: true,
          };
        })
        .filter(q => !isNaN(q.questionNumber) && q.questionText);

      if (questionsToUpsert.length === 0) {
        toast.error('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
        return;
      }

      upsertQuestionsMutation.mutate(
        { testSetId: testSetId || '', questions: questionsToUpsert },
        {
          onSuccess: () => {
            toast.success(
              `Đã tải lên ${questionsToUpsert.length} câu hỏi phỏng vấn!`,
            );
            setStep(3);
          },
          onError: () => toast.error('Lỗi khi lưu câu hỏi.'),
        },
      );
    };
    reader.readAsBinaryString(file);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Layers className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Tạo Bộ Phỏng Vấn Mới
            </h1>
            <p className="text-sm text-muted-foreground">
              Quy trình 2 bước để khởi tạo và tải lên dữ liệu cho một bộ phỏng
              vấn hoàn chỉnh.
            </p>
          </div>
        </div>

        {/* STEPPER UI */}
        <div className="flex items-center justify-between mb-8 px-4 relative z-0">
          <div className="absolute top-4 left-8 right-8 h-0.5 -z-10">
            {/* Background line */}
            <div className="absolute inset-0 bg-border" />
            {/* Active progress line */}
            <div
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-500 ease-in-out"
              style={{ width: `${((Math.min(step, 2) - 1) / 1) * 100}%` }}
            />
          </div>
          {[1, 2].map(num => (
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
                {num === 2 && 'Câu hỏi'}
              </span>
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="bg-primary/5 py-4">
              <CardTitle>Bước 1: Khởi Tạo Bộ Phỏng Vấn</CardTitle>
              <CardDescription>
                Nhập thông tin cơ bản cho bộ câu hỏi.
              </CardDescription>
            </CardHeader>
            <Form {...testSetForm}>
              <form onSubmit={testSetForm.handleSubmit(onTestSetSubmit)}>
                <CardContent className="space-y-4 py-4">
                  <FormField
                    control={testSetForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên chủ đề phỏng vấn</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ví dụ: Frontend Interview 2026"
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
                      <FormItem>
                        <FormLabel>Mô tả chung</FormLabel>
                        <FormControl>
                          <Input placeholder="Dùng để ôn tập..." {...field} />
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
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
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={createTestSetMutation.isPending}
                  >
                    {createTestSetMutation.isPending
                      ? 'Đang tạo...'
                      : 'Lưu và Tiếp Tục'}{' '}
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bước 2: Tải Lên Câu Hỏi Phỏng Vấn</CardTitle>
                  <CardDescription>
                    Upload danh sách câu hỏi phỏng vấn hoặc thêm thủ công.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setIsAddManualOpen(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                  Thêm câu hỏi thủ công
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 py-6 flex flex-col items-center justify-center">
              <div className="flex items-center gap-4 w-full p-4 border rounded-xl bg-secondary/20">
                <FileSpreadsheet className="h-10 w-10 text-emerald-600" />
                <div className="flex-1">
                  <h4 className="font-bold">Template File Phỏng Vấn</h4>
                  <p className="text-xs text-muted-foreground">
                    Tải file mẫu Excel và điền dữ liệu trước khi upload.
                  </p>
                </div>
                <Button variant="outline" onClick={downloadInterviewTemplate}>
                  Tải Template
                </Button>
              </div>

              <div className="border-2 border-dashed border-border rounded-xl p-8 w-full flex flex-col items-center justify-center hover:bg-secondary/10 transition-colors relative">
                {upsertQuestionsMutation.isPending && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-sm font-bold text-primary">
                      Đang xử lý dữ liệu...
                    </p>
                  </div>
                )}
                <Upload className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h4 className="font-bold mb-1">Tải lên file Excel đã điền</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Hỗ trợ định dạng .xlsx
                </p>
                <Input
                  type="file"
                  accept=".xlsx, .xls"
                  className="max-w-xs cursor-pointer"
                  onChange={handleInterviewUpload}
                  disabled={upsertQuestionsMutation.isPending}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-4 border-t">
              <Button type="button" onClick={() => setStep(3)}>
                Hoàn Tất & Tiếp Tục
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 3 (Hoàn tất) */}
        {step === 3 && (
          <Card className="shadow-lg border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold">Hoàn Tất Tạo Bộ Phỏng Vấn!</h2>
              <p className="text-muted-foreground max-w-md">
                Bộ câu hỏi đã được tải lên hoàn chỉnh. Bạn có thể kiểm tra lại
                trong danh sách bộ câu hỏi.
              </p>
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(ROUTES.ADMIN)}
                >
                  Về Danh Sách Đề
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Tạo Bộ Mới
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <AddInterviewQuestionDialog
        isOpen={isAddManualOpen}
        onClose={() => setIsAddManualOpen(false)}
        testSetId={testSetId || ''}
        onSuccess={msg => {
          toast.success(msg);
        }}
      />
    </DashboardLayout>
  );
}

export default function CreateInterviewTestPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-background">
          <div className="h-10 bg-secondary/80 animate-pulse rounded w-32" />
        </div>
      }
    >
      <CreateInterviewTestContent />
    </Suspense>
  );
}
