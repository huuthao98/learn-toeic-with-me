'use client';

import { useState } from 'react';
import { Edit, Eye, Trash2, Send } from 'lucide-react';
import { format } from 'date-fns';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Badge } from '@/components/ui/badge';
import { NotificationCampaign, NotificationModal } from './NotificationModal';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';

interface NotificationTableProps {
  campaigns: NotificationCampaign[];
}

export function NotificationTable({ campaigns }: NotificationTableProps) {
  const { useDeleteCampaignMutation } = useAdminNotifications();
  const deleteMutation = useDeleteCampaignMutation();
  
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    campaign: NotificationCampaign | null;
  }>({
    isOpen: false,
    mode: 'create',
    campaign: null,
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreate = () => {
    setModalState({ isOpen: true, mode: 'create', campaign: null });
  };

  const handleEdit = (campaign: NotificationCampaign) => {
    setModalState({ isOpen: true, mode: 'edit', campaign });
  };

  const handleView = (campaign: NotificationCampaign) => {
    setModalState({ isOpen: true, mode: 'view', campaign });
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId, {
        onSettled: () => setDeleteConfirmId(null)
      });
    }
  };

  const getTargetLabel = (target: { type: string, value: any }) => {
    switch (target?.type) {
      case 'ALL': return <Badge variant="secondary">Tất cả</Badge>;
      case 'PLAN': return <Badge variant="outline">Gói: {target.value}</Badge>;
      case 'TOPICS': return <Badge variant="outline">Chủ đề: {(target.value || []).join(', ')}</Badge>;
      case 'USER': return <Badge variant="outline">User ID</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'SENT': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Đã gửi</Badge>;
      case 'FAILED': return <Badge variant="destructive">Thất bại</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Danh sách chiến dịch</h2>
        <Button onClick={handleCreate} className="gap-2">
          <Send className="h-4 w-4" />
          Gửi thông báo mới
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Đối tượng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thành công / Thất bại</TableHead>
              <TableHead>Ngày gửi</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Chưa có thông báo nào được gửi.
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => (
                <TableRow key={campaign._id}>
                  <TableCell className="font-medium max-w-[200px] truncate" title={campaign.title}>
                    {campaign.title}
                  </TableCell>
                  <TableCell>
                    {getTargetLabel(campaign.target)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(campaign.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="text-green-500">{campaign.successCount || 0}</span> / <span className="text-destructive">{campaign.failureCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(campaign.createdAt), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleView(campaign)} title="Xem chi tiết">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(campaign)} title="Sửa thông báo">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirmId(campaign._id)} title="Xóa">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <NotificationModal 
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        campaign={modalState.campaign}
        onClose={() => setModalState({ isOpen: false, mode: 'create', campaign: null })}
      />

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDelete}
        title="Xóa thông báo"
        description="Bạn có chắc chắn muốn xóa thông báo này? Hành động này sẽ xóa thông báo khỏi thiết bị của tất cả người dùng và không thể hoàn tác."
        confirmText={deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
        cancelText="Hủy"
        variant="destructive"
      />
    </div>
  );
}
