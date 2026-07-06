'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadApi } from '@/api/upload';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Copy,
  Video,
  Music,
  Trash2,
  Loader2,
  FileText,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';

export default function MediaManagerPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push(ROUTES.DASHBOARD);
    }
  }, [user, router]);

  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['media'],
    queryFn: () => uploadApi.listMedia(),
    refetchOnWindowFocus: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (item: any) =>
      uploadApi.deleteMedia(item.public_id, item.resource_type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setDeleteItem(null);
      toast.success('Media deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete media');
    },
  });

  const resources = data?.resources || [];

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Copied to clipboard');
  };

  const renderThumbnail = (item: any) => {
    if (item.resource_type === 'image') {
      if (item.format === 'pdf') {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/30 text-rose-600">
            <FileText className="w-12 h-12 mb-2" />
            <span className="text-xs font-semibold">PDF</span>
          </div>
        );
      }
      return (
        <img
          src={item.secure_url}
          alt={item.public_id}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      );
    }

    // For audio/video
    if (item.resource_type === 'video') {
      if (item.format === 'mp3' || item.format === 'wav') {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/30 text-emerald-600">
            <Music className="w-12 h-12 mb-2" />
            <span className="text-xs font-semibold">Audio</span>
          </div>
        );
      }
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/30 text-blue-600">
          <Video className="w-12 h-12 mb-2" />
          <span className="text-xs font-semibold">Video</span>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/30 text-muted-foreground">
        <ImageIcon className="w-12 h-12 mb-2" />
        <span className="text-xs font-semibold">Unknown</span>
      </div>
    );
  };

  if (user && user.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-primary" />
              Quản Lý Media (Cloudinary)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Xem, xoá và copy đường dẫn hình ảnh/âm thanh đã tải lên hệ thống.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="ml-3 font-semibold text-muted-foreground">
              Đang tải dữ liệu...
            </span>
          </div>
        ) : isError ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">
              Lỗi khi tải dữ liệu từ Cloudinary.
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {resources.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed">
                  Chưa có file nào được tải lên.
                </div>
              ) : (
                resources.map((item: any) => (
                  <Card
                    key={item.public_id}
                    className="overflow-hidden group border-primary/10 hover:border-primary/30 transition-colors shadow-sm"
                  >
                    <div className="aspect-square relative overflow-hidden bg-muted">
                      {/* Hover Actions overlay */}
                      {renderThumbnail(item)}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full bg-white/90 hover:bg-white text-black text-xs h-8"
                          onClick={() => handleCopy(item.secure_url)}
                        >
                          {copySuccess === item.secure_url ? (
                            <span className="text-emerald-600 font-bold">
                              Đã Copy!
                            </span>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1.5" /> Copy URL
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full text-xs h-8"
                          onClick={() => setDeleteItem(item)}
                        >
                          <Trash2 className="w-3 h-3 mr-1.5" /> Xoá File
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-3 bg-card border-t border-border/50 flex flex-col justify-between">
                      <div
                        className="truncate text-xs font-semibold mb-1"
                        title={item.public_id}
                      >
                        {item.public_id.split('/').pop()}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span className="uppercase font-bold text-primary/70">
                          {item.format}
                        </span>
                        <span>{(item.bytes / 1024).toFixed(1)} KB</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Dialog
              open={!!deleteItem}
              onOpenChange={open => !open && setDeleteItem(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Xác nhận xoá file</DialogTitle>
                  <DialogDescription>
                    Bạn có chắc chắn muốn xoá file{' '}
                    <strong>{deleteItem?.public_id?.split('/').pop()}</strong>{' '}
                    khỏi Cloudinary không? Hành động này không thể hoàn tác và
                    nếu file này đang được dùng trong đề thi, người dùng sẽ
                    không tải được nội dung.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteItem(null)}
                    disabled={deleteMutation.isPending}
                  >
                    Huỷ
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(deleteItem)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Xác Nhận Xoá
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
