'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Check, Hash } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { topicsApi, TopicPayload } from '@/api/topics';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';

export default function OnboardingTopicsPage() {
  const router = useRouter();
  const { useUpdateProfileMutation } = useAuth();
  const { user, isAuthenticated } = useAuthStore();
  const updateProfileMutation = useUpdateProfileMutation();

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Fetch topics
  const { data, isLoading, isError } = useQuery({
    queryKey: ['topics', 'active'],
    queryFn: () => topicsApi.getTopics(true),
  });

  // Init selected topics if user already has some
  useEffect(() => {
    if (user?.notificationTopics) {
      setSelectedTopics(user.notificationTopics);
    }
  }, [user]);

  // If not authenticated (somehow reached here), redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
    }
  }, [isAuthenticated, router]);

  const handleToggleTopic = (topicCode: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicCode)
        ? prev.filter(c => c !== topicCode)
        : [...prev, topicCode],
    );
  };

  const handleContinue = () => {
    updateProfileMutation.mutate(
      { notificationTopics: selectedTopics },
      {
        onSuccess: () => {
          toast.success('Đã lưu chủ đề quan tâm');
          router.push(ROUTES.DASHBOARD);
        },
        onError: () => {
          toast.error('Lỗi khi lưu thông tin. Vui lòng thử lại.');
        },
      },
    );
  };

  const handleSkip = () => {
    router.push(ROUTES.DASHBOARD);
  };

  const topics: TopicPayload[] = data || [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/5 blur-3xl" />

      <Card className="w-full max-w-2xl border shadow-xl bg-background/60 backdrop-blur-xl relative z-10">
        <CardHeader className="text-center space-y-2 pb-8 pt-10">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Chủ đề bạn quan tâm
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground max-w-md mx-auto">
            Chọn các chủ đề bạn muốn tập trung ôn luyện. Chúng tôi sẽ gợi ý bài
            thi và gửi thông báo phù hợp nhất với mục tiêu của bạn.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div
                  key={i}
                  className="h-24 w-full rounded-xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-destructive border rounded-xl bg-destructive/5">
              <p>Không thể tải danh sách chủ đề.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Thử lại
              </Button>
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-xl border-dashed">
              Chưa có chủ đề nào được tạo.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto p-2 -m-2">
              {topics.map(topic => {
                const isSelected = selectedTopics.includes(topic.code);
                return (
                  <div
                    key={topic.code}
                    onClick={() => handleToggleTopic(topic.code)}
                    className={`
                      relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                      flex flex-col gap-1 hover:shadow-md
                      ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/40 hover:bg-muted/30'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 text-primary">
                        <Hash className="h-4 w-4" />
                        <span className="font-semibold">{topic.name}</span>
                      </div>
                      <div
                        className={`
                        w-5 h-5 rounded-full flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border border-border'}
                      `}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                    </div>
                    {topic.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {topic.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-10">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
          >
            Bỏ qua bước này
          </Button>

          <Button
            onClick={handleContinue}
            disabled={updateProfileMutation.isPending || isLoading}
            className="w-full sm:w-auto gap-2 px-8"
          >
            {updateProfileMutation.isPending ? (
              'Đang lưu...'
            ) : (
              <>
                Tiếp tục <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
