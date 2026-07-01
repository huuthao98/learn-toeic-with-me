'use client';

import {
  ShieldCheck,
  Layers,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';

import { useTests } from '@/hooks/useTests';
import { useAuthStore } from '@/store/authStore';
import { useQuestions } from '@/hooks/useQuestions';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Protect page
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const { useTestSets, useDeleteTestSetMutation } = useTests();

  const { data: testSets, isLoading: loadingTests } = useTestSets();

  const deleteTestSetMutation = useDeleteTestSetMutation();

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDeleteTestSet = (id: string) => {
    if (
      confirm(
        'Bạn có chắc chắn muốn xóa toàn bộ đề thi này? Mọi câu hỏi và kết quả thi liên quan cũng sẽ bị xóa vĩnh viễn!',
      )
    ) {
      deleteTestSetMutation.mutate(id, {
        onSuccess: () => {
          setSuccessMsg('Xóa đề thi thành công!');
          setTimeout(() => setSuccessMsg(null), 3000);
        },
        onError: (err: any) => {
          setErrorMsg(err.response?.data?.message || 'Xóa đề thi thất bại.');
          setTimeout(() => setErrorMsg(null), 3000);
        },
      });
    }
  };

  if (user && user.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Title greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
              <span className="text-gradient">Cổng Quản Trị</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý danh sách các đề thi thử.
            </p>
          </div>

          <Link href="/admin/create-test-v2">
            <Button className="font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30 flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Tạo đề thi mới</span>
            </Button>
          </Link>
        </div>

        {/* Global Messages */}
        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Test Sets Grid Layout */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Layers className="h-5 w-5 text-indigo-500" />
              <span>Danh Sách Bộ Đề Thi ({testSets?.length || 0})</span>
            </h2>
          </div>

          {loadingTests ? (
            <div className="flex flex-wrap gap-8 items-start">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="flex-1 min-w-[320px] flex flex-col gap-4"
                >
                  <div className="h-8 bg-secondary/60 animate-pulse rounded w-1/3" />
                  <div className="h-44 bg-secondary/60 animate-pulse rounded-2xl" />
                </div>
              ))}
            </div>
          ) : testSets && testSets.length > 0 ? (
            <div className="flex flex-wrap gap-8 items-start">
              {(() => {
                const groupedSets = testSets.reduce(
                  (acc, set) => {
                    const type = set.testType || 'other';
                    if (!acc[type]) acc[type] = [];
                    acc[type].push(set);
                    return acc;
                  },
                  {} as Record<string, typeof testSets>,
                );

                const testTypes = Object.keys(groupedSets).sort();

                return testTypes.map(type => (
                  <div
                    key={type}
                    className="flex-1 min-w-[400px] max-w-[500px] flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                      <h3 className="font-bold text-base uppercase text-muted-foreground tracking-wider">
                        {type === 'other' ? 'Khác' : type}
                      </h3>
                      <span className="bg-secondary/50 text-secondary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                        {groupedSets[type].length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-4">
                      {groupedSets[type].map(set => (
                        <div
                          key={set._id}
                          className="group relative flex flex-col glass-card border border-border/40 hover:border-indigo-400/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <div className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDeleteTestSet(set._id)}
                              disabled={deleteTestSetMutation.isPending}
                              className="p-2 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-full transition-colors cursor-pointer"
                              title="Xóa đề thi"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-500/20">
                              <Layers className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0 pr-8">
                              <h3
                                className="font-bold text-base truncate text-foreground leading-tight mb-1"
                                title={set.name}
                              >
                                {set.name}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-semibold ${
                                    set.status === 'public'
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                      : set.status === 'private'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                        : 'bg-secondary text-secondary-foreground'
                                  }`}
                                >
                                  {set.status === 'public'
                                    ? 'Công khai'
                                    : set.status === 'private'
                                      ? 'Nội bộ'
                                      : 'Nháp'}
                                </span>
                                <span>•</span>
                                <span>
                                  {new Date(set.createdAt).toLocaleDateString(
                                    'vi-VN',
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 mt-2">
                            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                              {set.description ||
                                'Không có mô tả cho đề thi này.'}
                            </p>
                          </div>

                          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">
                                Số Câu Hỏi
                              </span>
                              <span className="font-bold text-sm text-foreground">
                                {set.total_questions} câu
                              </span>
                            </div>
                            <Link
                              href={`/admin/tests/${set._id}`}
                              className="text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                            >
                              <span>Chi tiết</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-secondary/15 flex flex-col items-center justify-center">
              <Layers className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h5 className="font-semibold text-lg text-foreground">
                Chưa có đề thi nào
              </h5>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Hiện tại hệ thống chưa có bài kiểm tra nào. Bấm vào nút "Tạo đề
                thi mới" để bắt đầu xây dựng nội dung.
              </p>
              <Link href="/admin/create-test-v2" className="mt-6">
                <Button className="font-medium">
                  <PlusCircle className="h-4 w-4 mr-2" /> Bắt đầu tạo
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
