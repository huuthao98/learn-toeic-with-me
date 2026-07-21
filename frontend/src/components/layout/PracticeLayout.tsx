'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PracticeHeader } from '@/components/layout/PracticeHeader';

export function PracticeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div
        className={cn('flex flex-col min-h-screen transition-all duration-300')}
      >
        <PracticeHeader />
        <main className="flex-1 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
