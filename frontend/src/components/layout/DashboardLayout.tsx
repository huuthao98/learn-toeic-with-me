'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

import { useAuthStore } from '@/store/authStore';
import { useLayoutStore } from '@/store/layoutStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';

let isAppMounted = false;

export function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const isCollapsed = useLayoutStore(state => state.isCollapsed);
  const [mounted, setMounted] = useState(isAppMounted);

  // Ensure state hydration completes before rendering protected pages
  useEffect(() => {
    isAppMounted = true;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!isAuthenticated || !token)) {
      router.push(ROUTES.LOGIN);
    }
  }, [mounted, isAuthenticated, token, router]);

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main viewport */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          isCollapsed ? 'pl-16' : 'pl-64',
        )}
      >
        <Header />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
