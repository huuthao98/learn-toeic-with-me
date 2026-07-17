'use client';

import {
  User,
  Mail,
  Phone,
  Flame,
  Award,
  History,
  Layers,
  BookOpen,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit2 } from 'lucide-react';

import { EditProfileModal } from '@/components/feature/profile/EditProfileModal';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToeic } from '@/hooks/useToeic';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/hooks/useDashboard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ROUTES } from '@/constants/routes';
import { NotificationPreferencesCard } from '@/components/feature/profile/NotificationPreferencesCard';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const { useRecentTests, useStats, useStreakHistory } = useDashboard();
  const { useTestSets } = useToeic();

  const { data: recentTests, isLoading: loadingHistory } = useRecentTests();
  const { data: stats, isLoading: loadingStats } = useStats();
  const { data: streakHistory } = useStreakHistory();
  const { data: ToeicSets, isLoading: loadingTests } = useTestSets();
  const isAdmin = user?.role === 'admin';

  // Generate Check-in Heatmap Cells for the current month
  const heatmapDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday, 1 is Monday...

    // Populate past dates that have study entries from streak history API
    const activeDates = new Set<string>(streakHistory?.activeDates || []);

    const cells = [];
    // Pad previous month days
    for (
      let i = 0;
      i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1);
      i++
    ) {
      cells.push({ day: null, active: false });
    }

    // Add days of this month
    for (let day = 1; day <= totalDays; day++) {
      const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isActive = activeDates.has(cellDateStr);

      cells.push({
        day,
        active: isActive,
        isToday:
          day === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear(),
      });
    }

    return cells;
  }, [streakHistory]);

  const weekdays = ['Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'CN'];
  const currentMonthName = new Date().toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <div className="space-y-8">
        {/* Title Heading */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <span className="text-gradient">Hồ Sơ Học Viên</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý tài khoản cá nhân, xem biểu đồ tích lũy chuyên cần và lịch
            sử luyện thi.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Test History Table & Authored Tests (Left Column) */}
          <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
            {/* Test History Table */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <span>Lịch Sử Bài Thi Đã Làm</span>
                </CardTitle>
                <CardDescription>
                  Danh sách kết quả toàn bộ các đề thi thử bạn đã thực hiện.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="h-20 bg-secondary/80 animate-pulse rounded" />
                ) : recentTests && recentTests.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tên bộ đề</TableHead>
                          <TableHead>Ngày thi</TableHead>
                          <TableHead>Thời gian</TableHead>
                          <TableHead className="text-right">Điểm</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentTests.map(t => (
                          <TableRow
                            key={t._id}
                            className="hover:bg-primary/5 transition-colors cursor-pointer group"
                          >
                            <TableCell className="font-bold text-xs group-hover:text-primary transition-colors">
                              {t.test_sets?.name || 'Đề thi TOEIC Reading'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-[10px]">
                              {new Date(t.createdAt).toLocaleDateString(
                                'vi-VN',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                },
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-secondary text-[10px] font-bold">
                                {t.durationMinutes || 0} phút
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-black text-indigo-600 dark:text-indigo-400 text-sm">
                              {t.score}đ
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-border rounded-lg bg-secondary/15">
                    <BookOpen className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                    <h5 className="font-semibold text-xs text-muted-foreground">
                      Chưa có kết quả làm bài
                    </h5>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Truy cập Thư viện đề thi để khởi chạy bài kiểm tra thử đầu
                      tiên.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Authored Tests (Admin Creator Section) */}
            {isAdmin && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <span>Bộ Đề Đã Thiết Kế (Admin)</span>
                  </CardTitle>
                  <CardDescription>
                    Danh sách các đề thi thử TOEIC do các quản trị viên tạo
                    dựng.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTests ? (
                    <div className="h-20 bg-secondary/80 animate-pulse rounded" />
                  ) : ToeicSets && ToeicSets.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tên bộ đề</TableHead>
                            <TableHead>Tổng số câu</TableHead>
                            <TableHead>Ngày thiết lập</TableHead>
                            <TableHead className="text-right">Xem</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ToeicSets.map(set => (
                            <TableRow
                              key={set._id}
                              className="hover:bg-secondary/20"
                            >
                              <TableCell className="font-bold text-xs">
                                {set.name}
                              </TableCell>
                              <TableCell className="text-xs">
                                {set.totalQuestions} câu hỏi
                              </TableCell>
                              <TableCell className="text-muted-foreground text-[10px]">
                                {new Date(set.createdAt).toLocaleDateString(
                                  'vi-VN',
                                  {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  },
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Link
                                  href={`/practice/toeic/${set._id}`}
                                  className="text-xs font-semibold text-primary hover:underline"
                                >
                                  Luyện tập
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-10 border border-dashed border-border rounded-lg bg-secondary/15">
                      <Layers className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                      <h5 className="font-semibold text-xs text-muted-foreground">
                        Chưa có đề thi được thiết kế
                      </h5>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2">
                  <Button
                    onClick={() => router.push(ROUTES.ADMIN_CREATE_TEST_V2)}
                    className="w-full text-xs font-bold flex items-center gap-1.5"
                    variant="outline"
                  >
                    <span>Thiết kế thêm bộ đề thi mới</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
          {/* User Details & Heatmap ( Right Column) */}
          <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
            {/* Account Card */}
            <Card className="glass-card overflow-hidden border-0 shadow-lg relative">
              {/* Cover Photo Area */}
              <div className="h-28 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md border-0"
                  onClick={() => setIsEditProfileOpen(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>

              <CardContent className="pt-0 pb-6 text-center space-y-4 px-6">
                {/* Overlapping Avatar */}
                <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-primary to-cyan-500 mx-auto flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-primary/30 border-4 border-card -mt-12 relative z-10">
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>

                <div className="mt-2">
                  <h3 className="text-2xl font-extrabold tracking-tight">
                    {user?.fullName || 'Học Viên'}
                  </h3>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      {user?.role === 'admin' ? 'Quản Trị Viên' : 'Học Viên'}
                    </span>
                    <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      Gói: {user?.plan || 'Miễn phí'}
                    </span>
                  </div>
                </div>

                <div className="pt-5 border-t border-border/40 grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-sm text-muted-foreground mt-6">
                  {user?.email ? (
                    <div className="flex items-center gap-3 bg-secondary/30 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          Email
                        </span>
                        <span className="truncate text-foreground font-medium">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  ) : null}
                  {user?.phone ? (
                    <div className="flex items-center gap-3 bg-secondary/30 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          Điện thoại
                        </span>
                        <span className="text-foreground font-medium">
                          {user.phone}
                        </span>
                      </div>
                    </div>
                  ) : null}
                  {user?.age ? (
                    <div className="flex items-center gap-3 bg-secondary/30 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          Tuổi
                        </span>
                        <span className="text-foreground font-medium">
                          {user.age} tuổi
                        </span>
                      </div>
                    </div>
                  ) : null}
                  {user?.targetScore ? (
                    <div className="flex items-center gap-3 bg-secondary/30 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                        <Award className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                          Mục tiêu TOEIC
                        </span>

                        <span className="text-foreground font-extrabold text-orange-500">
                          {user?.targetScore}đ
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
                {/* Notification Preferences */}
                <NotificationPreferencesCard />
              </CardContent>
            </Card>

            {/* Check-in Calendar Heatmap */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span>Chuỗi Luyện Tập Chuyên Cần ({currentMonthName})</span>
                </CardTitle>
                <CardDescription>
                  Tự động ghi nhận khi làm bài thi thử hoặc ôn tập câu hỏi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Heatmap Grid */}
                <div>
                  <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-muted-foreground mb-2">
                    {weekdays.map(w => (
                      <div key={w}>{w}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {heatmapDays.map((cell, idx) => (
                      <div
                        key={idx}
                        className={`heatmap-cell flex items-center justify-center text-xs font-bold ${
                          cell.day === null
                            ? 'bg-transparent opacity-0 pointer-events-none'
                            : cell.active
                              ? 'bg-emerald-500 text-white shadow shadow-emerald-500/20'
                              : cell.isToday
                                ? 'bg-primary/10 text-primary border border-primary animate-pulse-ring'
                                : 'bg-secondary text-muted-foreground/60 border border-border/20'
                        }`}
                        title={cell.active ? `Đã điểm danh học tập!` : ''}
                      >
                        {cell.day}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-semibold text-muted-foreground pt-2 border-t border-border/20">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-secondary border border-border/20" />
                    <span>Chưa học</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-emerald-500" />
                    <span>Đã luyện tập</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-orange-500">
                    <Flame className="h-3.5 w-3.5 fill-orange-500" />
                    <span>
                      Học liên tục:{' '}
                      {streakHistory?.streak ?? stats?.streak ?? 0} ngày
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </>
  );
}
