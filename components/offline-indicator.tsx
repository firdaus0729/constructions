"use client"

import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from "lucide-react"
import { useOffline } from "@/lib/offline-provider"
import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface OfflineIndicatorProps {
  variant?: "minimal" | "full"
  className?: string
}

export function OfflineIndicator({ variant = "minimal", className }: OfflineIndicatorProps) {
  const { isOnline, isSyncing, pendingChanges, lastSyncTime, syncNow } = useOffline()
  const { t } = useLocale()

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {isOnline ? (
          isSyncing ? (
            <RefreshCw className="h-4 w-4 text-primary animate-spin" />
          ) : (
            <Wifi className="h-4 w-4 text-accent" />
          )
        ) : (
          <WifiOff className="h-4 w-4 text-destructive" />
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-3 p-4 rounded-lg border", className, !isOnline && "bg-destructive/5")}>
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
          isOnline ? "bg-accent/10" : "bg-destructive/10",
        )}
      >
        {isOnline ? (
          isSyncing ? (
            <RefreshCw className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <Cloud className="h-5 w-5 text-accent" />
          )
        ) : (
          <CloudOff className="h-5 w-5 text-destructive" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">
          {isOnline ? (isSyncing ? t("status.syncing") : t("status.online")) : t("status.offline")}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {pendingChanges > 0
            ? t("sync.pendingChanges", { count: pendingChanges })
            : lastSyncTime
              ? t("sync.lastSynced", { time: formatDistanceToNow(lastSyncTime, { addSuffix: true }) })
              : t("sync.allChangesSynced")}
        </p>
      </div>
      {isOnline && pendingChanges > 0 && (
        <Button variant="outline" size="sm" onClick={syncNow} disabled={isSyncing} className="shrink-0 px-3">
          {isSyncing ? t("sync.syncing") : t("sync.syncNow")}
        </Button>
      )}
    </div>
  )
}
