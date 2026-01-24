"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ClipboardCheck, Eye, AlertTriangle, Cloud, CloudOff, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { FormListItem } from "@/lib/types"
import { useLocale } from "@/lib/locale-context"

const typeIcons = {
  inspection: ClipboardCheck,
  observation: Eye,
  incident: AlertTriangle,
}

const typeColors = {
  inspection: "text-primary",
  observation: "text-info",
  incident: "text-destructive",
}

const statusVariants = {
  draft: "bg-muted text-white",
  submitted: "bg-primary/10 text-white",
  open: "bg-warning/10 text-warning-foreground",
  closed: "bg-accent/10 text-accent",
  "in-progress": "bg-orange-500 text-white",
}

interface FormListProps {
  items: FormListItem[]
  emptyMessage: string
}

export function FormList({ items, emptyMessage }: FormListProps) {
  const { t } = useLocale()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {items.map((item) => {
        const Icon = typeIcons[item.type]
        const href = `/${item.type}s/${item.id}`

        return (
          <Link
            key={item.id}
            href={href}
            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors min-h-[72px]"
          >
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg bg-muted shrink-0",
                typeColors[item.type],
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm truncate">{item.title || item.number}</span>
                <Badge variant="secondary" className={cn("text-xs shrink-0", statusVariants[item.status])}>
                  {t(`status.${item.status}` as any)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">{item.projectName}</span>
                <span>•</span>
                <span className="shrink-0">{formatDistanceToNow(item.updatedAt, { addSuffix: true })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {item.syncStatus === "synced" ? (
                <Cloud className="h-4 w-4 text-accent" />
              ) : (
                <CloudOff className="h-4 w-4 text-muted-foreground" />
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
