import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useInterview } from '@/hooks/useInterview';
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';


const addInterviewQuestionSchema = z.object({
  questionText: z.string().trim().min(1, 'Vui lòng nhập câu hỏi'),
  correctAnswer: z.string().trim().min(1, 'Vui lòng nhập câu trả lời mẫu'),
  explanation: z.string().optional(),
});

type AddInterviewQuestionFormValues = z.infer<
  typeof addInterviewQuestionSchema
>;

export function AddInterviewQuestionDialog({
  isOpen,
  onClose,
  testSetId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  testSetId: string;
  onSuccess?: (msg: string) => void;
}) {
  const { useCreateQuestionMutation } = useInterview();
  const createQuestionMutation = useCreateQuestionMutation();

  const form = useForm<AddInterviewQuestionFormValues>({
    resolver: zodResolver(addInterviewQuestionSchema),
    defaultValues: {
      questionText: '',
      correctAnswer: '',
      explanation: '',
    },
  });

  const onSubmit = (values: AddInterviewQuestionFormValues) => {
    createQuestionMutation.mutate(
      {
        testSetId,
        questionText: values.questionText,
        explanation: values.explanation,
        isActive: true,
      },
      {
        onSuccess: () => {
          onSuccess?.('Đã thêm câu hỏi phỏng vấn thành công!');
          form.reset({
            ...values,
            questionText: '',
            correctAnswer: '',
            explanation: '',
          });
          onClose();
        },
        onError: () => {
          alert('Có lỗi xảy ra khi thêm câu hỏi!');
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-xl">
        <DialogHeader>
          <DialogTitle>Thêm câu hỏi phỏng vấn thủ công</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="questionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Câu hỏi</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Nội dung câu hỏi phỏng vấn..."
                      className="w-full min-h-[80px] p-3 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="correctAnswer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Câu trả lời mẫu</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Câu trả lời gợi ý hoặc barem điểm..."
                      className="w-full min-h-[120px] p-3 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giải thích (Tùy chọn)</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Giải thích thêm cho câu trả lời..."
                      className="w-full min-h-[80px] p-3 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6 pb-0">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit" disabled={createQuestionMutation.isPending}>
                {createQuestionMutation.isPending
                  ? 'Đang lưu...'
                  : 'Lưu câu hỏi'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
