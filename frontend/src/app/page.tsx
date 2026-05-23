"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, token } = useAuthStore()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (mounted) {
      if (isAuthenticated && token) {
        router.push("/dashboard")
      } else {
        router.push("/auth/login")
      }
    }
  }, [mounted, isAuthenticated, token, router])

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}
