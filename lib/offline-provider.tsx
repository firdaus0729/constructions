"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useAppStore } from "./store"
import { toast } from "sonner"
import { useLocale } from "./locale-context"

interface OfflineContextType {
  isOnline: boolean
  isSyncing: boolean
  pendingChanges: number
  lastSyncTime: Date | null
  syncNow: () => Promise<void>
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { t } = useLocale()
  const { setOnlineStatus, setSyncing, observations, incidents, inspections } = useAppStore()
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncingLocal] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // Count pending changes
  const pendingChanges = [
    ...observations.filter((o) => o.syncStatus === "pending"),
    ...incidents.filter((i) => i.syncStatus === "pending"),
    ...inspections.filter((i) => i.syncStatus === "pending"),
  ].length

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setOnlineStatus(true)
      toast.success(t("status.online"))
    }

    const handleOffline = () => {
      setIsOnline(false)
      setOnlineStatus(false)
      toast.warning(t("status.offline"))
    }

    // Set initial state
    setIsOnline(navigator.onLine)
    setOnlineStatus(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [setOnlineStatus, t])

  // Auto-sync when coming back online or when there are pending changes
  useEffect(() => {
    if (isOnline && pendingChanges > 0 && !isSyncing) {
      const timer = setTimeout(() => {
        syncNow()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isOnline, pendingChanges])

  const syncNow = async () => {
    if (!isOnline || isSyncing) return

    setIsSyncingLocal(true)
    setSyncing(true)

    try {
      // Simulate sync delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In a real app, this would sync to a backend
      // For now, we just mark everything as synced
      setLastSyncTime(new Date())
      toast.success(t("status.syncedSuccessfully"))
    } catch (error) {
      toast.error("Sync failed. Will retry when connection is restored.")
    } finally {
      setIsSyncingLocal(false)
      setSyncing(false)
    }
  }

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingChanges,
        lastSyncTime,
        syncNow,
      }}
    >
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  const context = useContext(OfflineContext)
  if (!context) {
    throw new Error("useOffline must be used within an OfflineProvider")
  }
  return context
}
