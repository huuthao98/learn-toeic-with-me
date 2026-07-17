'use client';

import {
  Layers,
  ArrowRight,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Check,
  Loader2,
} from 'lucide-react';
import * as z from 'zod';
import * as XLSX from 'xlsx';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Card,
  CardTitle,
  CardHeader,
  CardFooter,
  CardContent,
  CardDescription,
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
import { useVocabulary } from '@/hooks/useVocabulary';
import { useAuthStore } from '@/store/authStore';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

// Schema cho VocabularySet
const VocabularySetSchema = z.object({
  name: z.string().trim().min(1, 'Tên bộ đề không được để trống'),
  description: z.string(),
  status: z.enum(['draft', 'public', 'private']),
  category: z.string().min(1, 'Vui lòng chọn ngôn ngữ'),
  notifyUsers: z.string().optional(),
  topicsString: z.string().optional(),
});

type VocabularySetFormValues = z.infer<typeof VocabularySetSchema>;

const downloadVocabularyTemplate = () => {
  const instructions = [
    ['HƯỚNG DẪN NHẬP CÂU HỎI TRẮC NGHIỆM / TỪ VỰNG'],
    ['1. File này dùng để đẩy câu hỏi trắc nghiệm (ví dụ: từ vựng, ngữ pháp).'],
    [
      '2. Các cột bắt buộc: "Số thứ tự câu", "Câu hỏi", "Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D", "Đáp án đúng", "Giải thích".',
    ],
    ['3. Cột "Đáp án đúng" phải điền A, B, C hoặc D.'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 80 }];

  const data = [
    {
      'Số thứ tự câu': 1,
      'Câu hỏi': 'Meticulous means...',
      'Đáp án A': 'Very careful and precise',
      'Đáp án B': 'Careless and sloppy',
      'Đáp án C': 'Quick and agile',
      'Đáp án D': 'Angry and aggressive',
      'Đáp án đúng': 'A',
      'Giải thích': 'Meticulous là tính từ chỉ sự tỉ mỉ, cẩn thận.',
    },
  ];

  const wsData = XLSX.utils.json_to_sheet(data);
  wsData['!cols'] = [
    { wch: 15 },
    { wch: 40 },
    { wch: 30 },
    { wch: 30 },
    { wch: 30 },
    { wch: 30 },
    { wch: 15 },
    { wch: 40 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Hướng Dẫn');
  XLSX.utils.book_append_sheet(wb, wsData, 'Template Nhập Liệu');
  XLSX.writeFile(wb, 'Vocabulary_Template.xlsx');
};

export const CreateTestForm = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { useCreateTestSetMutation, useUpsertBulkQuestionsMutation } = useVocabulary();

  const createVocabularySetMutation = useCreateTestSetMutation();
  const upsertQuestionsMutation = useUpsertBulkQuestionsMutation();
  const { useTopicsList } = useTopics();
  const { data: topics, isLoading: loadingTopics } = useTopicsList(true);

  const [step, setStep] = useState(1);
  const [VocabularySetId, setVocabularySetId] = useState<string | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);

  // Protect route
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push(ROUTES.DASHBOARD);
    }
  }, [user, router]);

  const VocabularySetForm = useForm<VocabularySetFormValues>({
    resolver: zodResolver(VocabularySetSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'draft',
      category: 'english',
      notifyUsers: 'false',
      topicsString: '',
    } as VocabularySetFormValues,
  });

  const handleVocabularyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setParsedQuestions([]);
      return;
    }

    const reader = new FileReader();
    reader.onload = evt => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsName =
        wb.SheetNames.find(n => n.includes('Template')) || wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const data = XLSX.utils.sheet_to_json<any>(ws);

      const questionsToUpsert = data
        .map(row => {
          const usedKeys = new Set<string>();
          const getVal = (searchKeys: string[]) => {
            const k = Object.keys(row).find(
              key =>
                !usedKeys.has(key) &&
                searchKeys.some(sk =>
                  key.toLowerCase().includes(sk.toLowerCase()),
                ),
            );
            if (k) usedKeys.add(k);
            return k ? row[k] : undefined;
          };

          const qNumRaw = getVal(['question number']);
          const questionRaw = getVal(['question text']);
          const optARaw = getVal(['option a']);
          const optBRaw = getVal(['option b']);
          const optCRaw = getVal(['option c']);
          const optDRaw = getVal(['option d']);
          const ansRaw = getVal(['correct answer']);
          const expRaw = getVal(['explanation']);
          const pinyinRaw = getVal(['pinyin']);

          const qNum = parseInt(String(qNumRaw), 10);

          const options = [
            { label: 'A', text: optARaw || '' },
            { label: 'B', text: optBRaw || '' },
            { label: 'C', text: optCRaw || '' },
            { label: 'D', text: optDRaw || '' },
          ].filter(o => o.text !== '');

          return {
            questionNumber: qNum,
            questionType: 'multiple_choice',
            questionText: questionRaw || '',
            options: options,
            correctAnswer: String(ansRaw).toUpperCase().trim() || 'A',
            explanation: expRaw,
            isActive: true,
            pinyin: pinyinRaw,
          };
        })
        .filter(
          q =>
            !isNaN(q.questionNumber) &&
            q.questionText !== undefined &&
            String(q.questionText).trim() !== '' &&
            q.options.length > 0,
        );

      if (questionsToUpsert.length === 0) {
        toast.error('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
        setParsedQuestions([]);
        return;
      }

      setParsedQuestions(questionsToUpsert);
      toast.success(`Đã phân tích ${questionsToUpsert.length} câu hỏi hợp lệ!`);
    };
    reader.readAsBinaryString(file);
  };

  const onVocabularySetSubmit = (values: VocabularySetFormValues) => {
    if (parsedQuestions.length === 0) {
      toast.error('Vui lòng tải lên file Excel câu hỏi trước khi tạo đề thi.');
      return;
    }

    createVocabularySetMutation.mutate(
      {
        name: values.name,
        description: values.description,
        status: values.status,
        category: values.category,

        notifyUsers: values.notifyUsers === 'true',
        topics: values.topicsString
          ? values.topicsString
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          : [],
      },
      {
        onSuccess: newSet => {
          setVocabularySetId(newSet._id);
          upsertQuestionsMutation.mutate(
            { testSetId: newSet._id, questions: parsedQuestions },
            {
              onSuccess: () => {
                toast.success('Đã tạo đề thi và tải lên câu hỏi thành công!');
                setStep(2);
              },
              onError: () => toast.error('Lỗi khi lưu câu hỏi.'),
            },
          );
        },
        onError: () => toast.error('Lỗi tạo đề thi.'),
      },
    );
  };

  const isSubmitting =
    createVocabularySetMutation.isPending || upsertQuestionsMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Layers className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Tạo Bộ Đề Trắc Nghiệm Mới
          </h1>
          <p className="text-sm text-muted-foreground">
            Khởi tạo thông tin và tải lên câu hỏi trắc nghiệm / từ vựng.
          </p>
        </div>
      </div>

      {/* STEPPER UI */}
      <div className="flex items-center justify-between mb-8 px-4 relative z-0">
        <div className="absolute top-4 left-8 right-8 h-0.5 -z-10">
          <div className="absolute inset-0 bg-border" />
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
              {num === 2 && 'Hoàn tất'}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-primary/5 py-4">
            <CardTitle>Bước 1: Khởi Tạo & Tải Lên Dữ Liệu</CardTitle>
            <CardDescription>
              Nhập thông tin cơ bản và tải lên file câu hỏi trắc nghiệm.
            </CardDescription>
          </CardHeader>
          <Form {...VocabularySetForm}>
            <form onSubmit={VocabularySetForm.handleSubmit(onVocabularySetSubmit)}>
              <CardContent className="space-y-6 py-6">
                <div className="space-y-4">
                  <div className="flex justify-between gap-4">
                    <FormField
                      control={VocabularySetForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Tên bộ đề</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ví dụ: Vocabulary Test 1"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={VocabularySetForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="w-[25%]">
                          <FormLabel>Ngôn ngữ</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn ngôn ngữ">
                                  {(val: any) => {
                                    if (val === 'english') return 'Tiếng Anh';
                                    if (val === 'chinese') return 'Tiếng Trung';
                                    if (val === 'japanese') return 'Tiếng Nhật';
                                    if (val === 'korean') return 'Tiếng Hàn';
                                    return val || 'Chọn ngôn ngữ';
                                  }}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="english" label="Tiếng Anh">Tiếng Anh</SelectItem>
                              <SelectItem value="chinese" label="Tiếng Trung">Tiếng Trung</SelectItem>
                              <SelectItem value="japanese" label="Tiếng Nhật">Tiếng Nhật</SelectItem>
                              <SelectItem value="korean" label="Tiếng Hàn">Tiếng Hàn</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={VocabularySetForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="w-[25%]">
                          <FormLabel>Trạng thái hiển thị</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn trạng thái">
                                  {(val: any) => {
                                    if (val === 'draft')
                                      return 'Bản Nháp (Draft)';
                                    if (val === 'public')
                                      return 'Công Khai (Public)';
                                    if (val === 'private')
                                      return 'Riêng Tư (Private)';
                                    return val || 'Chọn trạng thái';
                                  }}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem
                                value="draft"
                                label="Bản Nháp (Draft)"
                              >
                                Bản Nháp (Draft)
                              </SelectItem>
                              <SelectItem
                                value="public"
                                label="Công Khai (Public)"
                              >
                                Công Khai (Public)
                              </SelectItem>
                              <SelectItem
                                value="private"
                                label="Riêng Tư (Private)"
                              >
                                Riêng Tư (Private)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={VocabularySetForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả chung</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Dùng để ôn tập từ vựng..."
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between gap-4">
                    <FormField
                      control={VocabularySetForm.control}
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
                          <FormItem className="flex-1">
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
                                      const isSelected =
                                        selectedTopics.includes(topic.code);
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
                                          onClick={() =>
                                            toggleTopic(topic.code)
                                          }
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
                                    Hiện chưa có chủ đề nào được thiết lập trên
                                    hệ thống.
                                  </p>
                                )}
                              </div>
                            </FormControl>
                            <CardDescription className="text-xs">
                              Click vào các thẻ để chọn/bỏ chọn chủ đề.
                            </CardDescription>
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={VocabularySetForm.control}
                      name="notifyUsers"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Thông báo cho người dùng?</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Không">
                                  {(val: any) => {
                                    if (val === 'false') return 'Không';
                                    if (val === 'true')
                                      return 'Có (Gửi ngay khi tạo)';
                                    return val || 'Không';
                                  }}
                                </SelectValue>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="false" label="Không">
                                Không
                              </SelectItem>
                              <SelectItem
                                value="true"
                                label="Có (Gửi ngay khi tạo)"
                              >
                                Có (Gửi ngay khi tạo)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <CardDescription className="text-xs">
                            Nếu "Có" và trạng thái là "Công khai", những người
                            dùng quan tâm đến các chủ đề trên sẽ nhận được thông
                            báo.
                          </CardDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Upload Section */}
                <div className="pt-4 border-t space-y-4">
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="text-base font-semibold">File Excel Câu Hỏi *</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs px-3"
                        onClick={downloadVocabularyTemplate}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                        Tải Mẫu
                      </Button>
                    </div>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleVocabularyUpload}
                      disabled={isSubmitting}
                    />
                    {parsedQuestions.length > 0 && (
                      <p className="text-sm text-emerald-600 font-medium mt-2">
                        ✓ Đã đọc được {parsedQuestions.length} câu hỏi từ file Excel.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end pt-4 border-t">
                <Button
                  type="submit"
                  disabled={isSubmitting || parsedQuestions.length === 0}
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Hoàn Tất & Tạo Đề'}{' '}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}

      {/* STEP 2 (Hoàn tất) */}
      {step === 2 && (
        <Card className="shadow-lg border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="h-20 w-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold">Hoàn Tất Tạo Bộ Đề!</h2>
            <p className="text-muted-foreground max-w-md">
              Bộ câu hỏi đã được tạo và tải lên thành công. Bạn có thể kiểm tra
              lại trong danh sách bộ đề.
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
  );
};
