'use client';

import { Calendar, Quote } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDashboard } from '@/hooks/useDashboard';
import { TodoList } from '@/components/feature/TodoList/TodoList';
import { StreakBanner } from './StreakBanner';
import { LevelXpCard } from './LevelXpCard';
import { GoalGridCards } from './GoalGridCards';
import { UpcomingEventsCard } from './UpcomingEventsCard';
import { WeeklyLeaderboardCard } from './WeeklyLeaderboardCard';
import { RecentActivitiesCard } from './RecentActivitiesCard';
import { WordOfTheDayCard } from './WordOfTheDayCard';

export function DashboardView() {
  const user = useAuthStore(state => state.user);
  const { useStats } = useDashboard();
  const { data: stats } = useStats();

  const today = new Date();
  const formattedDate = `THỨ ${
    today.getDay() === 0 ? 'CHỦ NHẬT' : today.getDay() + 1
  }, ${today.getDate()} THÁNG ${today.getMonth() + 1}`;

  const level = 11;
  const currentXp = 4750;
  const targetXp = 5000;

  const displayName = user?.fullName || 'Khách';

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 font-sans -mx-4 sm:-mx-8 -mt-4 sm:-mt-8 rounded-tl-2xl">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* TOP HEADER: GREETING & MOTIVATIONAL QUOTE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1.5 text-xs font-bold tracking-wider uppercase">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Chào buổi sáng, {displayName}.
            </h1>
          </div>

          <div className="flex items-center gap-2.5 bg-card px-4 py-2.5 rounded-2xl border border-border/80 shadow-xs max-w-md">
            <Quote className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs sm:text-sm text-muted-foreground italic leading-snug">
              "Hành trình vạn dặm bắt đầu từ một bước chân." Hãy tiếp tục giữ đà nhé!
            </span>
          </div>
        </div>

        {/* 7:3 GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Top: Streak Motivation Banner */}
            {/* <StreakBanner level={level} currentXp={currentXp} targetXp={targetXp} /> */}

            {/* 2. Main: Today's Tasks / To-do list (Expanded with rich tags & filters) */}
            <TodoList />

            {/* 3. Sub: Recent Activities */}
            <RecentActivitiesCard />

            {/* 4. Sub: Flashcard Word of the Day */}
            <WordOfTheDayCard />
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* 1. Top: Level & XP Widget */}
            <LevelXpCard level={level} currentXp={currentXp} targetXp={targetXp} streakDays={5} />

            {/* 2. Main: 2x2 Goals Grid */}
            <GoalGridCards
              toeicEstimatedScore={stats?.estimatedScore || 715}
              toeicTargetScore={stats?.targetScore || 800}
            />

            {/* 3. Sub: Upcoming Events (Placed above Leaderboard as prioritized) */}
            <UpcomingEventsCard />

            {/* 4. Sub: Weekly Leaderboard */}
            <WeeklyLeaderboardCard />
          </div>
        </div>
      </div>
    </div>
  );
}
