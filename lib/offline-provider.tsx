"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
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
  const { 
    setOnlineStatus, 
    setSyncing, 
    observations, 
    incidents, 
    inspections, 
    livrables,
    updateObservation,
    updateIncident,
    updateInspection,
    updateLivrable
  } = useAppStore()
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncingLocal] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const isSyncingRef = useRef(false)

  // Count pending changes
  const pendingChanges = [
    ...observations.filter((o) => o.syncStatus === "pending"),
    ...incidents.filter((i) => i.syncStatus === "pending"),
    ...inspections.filter((i) => i.syncStatus === "pending"),
    ...livrables.filter((s) => s.syncStatus === "pending"),
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

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncingRef.current) return
    
    // Prevent concurrent syncs using ref
    isSyncingRef.current = true
    setIsSyncingLocal(true)
    setSyncing(true)

    try {
      // Simulate sync delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mark all pending items as synced
      observations
        .filter((o) => o.syncStatus === "pending")
        .forEach((o) => updateObservation(o.id, { syncStatus: "synced" }))
      
      incidents
        .filter((i) => i.syncStatus === "pending")
        .forEach((i) => updateIncident(i.id, { syncStatus: "synced" }))
      
      inspections
        .filter((i) => i.syncStatus === "pending")
        .forEach((i) => updateInspection(i.id, { syncStatus: "synced" }))
      
      livrables
        .filter((l) => l.syncStatus === "pending")
        .forEach((l) => updateLivrable(l.id, { syncStatus: "synced" }))

      setLastSyncTime(new Date())
      toast.success(t("status.syncedSuccessfully"))
    } catch (error) {
      toast.error(t("status.syncFailed"))
    } finally {
      isSyncingRef.current = false
      setIsSyncingLocal(false)
      setSyncing(false)
    }
  }, [isOnline, observations, incidents, inspections, livrables, updateObservation, updateIncident, updateInspection, updateLivrable, setSyncing, t])

  // Auto-sync when coming back online (only trigger on online status change, not on every pendingChanges change)
  // This prevents infinite loops when on settings page
  useEffect(() => {
    if (isOnline && pendingChanges > 0 && !isSyncing) {
      // Only auto-sync when coming back online, not continuously
      const timer = setTimeout(() => {
        syncNow()
      }, 2000) // Increased delay to prevent immediate sync on page load
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]) // Only depend on isOnline to prevent loops - syncNow is stable via useCallback

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
