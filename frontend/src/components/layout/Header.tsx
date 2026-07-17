'use client';

import { useAuthStore } from '@/store/authStore';
import { useLayoutStore } from '@/store/layoutStore';
import { Bell, Search, Sun, Moon, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

import gridImg from '@/assets/img/grid.png';
import sidebarImg from '@/assets/img/sidebar.png';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export function Header() {
  const { user } = useAuthStore();
  const isCollapsed = useLayoutStore(state => state.isCollapsed);
  const toggleCollapse = useLayoutStore(state => state.toggleCollapse);
  
  const [isDark, setIsDark] = useState(false);

  const { useNotificationsList, useMarkAsReadMutation, useMarkAllAsReadMutation } = useNotifications();
  const { data: notificationsData } = useNotificationsList(1, 20);
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  // Sync theme with document classList
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-border/40 h-16 sticky top-0 z-20 px-6 flex items-center justify-between">
      {/* Welcome Title */}
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-md hover:bg-accent transition-all hidden md:flex items-center justify-center shrink-0"
        >
          <Image 
            src={isCollapsed ? sidebarImg : gridImg} 
            alt="Toggle Sidebar" 
            width={20} 
            height={20} 
            className="opacity-70 hover:opacity-100 transition-opacity dark:invert" 
          />
        </button>
        <span className="hidden sm:inline-block text-sm text-muted-foreground font-medium">
          Xin chào,{' '}
          <span className="font-semibold text-foreground">
            {user?.fullName || 'Học Viên'}
          </span>{' '}
          👋
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        {/* Visual Search */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học, bộ đề..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-lg bg-secondary/50 border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
          />
        </div>

        {/* Target Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Mục tiêu 1% mỗi ngày</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all"
          title="Đổi giao diện"
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-amber-500 animate-spin-slow" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Notifications Indicator */}
        <Popover>
          <PopoverTrigger
            className="p-2 rounded-lg hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all relative"
            title="Thông báo"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
            )}
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-bold">Thông báo</span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleMarkAllAsRead}
                  className="h-auto p-0 text-xs text-primary hover:text-primary hover:bg-transparent"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Đánh dấu đã đọc
                </Button>
              )}
            </div>
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Không có thông báo nào.
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notification: any) => (
                    <div 
                      key={notification._id}
                      className={`p-4 border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors ${!notification.isRead ? 'bg-primary/5' : ''}`}
                      onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm ${!notification.isRead ? 'font-bold' : 'font-medium text-foreground'}`}>
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                      <span className="text-[10px] text-muted-foreground mt-2 block">
                        {new Date(notification.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/40">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
            {user?.fullName.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
