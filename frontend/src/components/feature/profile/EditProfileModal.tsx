import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Tên hiển thị phải có ít nhất 2 ký tự' }),
  phone: z.string().optional(),
  age: z
    .number({ message: 'Tuổi phải là số' })
    .min(5, { message: 'Tuổi không hợp lệ' })
    .max(100, { message: 'Tuổi không hợp lệ' })
    .optional()
    .or(z.literal('')),
  targetScore: z
    .number({ message: 'Mục tiêu điểm số phải là số' })
    .min(0, { message: 'Mục tiêu phải >= 0' })
    .max(990, { message: 'Mục tiêu tối đa 990' })
    .optional()
    .or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user } = useAuthStore();
  const { useUpdateProfileMutation } = useAuth();
  const updateMutation = useUpdateProfileMutation();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      age: user?.age || '',
      targetScore: user?.targetScore || '',
    },
  });

  // Reset form when modal opens with latest user data
  useEffect(() => {
    if (isOpen && user) {
      form.reset({
        fullName: user.fullName || '',
        phone: user.phone || '',
        age: user.age || '',
        targetScore: user.targetScore || '',
      });
    }
  }, [isOpen, user, form]);

  const onSubmit = (values: ProfileFormValues) => {
    const payload: any = {
      fullName: values.fullName,
    };

    if (values.phone) payload.phone = values.phone;
    if (values.age !== '' && values.age !== undefined)
      payload.age = Number(values.age);
    if (values.targetScore !== '' && values.targetScore !== undefined)
      payload.targetScore = Number(values.targetScore);

    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Cập nhật hồ sơ thành công!');
        onClose();
      },
      onError: () => {
        toast.error('Có lỗi xảy ra khi cập nhật hồ sơ');
      },
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa hồ sơ</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin cá nhân và mục tiêu học tập của bạn.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên hiển thị *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập họ và tên..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: 0987654321" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tuổi</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="VD: 25"
                        {...field}
                        onChange={e => {
                          const val = e.target.value;
                          field.onChange(val === '' ? '' : Number(val));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mục tiêu TOEIC</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="VD: 800"
                        {...field}
                        onChange={e => {
                          const val = e.target.value;
                          field.onChange(val === '' ? '' : Number(val));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateMutation.isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Lưu Thay Đổi
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
