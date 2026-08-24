'use client';

import { Target, Globe, Mic, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

interface GoalGridCardsProps {
  toeicEstimatedScore?: number;
  toeicTargetScore?: number;
}

export function GoalGridCards({
  toeicEstimatedScore = 715,
  toeicTargetScore = 800,
}: GoalGridCardsProps) {
  const toeicPercentage = Math.min(
    100,
    Math.round((toeicEstimatedScore / toeicTargetScore) * 100),
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-foreground">Mục tiêu kỹ năng</h3>
          <p className="text-xs text-muted-foreground">Theo dõi tiến độ các kỹ năng chính</p>
        </div>
        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          4 môn học
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: TOEIC */}
        <Link
          href={ROUTES.PRACTICE_EXAM_TOEIC}
          className="group relative bg-muted/20 hover:bg-muted/50 border border-border/70 rounded-xl p-3.5 flex flex-col justify-between transition-all hover:border-chart-1/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="bg-chart-1/10 p-2 rounded-lg text-chart-1">
              <Target className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-chart-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>

          <div>
            <span className="font-bold text-xs text-foreground block mb-0.5 truncate">
              TOEIC Test
            </span>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="text-xl font-black text-foreground">{toeicEstimatedScore}</span>
              <span className="text-[10px] font-bold text-muted-foreground">/{toeicTargetScore}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                <span>Đạt</span>
                <span className="text-chart-1 font-bold">{toeicPercentage}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-chart-1 rounded-full transition-all duration-500"
                  style={{ width: `${toeicPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </Link>

        {/* Card 2: English Vocabulary */}
        <Link
          href={ROUTES.PRACTICE_VOCABULARY}
          className="group relative bg-muted/20 hover:bg-muted/50 border border-border/70 rounded-xl p-3.5 flex flex-col justify-between transition-all hover:border-chart-2/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="bg-chart-2/10 p-2 rounded-lg text-chart-2">
              <Globe className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-chart-2 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>

          <div>
            <span className="font-bold text-xs text-foreground block mb-0.5 truncate">
              Từ vựng
            </span>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="text-xl font-black text-foreground">1,240</span>
              <span className="text-[10px] font-bold text-muted-foreground">từ</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                <span>Cần ôn: 85</span>
                <span className="text-chart-2 font-bold">85%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-chart-2 rounded-full w-[85%]" />
              </div>
            </div>
          </div>
        </Link>

        {/* Card 3: Chinese HSK */}
        <div className="group relative bg-muted/20 hover:bg-muted/50 border border-border/70 rounded-xl p-3.5 flex flex-col justify-between transition-all hover:border-chart-5/40 hover:shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-chart-5/10 p-2 rounded-lg text-chart-5 font-black text-xs leading-none">
              文
            </div>
            <span className="text-[10px] font-bold text-chart-5 bg-chart-5/10 px-1.5 py-0.5 rounded">
              HSK 2
            </span>
          </div>

          <div>
            <span className="font-bold text-xs text-foreground block mb-0.5 truncate">
              Tiếng Trung
            </span>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="text-xl font-black text-foreground">320</span>
              <span className="text-[10px] font-bold text-muted-foreground">chữ</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                <span>Cơ bản</span>
                <span className="text-chart-5 font-bold">45%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-chart-5 rounded-full w-[45%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Interview Practice */}
        <Link
          href={ROUTES.PRACTICE_INTERVIEW}
          className="group relative bg-muted/20 hover:bg-muted/50 border border-border/70 rounded-xl p-3.5 flex flex-col justify-between transition-all hover:border-chart-3/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="bg-chart-3/10 p-2 rounded-lg text-chart-3">
              <Mic className="w-4 h-4" />
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-chart-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>

          <div>
            <span className="font-bold text-xs text-foreground block mb-0.5 truncate">
              Phỏng vấn
            </span>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="text-xl font-black text-foreground">8</span>
              <span className="text-[10px] font-bold text-muted-foreground">phiên</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                <span>STAR</span>
                <span className="text-chart-3 font-bold">100%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-chart-3 rounded-full w-[100%]" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
