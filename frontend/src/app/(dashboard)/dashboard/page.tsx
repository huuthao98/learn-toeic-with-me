'use client';

import { useEffect, useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import {
  Flame,
  Target,
  Globe,
  Mic,
  Star,
  CheckCircle2,
  Circle,
  Calendar,
  Volume2,
  FileText,
  User,
  Quote,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { useStats, useTodayPlan } = useDashboard();
  const { data: stats } = useStats();
  const { data: todayPlan } = useTodayPlan();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const today = new Date();
  const formattedDate = `THỨ ${today.getDay() === 0 ? 'CHỦ NHẬT' : today.getDay() + 1}, ${today.getDate()} THÁNG ${today.getMonth() + 1}`;

  // Mock Data from Image
  const level = 11;
  const currentXp = 4750;
  const targetXp = 5000;

  // Custom Circle Progress for "Mục tiêu hôm nay"
  const CircularProgress = ({
    percentage,
    size = 64,
    strokeWidth = 6,
  }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            className="text-muted"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className="text-primary transition-all duration-1000 ease-in-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-foreground">
            {percentage}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Container using Tailwind semantic colors from new theme */}
      <div className="min-h-screen bg-background text-foreground p-6 sm:p-8 font-sans -mx-4 sm:-mx-8 -mt-4 sm:-mt-8 rounded-tl-2xl">
        <div className="max-w-[1280px] mx-auto space-y-6">
          {/* HEADER ROW */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary mb-2 text-xs font-bold tracking-wider">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
              <h1 className="text-4xl font-extrabold mb-3">
                Chào buổi sáng, Tuấn.
              </h1>
              <div className="flex items-center gap-2 bg-card px-4 py-2.5 rounded-full border border-border w-fit">
                <Quote className="w-4 h-4 text-muted-foreground/60" />
                <span className="text-sm text-muted-foreground italic">
                  "Hành trình vạn dặm bắt đầu từ một bước chân." Hãy tiếp tục
                  phát huy nhé!
                </span>
              </div>
            </div>

            {/* XP Badge */}
            <div className="flex items-center gap-3 bg-card px-5 py-3 rounded-full border border-border shrink-0">
              <div className="bg-chart-4/20 p-1.5 rounded-full">
                <Star className="w-5 h-5 text-chart-4 fill-chart-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">
                  Tổng XP
                </div>
                <div className="text-base font-bold tabular-nums">
                  {currentXp}{' '}
                  <span className="text-muted-foreground/70 text-xs font-medium">
                    / 5000
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BANNER XP (Đang giữ đà học tập tuyệt vời) */}
          <div className="bg-gradient-to-r from-card to-background border border-border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-chart-1/10 via-transparent to-transparent pointer-events-none" />

            <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
              <div className="bg-gradient-to-br from-chart-1 to-chart-5 p-4 rounded-2xl shadow-lg shadow-chart-1/20 shrink-0">
                <Flame className="w-8 h-8 text-primary-foreground fill-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-1">
                  Đang giữ đà học tập tuyệt vời!
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Bạn chỉ còn{' '}
                  <span className="text-foreground font-bold">
                    {targetXp - currentXp} XP
                  </span>{' '}
                  nữa để lên cấp {level + 1}. Hoàn thành bài test hôm nay để
                  nhận thưởng kép.
                </p>
              </div>
            </div>

            {/* Banner Progress Bar */}
            <div className="w-full md:w-[320px] bg-background/50 p-4 rounded-xl border border-border relative z-10 shrink-0">
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-bold text-primary">
                    Level {level}
                  </span>
                </div>
                <div className="text-sm font-bold tabular-nums">
                  {currentXp}{' '}
                  <span className="text-muted-foreground/70 text-xs">
                    / 5,000 XP
                  </span>
                </div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(currentXp / targetXp) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4 TOPIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Card 1: TOEIC */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover:bg-accent transition-colors">
              <div className="bg-chart-1/10 w-fit p-2.5 rounded-xl mb-4">
                <Target className="w-5 h-5 text-chart-1" />
              </div>
              <div>
                <h3 className="font-bold text-base mb-1">TOEIC Mock Test</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black">
                    {stats?.estimatedScore || 715}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground/70">
                    / 990
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-2">
                  <span>Mục tiêu: {stats?.targetScore || 800}</span>
                  <span>
                    {Math.min(
                      Math.round(
                        ((stats?.estimatedScore || 715) /
                          (stats?.targetScore || 800)) *
                          100,
                      ),
                      100,
                    )}
                    %
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-chart-1 w-[88%] rounded-full" />
                </div>
              </div>
            </div>

            {/* Card 2: English Vocabulary */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover:bg-accent transition-colors">
              <div className="bg-chart-2/10 w-fit p-2.5 rounded-xl mb-4">
                <Globe className="w-5 h-5 text-chart-2" />
              </div>
              <div>
                <h3 className="font-bold text-base mb-1">English Vocabulary</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black">1,240</span>
                  <span className="text-xs font-bold text-muted-foreground/70">
                    từ
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-2">
                  <span>Cần ôn tập: 85</span>
                  <span>85%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-chart-2 w-[85%] rounded-full" />
                </div>
              </div>
            </div>

            {/* Card 3: Chinese */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover:bg-accent transition-colors">
              <div className="bg-chart-5/10 w-fit p-2.5 rounded-xl mb-4">
                <span className="font-bold text-chart-5 text-lg leading-none">
                  文
                </span>
              </div>
              <div>
                <h3 className="font-bold text-base mb-1">Chinese (汉字)</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black">320</span>
                  <span className="text-xs font-bold text-muted-foreground/70">
                    chữ
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-2">
                  <span>HSK Level 2</span>
                  <span>45%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-chart-5 w-[45%] rounded-full" />
                </div>
              </div>
            </div>

            {/* Card 4: Interview Practice */}
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover:bg-accent transition-colors">
              <div className="bg-chart-3/10 w-fit p-2.5 rounded-xl mb-4">
                <Mic className="w-5 h-5 text-chart-3" />
              </div>
              <div>
                <h3 className="font-bold text-base mb-1">Interview Practice</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black">8</span>
                  <span className="text-xs font-bold text-muted-foreground/70">
                    phiên
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-muted-foreground mb-2">
                  <span>Tiếp theo: STAR</span>
                  <span>100%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-chart-3 w-[100%] rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            {/* COLUMN 1: Mục tiêu hôm nay + Từ mới */}
            <div className="col-span-1 lg:col-span-4 flex flex-col gap-4 md:gap-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">Mục tiêu hôm nay</h3>
                      <p className="text-xs text-muted-foreground">
                        Đã hoàn thành 2/4
                      </p>
                    </div>
                  </div>
                  <CircularProgress percentage={50} size={50} strokeWidth={4} />
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3 items-start group cursor-pointer">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-muted-foreground line-through decoration-muted-foreground/50">
                      Hoàn thành 1 bài thi thử TOEIC
                    </span>
                  </div>
                  <div className="flex gap-3 items-start group cursor-pointer">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-muted-foreground line-through decoration-muted-foreground/50">
                      Ôn tập 85 từ vựng tiếng Anh
                    </span>
                  </div>
                  <div className="flex gap-3 items-start group cursor-pointer">
                    <Circle className="w-5 h-5 text-muted-foreground/70 group-hover:text-muted-foreground shrink-0 mt-0.5 transition-colors" />
                    <span className="text-sm font-medium text-foreground">
                      Học 10 chữ Hán mới
                    </span>
                  </div>
                  <div className="flex gap-3 items-start group cursor-pointer">
                    <Circle className="w-5 h-5 text-muted-foreground/70 group-hover:text-muted-foreground shrink-0 mt-0.5 transition-colors" />
                    <span className="text-sm font-medium text-foreground">
                      Thực hành phỏng vấn STAR 1 phiên
                    </span>
                  </div>
                </div>
              </div>

              {/* Promo / Word of the day */}
              <div className="bg-gradient-to-b from-card to-background border border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden flex-1">
                <div className="absolute top-4 right-4 bg-chart-2/10 text-chart-2 border border-chart-2/20 px-2 py-1 rounded-md flex items-center gap-1.5 text-[10px] font-bold">
                  <Globe className="w-3 h-3" /> TỪ MỚI
                </div>
                <div className="mt-8 mb-6">
                  <h4 className="text-3xl font-black tracking-tight mb-2">
                    resilience
                  </h4>
                  <p className="text-primary font-mono text-sm">
                    /rɪˈzɪl.jəns/
                  </p>
                </div>
                <button className="flex items-center gap-2 bg-muted hover:bg-accent transition-colors px-4 py-2 rounded-full text-xs font-bold text-muted-foreground mb-2">
                  <Volume2 className="w-4 h-4" /> NHẤN ĐỂ LẬT
                </button>
              </div>
            </div>

            {/* COLUMN 2: Hoạt động gần đây */}
            <div className="col-span-1 lg:col-span-5 bg-card border border-border rounded-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-chart-3/10 p-2 rounded-xl">
                    <Clock className="w-5 h-5 text-chart-3" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Hoạt động gần đây</h3>
                    <p className="text-xs text-muted-foreground">
                      Hôm nay và Hôm qua
                    </p>
                  </div>
                </div>
                <Link
                  href="#"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Xem tất cả
                </Link>
              </div>

              <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-2">
                {/* Item 1 */}
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-accent transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-chart-1/10 flex items-center justify-center shrink-0 border border-chart-1/20">
                      <Volume2 className="w-4 h-4 text-chart-1" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-foreground group-hover:text-chart-1 transition-colors">
                        TOEIC Listening Part 3
                      </h5>
                      <p className="text-xs text-muted-foreground/70">
                        Luyện đề
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-chart-1">+45 XP</div>
                    <div className="text-[10px] text-muted-foreground/70">
                      10:30 AM
                    </div>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-accent transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-chart-3/10 flex items-center justify-center shrink-0 border border-chart-3/20">
                      <Mic className="w-4 h-4 text-chart-3" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-foreground group-hover:text-chart-3 transition-colors">
                        Phỏng vấn: Điểm mạnh & Yếu
                      </h5>
                      <p className="text-xs text-muted-foreground/70">
                        Mock Interview
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">
                      8.5
                      <span className="text-muted-foreground/70 text-xs">
                        /10
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground/70">
                      Hôm qua
                    </div>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-accent transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center shrink-0 border border-chart-2/20">
                      <Globe className="w-4 h-4 text-chart-2" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-foreground group-hover:text-chart-2 transition-colors">
                        Từ vựng Unit 12: Business
                      </h5>
                      <p className="text-xs text-muted-foreground/70">Ôn tập</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">
                      100%
                    </div>
                    <div className="text-[10px] text-muted-foreground/70">
                      Hôm qua
                    </div>
                  </div>
                </div>

                {/* Item 4 */}
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-accent transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-chart-5/10 flex items-center justify-center shrink-0 border border-chart-5/20">
                      <span className="font-bold text-chart-5 text-xs">文</span>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-foreground group-hover:text-chart-5 transition-colors">
                        HSK2: 10 chữ Hán cơ bản
                      </h5>
                      <p className="text-xs text-muted-foreground/70">
                        Học mới
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-chart-5">+30 XP</div>
                    <div className="text-[10px] text-muted-foreground/70">
                      Hôm qua
                    </div>
                  </div>
                </div>

                {/* Item 5 */}
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-accent transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-chart-4/10 flex items-center justify-center shrink-0 border border-chart-4/20">
                      <FileText className="w-4 h-4 text-chart-4" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-foreground group-hover:text-chart-4 transition-colors">
                        TOEIC Reading Part 7
                      </h5>
                      <p className="text-xs text-muted-foreground/70">
                        Luyện đề
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-chart-4">
                      15
                      <span className="text-muted-foreground/70 text-xs">
                        /20
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground/70">
                      2 ngày trước
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 3: Xếp hạng tuần + Sắp diễn ra */}
            <div className="col-span-1 lg:col-span-3 flex flex-col gap-4 md:gap-6">
              {/* Leaderboard */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-chart-4/10 p-2 rounded-xl">
                    <Star className="w-5 h-5 text-chart-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Xếp hạng tuần</h3>
                    <p className="text-xs text-muted-foreground">
                      Nhóm 48 bạn bè
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  {[
                    {
                      rank: 1,
                      name: 'Trần Linh',
                      xp: 5240,
                      color: 'text-chart-4',
                    },
                    {
                      rank: 2,
                      name: 'Lê Hoàng',
                      xp: 4980,
                      color: 'text-muted-foreground',
                    },
                    {
                      rank: 3,
                      name: 'Nguyễn Minh Tuấn',
                      xp: 4750,
                      color: 'text-primary',
                      isMe: true,
                    },
                    {
                      rank: 4,
                      name: 'Phạm Khoa',
                      xp: 4120,
                      color: 'text-chart-1',
                    },
                  ].map(user => (
                    <div
                      key={user.rank}
                      className={`flex items-center justify-between p-2.5 rounded-xl ${user.isMe ? 'bg-primary/10 border border-primary/20' : 'hover:bg-accent'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-bold w-4 text-center ${user.color}`}
                        >
                          #{user.rank}
                        </span>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user.isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                        >
                          {user.isMe ? 'NT' : <User className="w-3.5 h-3.5" />}
                        </div>
                        <span
                          className={`text-sm font-bold ${user.isMe ? 'text-primary' : 'text-foreground'}`}
                        >
                          {user.name}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-foreground tabular-nums">
                        {user.xp}{' '}
                        <span className="text-[9px] text-muted-foreground/70">
                          XP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-card border border-border rounded-2xl p-5 flex-1">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-base">Sắp diễn ra</h3>
                </div>

                <div className="space-y-3">
                  <div className="p-3 border border-border rounded-xl flex items-center gap-4 hover:border-border/80 transition-colors cursor-pointer">
                    <div className="bg-background border border-border rounded-lg w-12 h-12 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-destructive uppercase">
                        Th10
                      </span>
                      <span className="text-lg font-black leading-none">
                        28
                      </span>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-foreground">
                        Thi thử TOEIC định kỳ
                      </h5>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Circle className="w-1.5 h-1.5 fill-primary text-primary" />{' '}
                        Online • 120 phút
                      </p>
                    </div>
                  </div>

                  <div className="p-3 border border-border rounded-xl flex items-center gap-4 hover:border-border/80 transition-colors cursor-pointer">
                    <div className="bg-background border border-border rounded-lg w-12 h-12 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-destructive uppercase">
                        Th11
                      </span>
                      <span className="text-lg font-black leading-none">
                        05
                      </span>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-foreground">
                        Mock Interview - Tech
                      </h5>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Circle className="w-1.5 h-1.5 fill-primary text-primary" />{' '}
                        Cùng Mentor • 45 phút
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
