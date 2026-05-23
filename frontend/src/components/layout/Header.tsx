"use client"

import * as React from "react"
import { useAuthStore } from "@/store/authStore"
import {
  Bell,
  Search,
  Sun,
  Moon,
  TrendingUp,
  Sparkles,
  BookOpen,
} from "lucide-react"

export function Header() {
  const { user } = useAuthStore()
  const [isDark, setIsDark] = React.useState(false)

  // Sync theme with document classList
  React.useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark")
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
      setIsDark(false)
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
      setIsDark(true)
    }
  }

  return (
    <header className="glass-panel border-b border-border/40 h-16 sticky top-0 z-20 px-6 flex items-center justify-between">
      {/* Welcome Title */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-block text-sm text-muted-foreground font-medium">
          Xin chào, <span className="font-semibold text-foreground">{user?.fullName || "Học Viên"}</span> 👋
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
          <span>Mục tiêu: {user?.targetScore || 800}đ</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all"
          title="Đổi giao diện"
        >
          {isDark ? <Sun className="h-5 w-5 text-amber-500 animate-spin-slow" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications Indicator */}
        <button
          className="p-2 rounded-lg hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-all relative"
          title="Thông báo"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
        </button>

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-border/40">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
            {user?.fullName.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </header>
  )
}
