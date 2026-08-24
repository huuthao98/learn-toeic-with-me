'use client';

import { Star, Award, Zap } from 'lucide-react';

interface LevelXpCardProps {
  level: number;
  currentXp: number;
  targetXp: number;
  streakDays?: number;
}

export function LevelXpCard({
  level,
  currentXp,
  targetXp,
  streakDays = 5,
}: LevelXpCardProps) {
  const percentage = Math.min(100, Math.round((currentXp / targetXp) * 100));
  const radius = 30;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-chart-4/10 p-2.5 rounded-xl border border-chart-4/20 text-chart-4">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Cấp độ & Kinh nghiệm
            </div>
            <h3 className="text-base font-bold text-foreground">Học viên Tích cực</h3>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-chart-1/10 text-chart-1 border border-chart-1/20 px-2.5 py-1 rounded-full text-xs font-bold">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{streakDays} ngày</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 bg-muted/30 p-3.5 rounded-xl border border-border/50">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-black bg-primary text-primary-foreground px-2 py-0.5 rounded-md">
              <Star className="w-3 h-3 fill-current" />
              Level {level}
            </span>
            <span className="text-xs text-muted-foreground font-medium truncate">
              Mục tiêu Level {level + 1}
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-foreground tabular-nums">
              {currentXp.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              / {targetXp.toLocaleString()} XP
            </span>
          </div>

          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Circular gauge */}
        <div className="relative shrink-0 w-16 h-16 flex items-center justify-center">
          <svg className="transform -rotate-90 w-16 h-16">
            <circle
              className="text-muted/60"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="32"
              cy="32"
            />
            <circle
              className="text-primary transition-all duration-1000 ease-in-out"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="32"
              cy="32"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-xs font-black text-foreground">{percentage}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
