"use client"

import { useEffect, useState } from "react"
import { CloudOff, RefreshCw, X } from "lucide-react"
import { useOffline } from "@/lib/offline-provider"
import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SyncStatusBanner() {
  const { isOnline, isSyncing, pendingChanges, lastSyncTime } = useOffline()
  const { t } = useLocale()
  const [dismissed, setDismissed] = useState(false)

  // Reset dismissed state when going offline
  useEffect(() => {
    if (!isOnline) {
      setDismissed(false)
    }
  }, [isOnline])

  // Don't show if online with no pending changes, or if dismissed
  if ((isOnline && pendingChanges === 0) || dismissed) {
    return null
  }

  // Format last sync time
  const formatLastSync = () => {
    if (!lastSyncTime) return null
    const now = new Date()
    const diffMs = now.getTime() - lastSyncTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return "À l'instant"
    if (diffMins === 1) return "Il y a 1 minute"
    if (diffMins < 60) return `Il y a ${diffMins} minutes`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return "Il y a 1 heure"
    if (diffHours < 24) return `Il y a ${diffHours} heures`
    
    return lastSyncTime.toLocaleDateString("fr-FR", { 
      day: "numeric", 
      month: "short", 
      hour: "2-digit", 
      minute: "2-digit" 
    })
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md w-full z-50",
        "flex flex-wrap items-center gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm",
        isOnline 
          ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" 
          : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
      )}
      style={{ boxSizing: 'border-box' }}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
          isOnline ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900",
        )}
      >
        {isSyncing ? (
          <RefreshCw className="h-5 w-5 text-green-600 dark:text-green-400 animate-spin" />
        ) : (
          <CloudOff className={cn("h-5 w-5", isOnline ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold text-sm break-words", isOnline ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100")}> 
          {isOnline 
            ? (isSyncing ? t("status.syncing") : (lastSyncTime ? `Dernière synchronisation : ${formatLastSync()}` : "En attente de synchronisation"))
            : t("status.offline")}
        </p>
        <p className={cn("text-xs break-words", isOnline ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300")}> 
          {isOnline 
            ? null
            : t("status.localSaveInfo")}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDismissed(true)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
