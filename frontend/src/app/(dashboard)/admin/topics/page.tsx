'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useTopics } from '@/hooks/useTopics';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmModal } from '@/components/ui/confirm-modal';

export default function AdminTopicsPage() {
  const {
    useTopicsList,
    useCreateTopicMutation,
    useUpdateTopicMutation,
    useDeleteTopicMutation,
  } = useTopics();

  const { data: topics, isLoading } = useTopicsList(false); // false to show all including inactive
  const createMutation = useCreateTopicMutation();
  const updateMutation = useUpdateTopicMutation();
  const deleteMutation = useDeleteTopicMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any>(null);
  const [topicToDelete, setTopicToDelete] = useState<any>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true,
  });

  const openCreateDialog = () => {
    setEditingTopic(null);
    setFormData({ code: '', name: '', description: '', isActive: true });
    setIsDialogOpen(true);
  };

  const openEditDialog = (topic: any) => {
    setEditingTopic(topic);
    setFormData({
      code: topic.code,
      name: topic.name,
      description: topic.description || '',
      isActive: topic.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      toast.error('Vui lòng nhập đầy đủ Mã và Tên chủ đề');
      return;
    }

    if (editingTopic) {
      updateMutation.mutate(
        { id: editingTopic._id, data: formData },
        {
          onSuccess: () => {
            toast.success('Cập nhật chủ đề thành công');
            setIsDialogOpen(false);
          },
          onError: () => toast.error('Mã chủ đề đã tồn tại hoặc có lỗi xảy ra'),
        },
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success('Tạo chủ đề thành công');
          setIsDialogOpen(false);
        },
        onError: () => toast.error('Mã chủ đề đã tồn tại hoặc có lỗi xảy ra'),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Xoá chủ đề thành công'),
      onError: () => toast.error('Có lỗi xảy ra khi xoá'),
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Quản lý Chủ Đề (Topics)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Thêm mới và chỉnh sửa các danh mục chủ đề để phân loại đề thi &
              thông báo.
            </p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm Chủ Đề
          </Button>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã (Code)</TableHead>
                <TableHead>Tên hiển thị</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : topics?.length > 0 ? (
                topics.map((topic: any) => (
                  <TableRow key={topic._id}>
                    <TableCell className="font-semibold">
                      {topic.code}
                    </TableCell>
                    <TableCell>{topic.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {topic.description || '-'}
                    </TableCell>
                    <TableCell>
                      {topic.isActive ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
                          <CheckCircle className="h-3.5 w-3.5" /> Hoạt động
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                          <XCircle className="h-3.5 w-3.5" /> Đã ẩn
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(topic)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => setTopicToDelete(topic)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center h-24 text-muted-foreground"
                  >
                    Chưa có chủ đề nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <ConfirmModal
          isOpen={!!topicToDelete}
          onClose={() => setTopicToDelete(null)}
          onConfirm={() => {
            if (topicToDelete) {
              handleDelete(topicToDelete._id);
              setTopicToDelete(null);
            }
          }}
          title="Xác nhận xoá chủ đề?"
          description={`Bạn có chắc muốn xoá chủ đề ${topicToDelete?.name}? Hành động này không thể hoàn tác.`}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTopic ? 'Cập nhật Chủ Đề' : 'Thêm Chủ Đề Mới'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Mã (Code) *</label>
                <Input
                  placeholder="Ví dụ: english, interview, frontend"
                  value={formData.code}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toLowerCase().replace(/\s/g, '-'),
                    })
                  }
                  disabled={!!editingTopic} // Không cho sửa code nếu đã tạo
                />
                <p className="text-[10px] text-muted-foreground">
                  Mã không dấu, viết liền, nối bằng dấu gạch ngang.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Tên hiển thị *</label>
                <Input
                  placeholder="Ví dụ: Tiếng Anh TOEIC"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Mô tả thêm</label>
                <Input
                  placeholder="Mô tả..."
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Trạng thái</label>
                <Select
                  value={formData.isActive ? 'true' : 'false'}
                  onValueChange={val =>
                    setFormData({ ...formData, isActive: val === 'true' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Hoạt động (Active)</SelectItem>
                    <SelectItem value="false">Ẩn (Inactive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Lưu Thay Đổi
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
