"use client"

import { createContext, useContext, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { SESSION_DURATION_MS } from "@/lib/store"
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
  const {
    currentAuthUserId,
    authUsers = [],
    setCurrentAuthUserId,
    setSessionExpiresAt,
    sessionExpiresAt,
    _hasHydrated,
  } = useAppStore()

  const currentUser = authUsers?.find((u) => u.id === currentAuthUserId) || null
  const isAuthenticated = !!currentUser

  // After hydration: give existing sessions without expiry a fresh 1-hour window (e.g. after deploy)
  useEffect(() => {
    if (!_hasHydrated) return
    if (currentAuthUserId && (sessionExpiresAt == null || sessionExpiresAt === undefined)) {
      setSessionExpiresAt(Date.now() + SESSION_DURATION_MS)
    }
  }, [_hasHydrated, currentAuthUserId, sessionExpiresAt, setSessionExpiresAt])

  // Session expired: clear auth and redirect to login
  useEffect(() => {
    if (!_hasHydrated) return
    if (!currentAuthUserId || sessionExpiresAt == null) return
    if (Date.now() <= sessionExpiresAt) return
    setCurrentAuthUserId(null)
    setSessionExpiresAt(null)
    router.push("/login")
  }, [_hasHydrated, currentAuthUserId, sessionExpiresAt, setCurrentAuthUserId, setSessionExpiresAt, router])

  // Redirect to login only when not authenticated, and only after hydration (so refresh keeps you logged in)
  useEffect(() => {
    if (!_hasHydrated) return
    if (pathname?.startsWith("/login") || pathname?.startsWith("/api")) return
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [_hasHydrated, isAuthenticated, pathname, router])

  const logout = () => {
    setCurrentAuthUserId(null)
    setSessionExpiresAt(null)
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
