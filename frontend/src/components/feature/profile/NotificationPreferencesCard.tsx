import { useState, useEffect } from 'react';
import { Bell, Save, Loader2, Check, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useTopics } from '@/hooks/useTopics';

export function NotificationPreferencesCard() {
  const { user } = useAuthStore();
  const { useUpdateProfileMutation } = useAuth();
  const updateMutation = useUpdateProfileMutation();

  const { useTopicsList } = useTopics();
  const { data: topics, isLoading: loadingTopics } = useTopicsList(true); // activeOnly = true

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user?.notificationTopics) {
      setSelectedTopics(user.notificationTopics);
    }
  }, [user]);

  const toggleTopic = (code: string) => {
    if (!isEditing) return;
    setSelectedTopics(prev =>
      prev.includes(code) ? prev.filter(t => t !== code) : [...prev, code],
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user?.notificationTopics) {
      setSelectedTopics(user.notificationTopics);
    } else {
      setSelectedTopics([]);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(
      { notificationTopics: selectedTopics },
      {
        onSuccess: () => {
          toast.success('Cập nhật sở thích nhận thông báo thành công');
          setIsEditing(false);
        },
        onError: () => {
          toast.error('Lỗi khi cập nhật thông báo');
        },
      },
    );
  };

  return (
    <div className="mt-8 pt-6 border-t border-border/40 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h4 className="text-base font-bold flex items-center gap-2 text-foreground">
            <div className="p-1.5 bg-primary/10 rounded-md text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <span>Sở Thích Thông Báo (Push)</span>
          </h4>
          <p className="text-xs text-muted-foreground mt-1 ml-9">
            Click vào các thẻ để chọn/bỏ chọn. Nhận thông báo khi có đề thi mới
            thuộc chủ đề bạn quan tâm.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-9 sm:ml-0">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              size="sm"
              className="gap-2 font-semibold"
              variant="outline"
            >
              <Edit2 className="h-4 w-4 text-muted-foreground" />
              Chỉnh sửa
            </Button>
          ) : (
            <>
              <Button
                onClick={handleCancel}
                disabled={updateMutation.isPending}
                size="sm"
                variant="ghost"
                className="font-semibold"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                size="sm"
                className="gap-2 font-semibold"
                variant="secondary"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 text-primary" />
                )}
                {updateMutation.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="space-y-3 ml-0 sm:ml-9">
        {loadingTopics ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/20 p-4 rounded-xl">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải danh sách chủ đề...
          </div>
        ) : topics && topics.length > 0 ? (
          <div className="flex flex-wrap gap-2 p-4 bg-secondary/30 rounded-xl border border-border/30">
            {topics.map((topic: any) => {
              const isSelected = selectedTopics.includes(topic.code);
              return (
                <Badge
                  key={topic.code}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`transition-all px-3 py-1.5 text-xs select-none ${
                    isEditing ? 'cursor-pointer ' : 'cursor-default opacity-90 '
                  } ${
                    isSelected
                      ? 'shadow-md ring-2 ring-primary/20 bg-primary text-primary-foreground ' +
                        (isEditing ? 'hover:bg-primary/90' : '')
                      : (isEditing ? 'hover:bg-secondary/80 ' : '') +
                        'bg-background/50 border-border/60 text-muted-foreground'
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
          <p className="text-sm text-muted-foreground italic p-4 bg-secondary/20 rounded-xl">
            Hiện chưa có chủ đề nào được thiết lập trên hệ thống.
          </p>
        )}
      </div>
    </div>
  );
}
