'use client';

import {
  User,
  Users,
  LogOut,
  BookOpen,
  ChevronLeft,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  ChevronsUpDown,
  CircleDashed,
  Sparkles,
  BadgeCheck,
  CreditCard,
  Bell,
} from 'lucide-react';
import Link from 'next/link';
import { HTMLAttributes, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useLayoutStore } from '@/store/layoutStore';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { ROUTES } from '@/constants/routes';

interface SidebarProps extends HTMLAttributes<HTMLDivElement> {
  onCollapseToggle?: (collapsed: boolean) => void;
}

export function Sidebar({ className, onCollapseToggle }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const isCollapsed = useLayoutStore(state => state.isCollapsed);

  // Track expanded menu items (using their names or hrefs)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const toggleExpand = (name: string, e: React.MouseEvent) => {
    e.preventDefault();
    setExpandedItems(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const navGroups = [
    {
      title: 'Học Tập',
      items: [
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
              name: 'Thi Thử TOEIC',
              href: ROUTES.PRACTICE,
              roles: ['user', 'admin'],
            },
            {
              name: 'Luyện Từ Vựng',
              href: ROUTES.PRACTICE_VOCABULARY,
              roles: ['user', 'admin'],
            },
            {
              name: 'Luyện Phỏng Vấn',
              href: ROUTES.PRACTICE_INTERVIEW,
              roles: ['user', 'admin'],
            },
          ],
        },
      ],
    },
    {
      title: 'Quản Trị',
      items: [
        {
          name: 'Quản Lý Đề Thi',
          href: '/admin',
          icon: ShieldCheck,
          roles: ['admin'],
          children: [
            {
              name: 'Tạo Bài Trắc Nghiệm',
              href: '/admin/create-test',
              roles: ['admin'],
            },
            {
              name: 'Tạo Bài Phỏng Vấn',
              href: '/admin/create-interview-test',
              roles: ['admin'],
            },
            {
              name: 'Tạo Đề Thi Toeic',
              href: '/admin/create-test-toeic',
              roles: ['admin'],
            },
            {
              name: 'Quản Lý Đề',
              href: '/admin',
              roles: ['admin'],
            },
            {
              name: 'Quản Lý Media',
              href: '/admin/media',
              roles: ['admin'],
            },
            {
              name: 'Quản Lý Chủ Đề',
              href: '/admin/topics',
              roles: ['admin'],
            },
            {
              name: 'Quản Lý Thông Báo',
              href: '/admin/notifications',
              roles: ['admin'],
            },
          ],
        },
        {
          name: 'Quản lý người dùng',
          href: '/user',
          icon: Users,
          roles: ['admin'],
        },
      ],
    },
    {
      title: 'Khác',
      items: [
        {
          name: 'Trang Cá Nhân',
          href: '/profile',
          icon: User,
          roles: ['user', 'admin'],
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col h-screen fixed left-0 top-0 z-30 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          'h-14 flex items-center relative', // Adjusted height to match Shadcn typical header
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4',
        )}
      >
        {!isCollapsed ? (
          <Link
            href={ROUTES.DASHBOARD}
            className="flex items-center gap-2 font-bold text-xl tracking-tight animate-fade-in"
          >
            <span className="text-sidebar-primary">learnEverything</span>
          </Link>
        ) : (
          <Link
            href={ROUTES.DASHBOARD}
            className="flex items-center justify-center animate-fade-in font-black text-xl text-sidebar-primary"
          >
            lE
          </Link>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-6">
        {navGroups.map((group, groupIdx) => {
          // Filter items based on role
          const filteredItems = group.items.filter(item =>
            item.roles.includes(user?.role || 'user'),
          );

          if (filteredItems.length === 0) return null;

          return (
            <div key={groupIdx}>
              {!isCollapsed && (
                <h4 className="mb-2 px-3 text-xs font-semibold tracking-tight text-sidebar-foreground/50">
                  {group.title}
                </h4>
              )}
              <nav className="space-y-0.5">
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

                  const hasChildren = filteredChildren.length > 0;
                  // If it has children and one of them is active, we can auto-expand it, but for simplicity relying on state
                  const isExpanded = expandedItems[item.name] || false;

                  return (
                    <div key={item.name} className="flex flex-col">
                      {hasChildren ? (
                        <button
                          onClick={e => toggleExpand(item.name, e)}
                          className={cn(
                            'flex items-center justify-between rounded-md text-sm transition-all group relative',
                            isCollapsed
                              ? 'justify-center px-0 gap-0 h-10 w-10 mx-auto'
                              : 'px-3 py-2 w-full',
                            isActive
                              ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={cn(
                                'h-4 w-4 shrink-0',
                                isActive
                                  ? 'text-primary'
                                  : 'text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground',
                              )}
                            />
                            {!isCollapsed && <span>{item.name}</span>}
                          </div>
                          {!isCollapsed &&
                            (isExpanded ? (
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            ) : (
                              <ChevronRight className="h-4 w-4 opacity-50" />
                            ))}

                          {/* Tooltip for collapsed state */}
                          {isCollapsed && (
                            <div className="absolute left-14 bg-popover text-popover-foreground border border-border text-sm px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                              {item.name}
                            </div>
                          )}
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center rounded-md text-sm transition-all group relative',
                            isCollapsed
                              ? 'justify-center px-0 gap-0 h-10 w-10 mx-auto'
                              : 'gap-3 px-3 py-2 w-full',
                            isActive
                              ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              isActive
                                ? 'text-primary'
                                : 'text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground',
                            )}
                          />
                          {!isCollapsed && <span>{item.name}</span>}

                          {/* Tooltip for collapsed state */}
                          {isCollapsed && (
                            <div className="absolute left-14 bg-popover text-popover-foreground border border-border text-sm px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                              {item.name}
                            </div>
                          )}
                        </Link>
                      )}

                      {/* Render Children (Sub-menu) */}
                      {hasChildren && !isCollapsed && (
                        <div
                          className={cn(
                            'grid transition-all duration-200 ease-in-out',
                            isExpanded
                              ? 'grid-rows-[1fr] opacity-100'
                              : 'grid-rows-[0fr] opacity-0',
                          )}
                        >
                          <div className="overflow-hidden">
                            <div className="ml-5 border-l border-sidebar-border/50 pl-2 space-y-0.5 mt-1 mb-1 py-1">
                              {filteredChildren.map((child: any) => {
                                const isChildActive = pathname === child.href;
                                return (
                                  <Link
                                    key={child.name}
                                    href={child.href}
                                    className={cn(
                                      'flex items-center rounded-md text-sm transition-all group relative gap-3 px-3 py-1.5 w-full',
                                      isChildActive
                                        ? 'text-primary font-medium bg-primary/5 shadow-sm'
                                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                                    )}
                                  >
                                    {child.icon && (
                                      <child.icon className="h-4 w-4 shrink-0 opacity-70" />
                                    )}
                                    <span>{child.name}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-sidebar-border mt-auto">
        <Popover>
          <PopoverTrigger
            className={cn(
              'flex items-center rounded-md hover:bg-sidebar-accent transition-colors group',
              !isCollapsed
                ? 'justify-between px-2 py-2 w-full text-left'
                : 'justify-center p-2 w-full',
            )}
          >
            {!isCollapsed ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-sidebar-primary/10 flex items-center justify-center font-bold text-sidebar-primary shrink-0">
                    {user?.fullName.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
                      {user?.fullName || 'Học Viên'}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate mt-0.5">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground/50 shrink-0 group-hover:text-sidebar-foreground transition-colors" />
              </>
            ) : (
              <div className="h-9 w-9 rounded-md bg-sidebar-primary/10 flex items-center justify-center font-bold text-sidebar-primary shrink-0">
                {user?.fullName.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="end"
            className="w-56 p-1 bg-popover rounded-xl shadow-lg border-border/40"
          >
            <div className="flex items-center gap-2 p-2">
              <div className="h-8 w-8 rounded-md bg-sidebar-primary/10 flex items-center justify-center font-bold text-sidebar-primary shrink-0">
                {user?.fullName.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">
                  {user?.fullName || 'Học Viên'}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
            <div className="h-px bg-border/60 my-1 mx-1" />
            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors text-foreground">
              <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
              Upgrade to Pro
            </button>
            <div className="h-px bg-border/60 my-1 mx-1" />
            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors text-foreground">
              <BadgeCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
              Account
            </button>
            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors text-foreground">
              <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
              Billing
            </button>
            <button className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors text-foreground">
              <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
              Notifications
            </button>
            <div className="h-px bg-border/60 my-1 mx-1" />
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-destructive/10 text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </PopoverContent>
        </Popover>
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
        title="Đăng xuất"
        description="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?"
        confirmText="Đăng xuất"
        variant="destructive"
      />
    </aside>
  );
}
