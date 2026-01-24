"use client"

import { createContext, useContext, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppStore } from "@/lib/store"
import type { AuthUser } from "@/lib/types"

interface AuthContextType {
  currentUser: AuthUser | null
  user: AuthUser | null // Alias for convenience
  isAuthenticated: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { currentAuthUserId, authUsers = [], setCurrentAuthUserId } = useAppStore()
  
  const currentUser = authUsers?.find((u) => u.id === currentAuthUserId) || null
  const isAuthenticated = !!currentUser

  useEffect(() => {
    // Skip auth check for login and api routes
    if (pathname?.startsWith("/login") || pathname?.startsWith("/api")) {
      return
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, pathname, router])

  const logout = () => {
    setCurrentAuthUserId(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ currentUser, user: currentUser, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
