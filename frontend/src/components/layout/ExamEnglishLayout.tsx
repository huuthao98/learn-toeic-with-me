'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function ExamEnglishLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div
        className={cn('flex flex-col min-h-screen transition-all duration-300')}
      >
        <main className="flex-1 w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
