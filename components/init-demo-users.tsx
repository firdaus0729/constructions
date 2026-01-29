"use client"

import { useEffect, useRef } from "react"
import { useAppStore } from "@/lib/store"

/**
 * Component that initializes demo users on first load
 * Creates 3 demo users: admin, supervisor, worker
 */
export function InitDemoUsers() {
  const authUsers = useAppStore((state) => state.authUsers)
  const addAuthUser = useAppStore((state) => state.addAuthUser)
  const deleteAuthUser = useAppStore((state) => state.deleteAuthUser)
  const hasHydrated = useAppStore((state) => state._hasHydrated)
  const initialized = useRef(false)

  useEffect(() => {
    // Wait for persisted state rehydration; avoids duplicate add attempts and warnings on refresh.
    if (!hasHydrated) return
    // Prevent double initialization in development (React StrictMode)
    if (initialized.current) return
    initialized.current = true
    
    // Simple hash function for demo purposes (NOT production-grade)
    // Uses browser btoa for a stable base64 encoding
    const simpleHash = (password: string) => {
      if (typeof window !== "undefined" && typeof window.btoa === "function") {
        return window.btoa(password)
      }
      // Fallback (shouldn't happen in client components)
      return password
    }

    // Define demo users with .app email domain
    const demoUsers = [
      {
        id: "admin-user-1",
        email: "admin@construction.app",
        name: "Admin",
        passwordHash: simpleHash("Admin2026!"),
        role: "admin" as const,
        createdAt: new Date(),
      },
      {
        id: "supervisor-user-1",
        email: "supervisor@construction.app",
        name: "Supervisor",
        passwordHash: simpleHash("Super2026!"),
        role: "supervisor" as const,
        createdAt: new Date(),
      },
      {
        id: "worker-user-1",
        email: "worker@construction.app",
        name: "Worker",
        passwordHash: simpleHash("Work2026!"),
        role: "worker" as const,
        createdAt: new Date(),
      },
    ]

    // Check if demo users exist
    const demoEmails = demoUsers.map(u => u.email)
    const hasAllDemoUsers = demoEmails.every(email => 
      authUsers.some(u => u.email === email)
    )

    // If no users exist OR demo users are missing, reset and add them
    if (authUsers.length === 0 || !hasAllDemoUsers) {
      // Clear all existing users
      authUsers.forEach(user => {
        deleteAuthUser(user.id)
      })

      // Add fresh demo users
      demoUsers.forEach((user) => {
        addAuthUser(user)
      })
      
      console.log("Demo users initialized/reset successfully")
    }
  }, [hasHydrated]) // Run once after hydration

  return null
}
