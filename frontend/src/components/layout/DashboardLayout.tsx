"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { cn } from "@/lib/utils"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, token } = useAuthStore()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Ensure state hydration completes before rendering protected pages
  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (mounted && (!isAuthenticated || !token)) {
      router.push("/auth/login")
    }
  }, [mounted, isAuthenticated, token, router])

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !token) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar navigation */}
      <Sidebar onCollapseToggle={setIsCollapsed} />

      {/* Main viewport */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          isCollapsed ? "pl-16" : "pl-64"
        )}
      >
        <Header />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
