'use client';

import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  FileSpreadsheet
} from 'lucide-react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as XLSX from 'xlsx';

import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
  CardFooter
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

import { uploadApi } from '@/api/upload';
import { testsApi } from '@/api/tests';
import { useAuthStore } from '@/store/authStore';
import { useQuestions } from '@/hooks/useQuestions';

// Schema cho TestSet V2
const testSetSchema = z.object({
  name: z.string().trim().min(1, 'Tên đề thi không được để trống'),
  description: z.string(),
  status: z.enum(['draft', 'public', 'private']),
});

type TestSetFormValues = z.infer<typeof testSetSchema>;

const downloadV2Template = () => {
  const instructions = [
    ['HƯỚNG DẪN NHẬP ĐÁP ÁN V2 (PDF + BUBBLE SHEET)'],
    ['1. File này dùng để đẩy đáp án và giải thích cho đề thi V2.'],
    ['2. Các cột bắt buộc: "Số thứ tự câu", "Phần (Part)", "Đáp án", "Giải thích".'],
    ['3. Đáp án đúng của Part 2 là A, B hoặc C. Các Part khác là A, B, C hoặc D.'],
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
      'Đáp án': '',
      'Giải thích': '',
    };
  });

  const wsData = XLSX.utils.json_to_sheet(data);
  wsData['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Hướng Dẫn');
  XLSX.utils.book_append_sheet(wb, wsData, 'Template Đáp Án V2');
  XLSX.writeFile(wb, 'AnswerKey_V2_Template.xlsx');
};

export default function CreateTestV2Page() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { useUpsertQuestionsMutation } = useQuestions();

  const upsertQuestionsMutation = useUpsertQuestionsMutation();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isFinalSaving, setIsFinalSaving] = useState(false);

  // Files
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  
  // Parsed Questions
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);

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
      status: 'draft',
    },
  });

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames.find((name) => !name.toLowerCase().includes('hướng dẫn')) || wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const questionsToUpsert = data
        .map((row: any) => {
          const getVal = (keys: string[]) => {
            for (const key of keys) {
              const foundKey = Object.keys(row).find((k) => k.toLowerCase().includes(key));
              if (foundKey) return row[foundKey];
            }
            return undefined;
          };

          const qNumRaw = getVal(['số thứ tự', 'question number', 'câu số']);
          const partRaw = getVal(['phần', 'part']);
          const answerRaw = getVal(['đáp án', 'answer', 'correct']);
          const explanationRaw = getVal(['giải thích', 'explanation']);

          const qNum = parseInt(String(qNumRaw), 10);
          const part = String(partRaw).replace(/\D/g, '');

          // Generate dummy options
          const options = [
            { label: 'A', text: 'Option A' },
            { label: 'B', text: 'Option B' },
            { label: 'C', text: 'Option C' },
          ];
          if (part !== '2') {
            options.push({ label: 'D', text: 'Option D' });
          }

          return {
            questionNumber: qNum,
            part: part,
            questionText: 'See PDF', // dummy
            options: options,
            correctAnswer: String(answerRaw || '').trim().toUpperCase(),
            explanation: String(explanationRaw || ''),
            difficulty: 'medium',
          };
        })
        .filter((q) => !isNaN(q.questionNumber));

      setParsedQuestions(questionsToUpsert);
      setSuccessMsg(`Đã tải file Excel thành công (${questionsToUpsert.length} câu).`);
    };
    reader.readAsBinaryString(file);
  };

  const onSubmit = async (values: TestSetFormValues) => {
    if (!pdfFile || !audioFile || !excelFile || parsedQuestions.length === 0) {
      setErrorMsg('Vui lòng tải lên đầy đủ file PDF, Audio và File Excel hợp lệ.');
      return;
    }

    setIsFinalSaving(true);
    setErrorMsg(null);
    setSuccessMsg('Đang tải file lên Cloudinary và lưu dữ liệu, vui lòng không tắt trang...');

    try {
      // 1. Upload PDF & Audio
      const pdfUploadRes = await uploadApi.uploadMedia(pdfFile);
      const audioUploadRes = await uploadApi.uploadMedia(audioFile);

      // 2. Create Test Set
      const testSetRes = await testsApi.createTestSet({
        ...values,
        audioUrl: audioUploadRes.url,
        pdfUrl: pdfUploadRes.url,
        status: values.status,
      });

      const testSetId = testSetRes._id;

      // 3. Upsert Questions
      upsertQuestionsMutation.mutate(
        { testSetId, questions: parsedQuestions },
        {
          onSuccess: () => {
            setSuccessMsg('Hoàn tất! Đã lưu đề thi V2 thành công.');
            setIsFinalSaving(false);
            setTimeout(() => {
              router.push('/practice');
            }, 2000);
          },
          onError: (err) => {
            console.error(err);
            setErrorMsg('Lỗi khi lưu câu hỏi.');
            setIsFinalSaving(false);
          },
        }
      );
    } catch (err) {
      console.error(err);
      setErrorMsg('Đã xảy ra lỗi trong quá trình lưu đề thi. Vui lòng thử lại.');
      setIsFinalSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Layers className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Tạo Đề Thi V2</h1>
            <p className="text-sm text-muted-foreground">
              Phiên bản 2: Upload nguyên file PDF, Audio và file Excel đáp án.
            </p>
          </div>
          <Button variant="outline" onClick={downloadV2Template} className="gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Tải Template Excel V2
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

        <Form {...testSetForm}>
          <form onSubmit={testSetForm.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="shadow-lg border-primary/20">
              <CardHeader className="bg-primary/5 py-4">
                <CardTitle>Thông tin chung & Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={testSetForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên đề thi *</FormLabel>
                        <FormControl>
                          <Input placeholder="TOEIC Test 2026 V2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={testSetForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trạng thái</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Bản nháp (Draft)</SelectItem>
                            <SelectItem value="public">Công khai (Public)</SelectItem>
                            <SelectItem value="private">Riêng tư (Private)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={testSetForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả chung</FormLabel>
                      <FormControl>
                        <Input placeholder="Mô tả ngắn gọn về đề thi..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-2">
                    <FormLabel>File PDF Đề Thi *</FormLabel>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground">Chỉ chấp nhận file PDF chứa toàn bộ 200 câu hỏi.</p>
                  </div>

                  <div className="space-y-2">
                    <FormLabel>File Audio Tổng (Part 1-4) *</FormLabel>
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <FormLabel>File Excel Đáp Án & Giải Thích *</FormLabel>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                    />
                    {parsedQuestions.length > 0 && (
                      <p className="text-sm text-emerald-600 font-medium">
                        ✓ Đã đọc được {parsedQuestions.length} câu hỏi từ file Excel.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 justify-end py-4">
                <Button type="submit" disabled={isFinalSaving} className="gap-2">
                  {isFinalSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isFinalSaving ? 'Đang lưu...' : 'Lưu Đề Thi V2'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
