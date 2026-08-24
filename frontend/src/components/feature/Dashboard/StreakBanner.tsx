'use client';

import { Flame, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';

interface StreakBannerProps {
  level: number;
  currentXp: number;
  targetXp: number;
}

export function StreakBanner({
  level,
  currentXp,
  targetXp,
}: StreakBannerProps) {
  const xpNeeded = Math.max(0, targetXp - currentXp);
  const progressPct = Math.min(100, Math.round((currentXp / targetXp) * 100));

  return (
    <div className="bg-gradient-to-br from-card via-card to-primary/5 border border-border rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-sm">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-chart-1/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-chart-1 to-chart-5 p-3.5 rounded-2xl shadow-lg shadow-chart-1/20 shrink-0 mt-0.5">
            <Flame className="w-7 h-7 text-primary-foreground fill-primary-foreground animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground">
                Đang giữ đà học tập tuyệt vời! 🔥
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-chart-1/10 text-chart-1 border border-chart-1/20 px-2 py-0.5 rounded-full">
                Streak: 5 ngày
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              Bạn chỉ còn <span className="text-primary font-bold">{xpNeeded} XP</span> nữa để đạt cấp{' '}
              <span className="text-foreground font-bold">Level {level + 1}</span>. Hoàn thành bài luyện tập hôm nay để nhận thêm thưởng kép!
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="shrink-0 w-full md:w-auto">
          <Link href={ROUTES.PRACTICE_EXAM_TOEIC}>
            <Button className="w-full md:w-auto font-bold text-xs sm:text-sm gap-2 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Luyện đề ngay
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
