'use client';

import * as z from 'zod';
import * as XLSX from 'xlsx';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Layers, Loader2, FileSpreadsheet, Check } from 'lucide-react';

import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTopics } from '@/hooks/useTopics';
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

import { toeicApi } from '@/api/toeic';
import { useAuthStore } from '@/store/authStore';
import { useToeic } from '@/hooks/useToeic';

import { MediaUploadInput } from '@/components/MediaUploadInput';
import { ROUTES } from '@/constants/routes';

// Schema cho TestSet V2
const testSetSchema = z.object({
  name: z.string().trim().min(1, 'Tên đề thi không được để trống'),
  description: z.string(),
  status: z.enum(['draft', 'public', 'private']),
  audioUrl: z.string().optional(),
  readingPdfUrl: z.string().optional(),
  listeningPdfUrl: z.string().optional(),
  notifyUsers: z.string().optional(),
  topicsString: z.string().optional(),
});

type TestSetFormValues = z.infer<typeof testSetSchema>;

const downloadTemplate = () => {
  const headers = [
    [
      'Số thứ tự câu (question number)',
      'Phần (part)',
      'Đáp án (answer correct)',
      'Giải thích (explanation)',
    ],
  ];

  const wsTemplate = XLSX.utils.aoa_to_sheet(headers);
  wsTemplate['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 50 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template Đáp Án');
  XLSX.writeFile(wb, 'AnswerKey_Template.xlsx');
};

