'use client';

import { Calendar, Clock, ChevronRight, Video, FileCheck } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

interface EventItem {
  id: string;
  month: string;
  day: string;
  title: string;
  type: string;
  duration: string;
  isOnline: boolean;
  link?: string;
  tagColor: string;
}

const EVENTS: EventItem[] = [
  {
    id: 'event-1',
    month: 'Th10',
    day: '28',
    title: 'Thi thử TOEIC định kỳ',
    type: 'Online Test',
    duration: '120 phút',
    isOnline: true,
    link: ROUTES.PRACTICE_EXAM_TOEIC,
    tagColor: 'text-destructive',
  },
  {
    id: 'event-2',
    month: 'Th11',
    day: '05',
    title: 'Mock Interview - Tech HR',
    type: 'Cùng Mentor',
    duration: '45 phút',
    isOnline: true,
    link: ROUTES.PRACTICE_INTERVIEW,
    tagColor: 'text-primary',
  },
];

export function UpcomingEventsCard() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 p-2 rounded-xl text-primary border border-primary/20">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Sắp diễn ra</h3>
            <p className="text-xs text-muted-foreground">Lịch kiểm tra & buổi hẹn</p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {EVENTS.map(event => {
          const content = (
            <div
              key={event.id}
              className="p-3 bg-muted/20 hover:bg-muted/50 border border-border/70 rounded-xl flex items-center justify-between gap-3 transition-all hover:border-primary/40 group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Date block */}
                <div className="bg-background border border-border/80 rounded-xl w-11 h-11 flex flex-col items-center justify-center shrink-0 shadow-xs">
                  <span className={`text-[9px] font-black uppercase ${event.tagColor}`}>
                    {event.month}
                  </span>
                  <span className="text-base font-black leading-none text-foreground">
                    {event.day}
                  </span>
                </div>

                {/* Event info */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                      {event.type === 'Online Test' ? (
                        <FileCheck className="w-3 h-3 text-chart-1" />
                      ) : (
                        <Video className="w-3 h-3 text-chart-3" />
                      )}
                      {event.type}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {event.duration}
                    </span>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          );

          return event.link ? (
            <Link key={event.id} href={event.link}>
              {content}
            </Link>
          ) : (
            content
          );
        })}
      </div>
    </div>
  );
}
