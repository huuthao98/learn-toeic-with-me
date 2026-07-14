'use client';

import { Bell } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NotificationTable } from '@/components/feature/admin/notifications/NotificationTable';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useState } from 'react';

export default function AdminNotificationsPage() {
  const [page, setPage] = useState(1);
  const { useCampaignsList } = useAdminNotifications();
  const { data, isLoading, isError } = useCampaignsList(page, 20);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Bell className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Quản lý Thông báo Push
            </h1>
            <p className="text-sm text-muted-foreground">
              Gửi và quản lý thông báo tới người dùng hệ thống.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải dữ liệu...</div>
        ) : isError ? (
          <div className="text-center py-12 text-destructive">Lỗi khi tải dữ liệu. Vui lòng thử lại.</div>
        ) : (
          <NotificationTable campaigns={data?.data || []} />
        )}
      </div>
    </DashboardLayout>
  );
}
