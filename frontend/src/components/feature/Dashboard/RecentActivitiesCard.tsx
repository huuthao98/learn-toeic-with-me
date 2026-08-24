'use client';

import { Clock, Volume2, Mic, Globe, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

interface ActivityItem {
  id: string;
  title: string;
  category: string;
  icon: typeof Volume2;
  iconColor: string;
  iconBg: string;
  result: string;
  resultColor?: string;
  timestamp: string;
  link?: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    title: 'TOEIC Listening Part 3 - Short Conversations',
    category: 'Luyện đề TOEIC',
    icon: Volume2,
    iconColor: 'text-chart-1',
    iconBg: 'bg-chart-1/10 border-chart-1/20',
    result: '+45 XP',
    resultColor: 'text-chart-1',
    timestamp: '10:30 AM',
    link: ROUTES.PRACTICE_EXAM_TOEIC,
  },
  {
    id: 'act-2',
    title: 'Phỏng vấn: Trả lời Điểm mạnh & Điểm yếu',
    category: 'Mock Interview AI',
    icon: Mic,
    iconColor: 'text-chart-3',
    iconBg: 'bg-chart-3/10 border-chart-3/20',
    result: '8.5 / 10',
    resultColor: 'text-foreground',
    timestamp: 'Hôm qua',
    link: ROUTES.PRACTICE_INTERVIEW,
  },
  {
    id: 'act-3',
    title: 'Từ vựng Unit 12: Business & Commercial Terms',
    category: 'Ôn tập Spaced Repetition',
    icon: Globe,
    iconColor: 'text-chart-2',
    iconBg: 'bg-chart-2/10 border-chart-2/20',
    result: '100%',
    resultColor: 'text-emerald-500',
    timestamp: 'Hôm qua',
    link: ROUTES.PRACTICE_VOCABULARY,
  },
  {
    id: 'act-4',
    title: 'HSK 2: 10 chữ Hán cơ bản và ngữ cảnh',
    category: 'Học mới Tiếng Trung',
    icon: Globe,
    iconColor: 'text-chart-5',
    iconBg: 'bg-chart-5/10 border-chart-5/20',
    result: '+30 XP',
    resultColor: 'text-chart-5',
    timestamp: 'Hôm qua',
  },
  {
    id: 'act-5',
    title: 'TOEIC Reading Part 7 - Single Passages',
    category: 'Luyện đề TOEIC',
    icon: FileText,
    iconColor: 'text-chart-4',
    iconBg: 'bg-chart-4/10 border-chart-4/20',
    result: '15/20',
    resultColor: 'text-foreground',
    timestamp: '2 ngày trước',
    link: ROUTES.PRACTICE_EXAM_TOEIC,
  },
];

export function RecentActivitiesCard() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-chart-3/10 p-2.5 rounded-xl border border-chart-3/20 text-chart-3">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Hoạt động gần đây</h3>
            <p className="text-xs text-muted-foreground">Lịch sử bài học và kết quả luyện tập</p>
          </div>
        </div>

        <Link
          href={ROUTES.PRACTICE}
          className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
        >
          Xem tất cả
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-border/40">
        {ACTIVITIES.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-muted/30 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.iconBg}`}
                >
                  <Icon className={`w-4 h-4 ${item.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">{item.category}</p>
                </div>
              </div>

              <div className="text-right shrink-0 pl-3">
                <div className={`text-xs font-bold ${item.resultColor || 'text-foreground'}`}>
                  {item.result}
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">
                  {item.timestamp}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
