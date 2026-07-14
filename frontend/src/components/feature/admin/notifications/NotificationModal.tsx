'use client';

import { useEffect } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, Save } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from '@/components/ui/select';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useTopics } from '@/hooks/useTopics';

const notificationSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  body: z.string().min(1, 'Nội dung không được để trống'),
  targetType: z.enum(['all', 'plan', 'topics', 'user']).optional(),
  plan: z.string().optional(),
  topicsString: z.string().optional(),
  userId: z.string().optional(),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export interface NotificationCampaign {
  _id: string;
  title: string;
  body: string;
  target: { type: string; value: any };
  status: string;
  successCount: number;
  failureCount: number;
  createdAt: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  campaign?: NotificationCampaign | null;
}

export function NotificationModal({
  isOpen,
  onClose,
  mode,
  campaign,
}: NotificationModalProps) {
  const { useCreateCampaignMutation, useUpdateCampaignMutation } =
    useAdminNotifications();
  const createMutation = useCreateCampaignMutation();
  const updateMutation = useUpdateCampaignMutation();

  const { useTopicsList } = useTopics();
  const { data: topicsData } = useTopicsList(true);
  const topics = Array.isArray(topicsData)
    ? topicsData
    : topicsData?.data || [];

  const isReadOnly = mode === 'view';

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      body: '',
      targetType: 'all',
      plan: 'free',
      topicsString: '',
      userId: '',
    },
  });

  useEffect(() => {
    if (campaign && (mode === 'edit' || mode === 'view')) {
      form.reset({
        title: campaign.title,
        body: campaign.body,
        targetType: (campaign.target?.type.toLowerCase() as any) || 'all',
        plan: campaign.target?.type === 'PLAN' ? campaign.target.value : 'free',
        topicsString:
          campaign.target?.type === 'TOPICS'
            ? (campaign.target.value || []).join(', ')
            : '',
        userId: campaign.target?.type === 'USER' ? campaign.target.value : '',
      });
    } else if (mode === 'create') {
      form.reset({
        title: '',
        body: '',
        targetType: 'all',
        plan: 'free',
        topicsString: '',
        userId: '',
      });
    }
  }, [campaign, mode, form]);

  const watchTargetType = form.watch('targetType');

  const onSubmit = (values: NotificationFormValues) => {
    if (mode === 'edit' && campaign) {
      updateMutation.mutate(
        {
          id: campaign._id,
          payload: { title: values.title, body: values.body },
        },
        {
          onSuccess: () => onClose(),
        },
      );
      return;
    }

    if (mode === 'create') {
      const payload: any = {
        title: values.title,
        body: values.body,
      };

      if (values.targetType === 'plan') {
        payload.plan = values.plan;
      } else if (values.targetType === 'topics') {
        payload.topics = values.topicsString
          ? values.topicsString
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          : [];
      } else if (values.targetType === 'user') {
        payload.userId = values.userId;
      }

      createMutation.mutate(payload, {
        onSuccess: () => onClose(),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' && 'Tạo Thông Báo Mới'}
            {mode === 'edit' && 'Chỉnh Sửa Thông Báo'}
            {mode === 'view' && 'Chi Tiết Thông Báo'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề *</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isReadOnly}
                      placeholder="Ví dụ: Cập nhật tính năng mới"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nội dung *</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isReadOnly}
                      placeholder="Ví dụ: Hệ thống đã ra mắt..."
                      {...field}
                      height={200}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(mode === 'create' || mode === 'view') && (
              <div className="pt-2 mt-4">
                <FormField
                  control={form.control}
                  name="targetType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Đối tượng nhận</FormLabel>
                      <Select
                        disabled={isReadOnly}
                        onValueChange={field.onChange}
                        value={field.value}
                        items={{
                          all: 'Tất cả người dùng',
                          plan: 'Theo gói (Plan)',
                          topics: 'Theo chủ đề (Topics)',
                          user: 'Người dùng cụ thể',
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn đối tượng" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">Tất cả người dùng</SelectItem>
                          <SelectItem value="plan">Theo gói (Plan)</SelectItem>
                          <SelectItem value="topics">
                            Theo chủ đề (Topics)
                          </SelectItem>
                          <SelectItem value="user">
                            Người dùng cụ thể
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchTargetType === 'plan' && (
                  <FormField
                    control={form.control}
                    name="plan"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Gói thành viên</FormLabel>
                        <Select
                          disabled={isReadOnly}
                          onValueChange={field.onChange}
                          value={field.value || 'free'}
                          items={{
                            free: 'Free',
                            premium: 'Premium',
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn gói" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchTargetType === 'topics' && (
                  <FormField
                    control={form.control}
                    name="topicsString"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Chủ đề</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2">
                            {topics.map((t: any) => {
                              const currentTopics = field.value
                                ? field.value
                                    .split(',')
                                    .map((s: string) => s.trim())
                                    .filter(Boolean)
                                : [];
                              const isSelected = currentTopics.includes(t.code);
                              return (
                                <Badge
                                  key={t.code}
                                  variant={isSelected ? 'default' : 'outline'}
                                  className={`cursor-pointer ${isReadOnly ? 'opacity-50 pointer-events-none' : ''}`}
                                  onClick={() => {
                                    if (isReadOnly) return;
                                    let newTopics;
                                    if (isSelected) {
                                      newTopics = currentTopics.filter(
                                        c => c !== t.code,
                                      );
                                    } else {
                                      newTopics = [...currentTopics, t.code];
                                    }
                                    field.onChange(newTopics.join(', '));
                                  }}
                                >
                                  {t.name}
                                </Badge>
                              );
                            })}
                            {topics.length === 0 && (
                              <div className="text-sm text-slate-500">
                                Đang tải chủ đề...
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {watchTargetType === 'user' && (
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>User ID</FormLabel>
                        <FormControl>
                          <Input
                            disabled={isReadOnly}
                            placeholder="Nhập ID người dùng"
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

            {!isReadOnly && (
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isPending} className="gap-2">
                  {mode === 'create' ? (
                    <Send className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isPending
                    ? 'Đang xử lý...'
                    : mode === 'create'
                      ? 'Gửi Thông Báo'
                      : 'Lưu Thay Đổi'}
                </Button>
              </DialogFooter>
            )}

            {isReadOnly && (
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Đóng
                </Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
