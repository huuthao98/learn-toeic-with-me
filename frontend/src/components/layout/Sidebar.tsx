"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BookOpen,
  User,
  ShieldCheck,
  PlusCircle,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onCollapseToggle?: (collapsed: boolean) => void
}

export function Sidebar({ className, onCollapseToggle }: SidebarProps) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { user } = useAuthStore()
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  const toggleCollapse = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    if (onCollapseToggle) {
      onCollapseToggle(nextState)
    }
  }

  const menuItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["user", "admin"],
    },
    {
      name: "Luyện Thi TOEIC",
      href: "/practice",
      icon: BookOpen,
      roles: ["user", "admin"],
    },
    {
      name: "Trang Cá Nhân",
      href: "/profile",
      icon: User,
      roles: ["user", "admin"],
    },
    {
      name: "Quản Lý Đề Thi",
      href: "/admin",
      icon: ShieldCheck,
      roles: ["admin"],
    },
    {
      name: "Tạo Đề Mới",
      href: "/admin/create-test",
      icon: PlusCircle,
      roles: ["admin"],
    },
  ]

  const filteredItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || "user")
  )

  return (
    <aside
      className={cn(
        "glass-panel border-r flex flex-col h-screen fixed left-0 top-0 z-30 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border/40">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="p-1.5 rounded-lg bg-primary text-primary-foreground animate-pulse-ring">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-gradient">LearnTOEIC</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="mx-auto">
            <span className="flex p-1.5 rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
          </Link>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1 rounded-md hover:bg-secondary/80 text-muted-foreground transition-all ml-auto hidden md:block"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/") && item.href !== "/dashboard"
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "" : "text-muted-foreground group-hover:text-foreground")} />
              {!isCollapsed && <span>{item.name}</span>}
              {isCollapsed && (
                <div className="absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {item.name}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-border/40">
        {!isCollapsed ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2 py-1 rounded-lg">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary ring-2 ring-primary/25">
                {user?.fullName.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-none mb-1">
                  {user?.fullName || "Học Viên"}
                </p>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                  {user?.role === "admin" ? "Quản Trị Viên" : "Học Viên"}
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
              {user?.fullName.charAt(0).toUpperCase() || "U"}
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
  )
}
