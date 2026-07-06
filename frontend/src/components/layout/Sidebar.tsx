'use client';

import {
  User,
  LogOut,
  BookOpen,
  ChevronLeft,
  ShieldCheck,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';
import Link from 'next/link';
import { HTMLAttributes } from 'react';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useLayoutStore } from '@/store/layoutStore';
import { ROUTES } from '@/constants/routes';

interface SidebarProps extends HTMLAttributes<HTMLDivElement> {
  onCollapseToggle?: (collapsed: boolean) => void;
}

export function Sidebar({ className, onCollapseToggle }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const isCollapsed = useLayoutStore(state => state.isCollapsed);
  const toggleCollapse = useLayoutStore(state => state.toggleCollapse);

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['user', 'admin'],
    },

    {
      name: 'Luyện Tập',
      href: '/practice',
      icon: BookOpen,
      roles: ['user', 'admin'],
      children: [
        {
          name: 'Bài Thi Tiếng Anh',
          href: '/practice',
          roles: ['user', 'admin'],
        },
        // {
        //   name: 'Luyện với AI',
        //   href: '/practice-interview-AI',
        //   roles: ['user', 'admin'],
        // },
        {
          name: 'Luyện phỏng vấn',
          href: '/practice-interview',
          roles: ['user', 'admin'],
        },
      ],
    },
    {
      name: 'Quản Lý Đề Thi',
      href: '/admin',
      icon: ShieldCheck,
      roles: ['admin'],
      children: [
        {
          name: 'Tạo Bài Phỏng Vấn',
          href: '/admin/create-interview-test',
          roles: ['admin'],
        },
        {
          name: 'Tạo Đề Thi Toeic',
          href: '/admin/create-test-v2',
          roles: ['admin'],
        },
        {
          name: 'Quản Lý Media',
          href: '/admin/media',
          // icon: Image,
          roles: ['admin'],
        },
      ],
    },
    {
      name: 'Quản lý người dùng',
      href: '/user',
      icon: User,
      roles: ['admin'],
    },
    {
      name: 'Trang Cá Nhân',
      href: '/profile',
      icon: User,
      roles: ['user', 'admin'],
    },
  ];

  const filteredItems = menuItems.filter(item =>
    item.roles.includes(user?.role || 'user'),
  );
  return (
    <aside
      className={cn(
        'glass-panel border-r flex flex-col h-screen fixed left-0 top-0 z-30 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          'h-16 flex items-center border-b border-border/40 relative',
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4',
        )}
      >
        {!isCollapsed ? (
          <Link
            href={ROUTES.DASHBOARD}
            className="flex items-center gap-2 font-bold text-xl tracking-tight animate-fade-in"
          >
            <span className="text-gradient">learnEverything</span>
          </Link>
        ) : (
          <Link
            href={ROUTES.DASHBOARD}
            className="flex items-center justify-center animate-fade-in"
          >
            {/* Logo */}
          </Link>
        )}
        <button
          onClick={toggleCollapse}
          className={cn(
            'p-1 rounded-md hover:bg-secondary/80 text-muted-foreground transition-all hidden md:block',
            isCollapsed
              ? 'absolute -right-3 top-5 bg-card border border-border shadow-sm rounded-full z-50 p-0.5 ml-0'
              : 'ml-auto',
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {filteredItems.map((item: any) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (pathname.startsWith(item.href + '/') &&
              item.href !== '/dashboard');

          const filteredChildren =
            item.children?.filter((child: any) =>
              child.roles.includes(user?.role || 'user'),
            ) || [];

          return (
            <div key={item.href} className="space-y-1">
              <Link
                href={item.href}
                className={cn(
                  'flex items-center rounded-lg text-sm font-medium transition-all group relative',
                  isCollapsed
                    ? 'justify-center px-0 gap-0 h-10 w-10 mx-auto'
                    : 'gap-3 px-3 py-2.5 w-full',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0',
                    isActive
                      ? ''
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                {!isCollapsed && <span>{item.name}</span>}
                {isCollapsed && (
                  <div className="absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {item.name}
                  </div>
                )}
              </Link>

              {/* Render Children (Sub-menu) */}
              {filteredChildren.length > 0 && (
                <div
                  className={cn('space-y-1', isCollapsed ? 'hidden' : 'block')}
                >
                  {filteredChildren.map((child: any) => {
                    const ChildIcon = child.icon;
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center rounded-lg text-xs font-medium transition-all group relative gap-2.5 pl-9 pr-3 py-2 w-full',
                          isChildActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-muted-foreground/80 hover:bg-secondary/40 hover:text-foreground',
                        )}
                      >
                        {ChildIcon && (
                          <ChildIcon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              isChildActive
                                ? 'text-primary'
                                : 'text-muted-foreground group-hover:text-foreground',
                            )}
                          />
                        )}
                        <span className="pl-3">{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-border/40">
        {!isCollapsed ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2 py-1 rounded-lg">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary ring-2 ring-primary/25">
                {user?.fullName.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-none mb-1">
                  {user?.fullName || 'Học Viên'}
                </p>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                  {user?.role === 'admin' ? 'Quản Trị Viên' : 'Học Viên'}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/15 hover:shadow-sm transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center py-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary ring-2 ring-primary/25">
              {user?.fullName.charAt(0).toUpperCase() || 'U'}
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/15 transition-all"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
