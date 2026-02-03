"use client"

import { createContext, useContext, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppStore } from "@/lib/store"
import type { AuthUser } from "@/lib/types"

/** Session duration in ms. 0 = until browser close (use 10 years so timeout never fires). */
function getSessionDurationMs(minutes: number): number {
  if (minutes <= 0) return 10 * 365 * 24 * 60 * 60 * 1000
  return minutes * 60 * 1000
}

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
    sessionDurationMinutes,
    _hasHydrated,
  } = useAppStore()

  const currentUser = authUsers?.find((u) => u.id === currentAuthUserId) || null
  const isAuthenticated = !!currentUser

  // After hydration: give existing sessions without expiry a fresh window using user's session duration (e.g. after deploy/refresh)
  useEffect(() => {
    if (!_hasHydrated) return
    if (currentAuthUserId && (sessionExpiresAt == null || sessionExpiresAt === undefined)) {
      const durationMs = getSessionDurationMs(sessionDurationMinutes ?? 60)
      setSessionExpiresAt(Date.now() + durationMs)
    }
  }, [_hasHydrated, currentAuthUserId, sessionExpiresAt, sessionDurationMinutes, setSessionExpiresAt])

  // Session expired: clear auth and redirect to login
  useEffect(() => {
    if (!_hasHydrated) return
    if (!currentAuthUserId || sessionExpiresAt == null) return
    if (Date.now() <= sessionExpiresAt) return
    setCurrentAuthUserId(null)
    setSessionExpiresAt(null)
    router.push("/login")
  }, [_hasHydrated, currentAuthUserId, sessionExpiresAt, setCurrentAuthUserId, setSessionExpiresAt, router])

  // Redirect logic:
  // - If on /login and already authenticated, send to dashboard
  // - Otherwise, if not authenticated, send to /login
  useEffect(() => {
    if (!_hasHydrated) return
    if (pathname?.startsWith("/api")) return

    if (pathname?.startsWith("/login")) {
      if (isAuthenticated) {
        router.replace("/")
      }
      return
    }

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
