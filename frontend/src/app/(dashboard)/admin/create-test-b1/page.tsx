'use client';

import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Layers, Loader2, FileJson, Check } from 'lucide-react';

import { Card, CardTitle, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
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

import { b1Api } from '@/api/b1';
import { useAuthStore } from '@/store/authStore';
import { useB1 } from '@/hooks/useB1';

import { MediaUploadInput } from '@/components/MediaUploadInput';
import { ROUTES } from '@/constants/routes';

const testSetSchema = z.object({
  name: z.string().trim().min(1, 'Tên đề thi không được để trống'),
  description: z.string().optional(),
  status: z.enum(['draft', 'public', 'private']),
  accessLevel: z.enum(['external', 'vip0', 'vip1', 'vip2', 'vip3']),
  audioUrl: z.string().optional(),
  topicsString: z.string().optional(),
});

type TestSetFormValues = z.infer<typeof testSetSchema>;

export default function CreateTestB1Page() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { useUpsertBulkQuestionsMutation } = useB1();

  const upsertQuestionsMutation = useUpsertBulkQuestionsMutation();
  const { useTopicsList } = useTopics();
  const { data: topics, isLoading: loadingTopics } = useTopicsList(true);

  const [isFinalSaving, setIsFinalSaving] = useState(false);
  const [jsonFile, setJsonFile] = useState<File | null>(null);

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
      accessLevel: 'external',
      audioUrl: '',
      topicsString: '',
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJsonFile(file);

    if (file.name.toLowerCase().endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const jsonStr = evt.target?.result as string;
          const data = JSON.parse(jsonStr);
          if (data && Array.isArray(data)) {
            // Validate B1 format
            const questionsToUpsert = data.filter((q: any) => q.skill && q.questionType);
            setParsedQuestions(questionsToUpsert);
            toast.success(`Đã tải file JSON thành công (${questionsToUpsert.length} câu).`);
          } else {
            toast.error('File JSON không hợp lệ (cần là mảng câu hỏi).');
          }
        } catch (err) {
          toast.error('Lỗi khi đọc file JSON. Vui lòng kiểm tra lại định dạng.');
        }
      };
      reader.readAsText(file);
    } else {
      toast.error('Chỉ hỗ trợ file JSON được trích xuất từ AI.');
    }
  };

  const onSubmit = async (values: TestSetFormValues) => {
    if (!jsonFile || parsedQuestions.length === 0) {
      toast.error('Vui lòng tải lên File JSON hợp lệ (ít nhất cần có câu hỏi để tạo bộ đề).');
      return;
    }

    setIsFinalSaving(true);
    toast.info('Đang lưu đề thi B1...');

    let testSetId = '';
    try {
      const { topicsString, ...restValues } = values;
      const testSetRes = await b1Api.createTestSet({
        ...restValues,
        status: restValues.status,
        topics: topicsString
          ? topicsString
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          : [],
      });
      testSetId = testSetRes._id;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Tạo thông tin bộ đề thất bại.');
      setIsFinalSaving(false);
      return;
    }

    upsertQuestionsMutation.mutate(
      { setId: testSetId, questions: parsedQuestions },
      {
        onSuccess: () => {
          toast.success('Hoàn tất! Đã lưu đề thi B1 thành công toàn bộ.');
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
            <h1 className="text-2xl font-bold tracking-tight">Tạo Đề Thi B1 (VSTEP)</h1>
            <p className="text-sm text-muted-foreground">
              Tạo đề thi 4 kỹ năng. Yêu cầu tải lên file JSON câu hỏi được xuất
            </p>
          </div>
        </div>

        <Form {...testSetForm}>
          <form onSubmit={testSetForm.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="shadow-lg border-primary/20">
              <CardHeader className="bg-primary/5 py-4">
                <CardTitle>Thông tin chung & Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 py-4">
                <FormField
                  control={testSetForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên đề thi *</FormLabel>
                      <FormControl>
                        <Input placeholder="VSTEP B1 Test 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4 items-center">
                  {/* <FormField
                    control={testSetForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Loại đề</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại đề" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="practice">
                              Luyện tập (Practice)
                            </SelectItem>
                            <SelectItem value="exam">Thi thử (Exam)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}
                  <FormField
                    control={testSetForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Trạng thái</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                  <FormField
                    control={testSetForm.control}
                    name="accessLevel"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Phạm vi truy cập</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn phạm vi" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="external">External (Công khai)</SelectItem>
                            <SelectItem value="vip0">Member (Đăng nhập)</SelectItem>
                            <SelectItem value="vip1">VIP 1 (Silver)</SelectItem>
                            <SelectItem value="vip2">VIP 2 (Gold)</SelectItem>
                            <SelectItem value="vip3">VIP 3 (Platinum)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
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
                                    const isSelected = selectedTopics.includes(topic.code);
                                    return (
                                      <Badge
                                        key={topic.code}
                                        variant={isSelected ? 'default' : 'outline'}
                                        className={`cursor-pointer transition-all px-3 py-1.5 text-xs select-none ${
                                          isSelected
                                            ? 'shadow-md ring-2 ring-primary/20'
                                            : 'hover:bg-secondary/80'
                                        }`}
                                        onClick={() => toggleTopic(topic.code)}
                                      >
                                        {isSelected && <Check className="h-3 w-3 mr-1.5" />}
                                        {topic.name}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">
                                  Hiện chưa có chủ đề nào được thiết lập trên hệ thống.
                                </p>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
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
                  <FormField
                    control={testSetForm.control}
                    name="audioUrl"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-semibold text-primary">
                          File Audio (Cho kỹ năng Nghe)
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

                  <div className="space-y-2">
                    <FormLabel className="font-semibold text-primary">File JSON Câu hỏi*</FormLabel>
                    <Input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                    {parsedQuestions.length > 0 && (
                      <p className="text-sm text-emerald-600 font-medium flex items-center mt-2">
                        <Check className="w-4 h-4 mr-1" />
                        Đã sẵn sàng {parsedQuestions.length} câu hỏi.
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
                  {isFinalSaving ? 'Đang lưu...' : 'Lưu Đề Thi B1'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </>
  );
}
