'use client';

import { ReactNode } from 'react';
import { HeaderDetail } from './HeaderDetail';
import { cn } from '@/lib/utils';

export function DetailLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div
        className={cn('flex flex-col min-h-screen transition-all duration-300')}
      >
        <HeaderDetail />
        <main className="flex-1 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