export default function CreateTestToeicPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { useCreateTestSetMutation, useUpsertBulkQuestionsMutation } =
    useToeic();

  const upsertQuestionsMutation = useUpsertBulkQuestionsMutation();
  const { useTopicsList } = useTopics();
  const { data: topics, isLoading: loadingTopics } = useTopicsList(true);

  const [isFinalSaving, setIsFinalSaving] = useState(false);

  const [excelFile, setExcelFile] = useState<File | null>(null);

  // Parsed Questions
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);

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
      audioUrl: '',
      readingPdfUrl: '',
      listeningPdfUrl: '',
      notifyUsers: 'false',
      topicsString: '',
    },
  });

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);

    const reader = new FileReader();
    reader.onload = evt => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname =
        wb.SheetNames.find(name => !name.toLowerCase().includes('hướng dẫn')) ||
        wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const questionsToUpsert = data
        .map((row: any) => {
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
          const answerRaw = getVal(['correct answer', 'đáp án đúng', 'đáp án']);
          const explanationRaw = getVal(['explanation', 'giải thích']);

          const qNum = parseInt(String(qNumRaw), 10);
          const part = String(partRaw).replace(/\D/g, '');

          return {
            questionNumber: qNum,
            part: part,
            correctAnswer: String(answerRaw || '')
              .trim()
              .toUpperCase(),
            explanation: String(explanationRaw || ''),
          };
        })
        .filter(q => !isNaN(q.questionNumber));

      setParsedQuestions(questionsToUpsert);
      toast.success(
        `Đã tải file Excel thành công (${questionsToUpsert.length} câu).`,
      );
    };
    reader.readAsBinaryString(file);
  };

  const onSubmit = async (values: TestSetFormValues) => {
    if (!excelFile || parsedQuestions.length === 0) {
      toast.error(
        'Vui lòng tải lên File Excel đáp án hợp lệ (ít nhất cần có câu hỏi để tạo bộ đề).',
      );
      return;
    }

    setIsFinalSaving(true);
    toast.info('Đang lưu đề thi và đáp án...');

    let testSetId = '';
    // 4. Create Test Set
    try {
      const { topicsString, ...restValues } = values;
      const testSetRes = await toeicApi.createToeicSet({
        ...restValues,

        status: restValues.status,
        notifyUsers: restValues.notifyUsers === 'true',
        topics: topicsString
          ? topicsString
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          : [],
      });
      testSetId = testSetRes._id;
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Tạo thông tin bộ đề thất bại.',
      );
      setIsFinalSaving(false);
      return;
    }

    // 5. Upsert Questions
    upsertQuestionsMutation.mutate(
      { testSetId, questions: parsedQuestions },
      {
        onSuccess: () => {
          toast.success('Hoàn tất! Đã lưu đề thi thành công toàn bộ.');
          setTimeout(() => {
            router.push(ROUTES.ADMIN);
          }, 2000);
          setIsFinalSaving(false);
        },
        onError: err => {
          console.error('Save questions failed:', err);
          toast.error('Tạo bộ đề thành công nhưng lưu câu hỏi thất bại!');
          setIsFinalSaving(false);
        },
      },
    );
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Layers className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Tạo Đề Thi TOEIC
            </h1>
            <p className="text-sm text-muted-foreground">
              Upload nguyên file PDF, Audio và file Excel đáp án.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Tải Template Excel
          </Button>
        </div>

        <Form {...testSetForm}>
          <form
            onSubmit={testSetForm.handleSubmit(onSubmit)}
            className="space-y-6"
          >
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
                              Bản nháp (Draft)
                            </SelectItem>
                            <SelectItem value="public">
                              Công khai (Public)
                            </SelectItem>
                            <SelectItem value="private">
                              Riêng tư (Private)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={testSetForm.control}
                    name="topicsString"
                    render={({ field }) => {
                      const selectedTopics = field.value
                        ? field.value
                            .split(',')
                            .map(s => s.trim())
                            .filter(Boolean)
                        : [];

                      const toggleTopic = (code: string) => {
                        const newSelected = selectedTopics.includes(code)
                          ? selectedTopics.filter(t => t !== code)
                          : [...selectedTopics, code];
                        field.onChange(newSelected.join(','));
                      };

                      return (
                        <FormItem>
                          <FormLabel>Chủ đề (Topics)</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              {loadingTopics ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Đang tải danh sách chủ đề...
                                </div>
                              ) : topics && topics.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {topics.map((topic: any) => {
                                    const isSelected = selectedTopics.includes(
                                      topic.code,
                                    );
                                    return (
                                      <Badge
                                        key={topic.code}
                                        variant={
                                          isSelected ? 'default' : 'outline'
                                        }
                                        className={`cursor-pointer transition-all px-3 py-1.5 text-xs select-none ${
                                          isSelected
                                            ? 'shadow-md ring-2 ring-primary/20'
                                            : 'hover:bg-secondary/80'
                                        }`}
                                        onClick={() => toggleTopic(topic.code)}
                                      >
                                        {isSelected && (
                                          <Check className="h-3 w-3 mr-1.5" />
                                        )}
                                        {topic.name}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">
                                  Hiện chưa có chủ đề nào được thiết lập trên hệ
                                  thống.
                                </p>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={testSetForm.control}
                    name="notifyUsers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thông báo (Push Notification)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Không" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="false">Không</SelectItem>
                            <SelectItem value="true">
                              Có (Gửi ngay khi tạo)
                            </SelectItem>
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
                        <Input
                          placeholder="Mô tả ngắn gọn về đề thi..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <FormField
                    control={testSetForm.control}
                    name="readingPdfUrl"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-semibold text-primary">
                          File PDF Reading Đề Thi (Bắt buộc)
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
                        <p className="text-xs text-muted-foreground mt-1">
                          Chỉ chấp nhận file PDF chứa câu hỏi đề thi
                          (Reading/Writing).
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={testSetForm.control}
                    name="listeningPdfUrl"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-semibold text-primary">
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
                        <p className="text-xs text-muted-foreground mt-1">
                          File PDF chứa nội dung phần nghe (Listening).
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={testSetForm.control}
                    name="audioUrl"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-semibold text-primary">
                          File Audio Tổng (Part 1-4) *
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

                  <div className="space-y-2 md:col-span-2">
                    <FormLabel>File Excel Đáp Án & Giải Thích *</FormLabel>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                    />
                    {parsedQuestions.length > 0 && (
                      <p className="text-sm text-emerald-600 font-medium">
                        ✓ Đã đọc được {parsedQuestions.length} câu hỏi từ file
                        Excel.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/50 justify-end py-4">
                <Button
                  type="submit"
                  disabled={isFinalSaving}
                  className="gap-2"
                >
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
    </>
  );
}
