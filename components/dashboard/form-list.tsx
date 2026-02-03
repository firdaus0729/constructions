"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ClipboardCheck, Eye, AlertTriangle, FileText, Cloud, CloudOff, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { FormListItem } from "@/lib/types"
import { useLocale } from "@/lib/locale-context"

const typeIcons = {
  inspection: ClipboardCheck,
  observation: Eye,
  incident: AlertTriangle,
  livrable: FileText,
}

const typeColors = {
  inspection: "bg-[#051DF7] text-white",
  observation: "bg-[#051DF7] text-white",
  incident: "bg-[#F70505] text-white",
  livrable: "bg-muted text-muted-foreground",
}

const statusVariants = {
  submitted: "bg-[#999999] text-white",
  draft: "bg-[#27F54D] text-white",
  "in-progress": "bg-[#F28705] text-white",
  open: "bg-[#051DF7] text-white",
  closed: "bg-[#05F719] text-white",
}

export interface FormListStatusOverride {
  labelKey: string
  className: string
}

interface FormListProps {
  items: FormListItem[]
  emptyMessage: string
  /** When set, all items show this status badge (e.g. "Fermé" / "Initié") instead of item.status */
  statusOverride?: FormListStatusOverride
}

export function FormList({ items, emptyMessage, statusOverride }: FormListProps) {
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
        const Icon = (typeIcons as any)[item.type] || FileText
        const href = `/${item.type}s/${item.id}`

        return (
          <Link
            key={item.id}
            href={href}
            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors min-h-[72px]"
          >
            <div
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-lg shrink-0",
                (typeColors as any)[item.type] || "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm truncate">{item.title || item.number}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs shrink-0",
                    statusOverride ? statusOverride.className : statusVariants[item.status]
                  )}
                >
                  {statusOverride
                    ? t(statusOverride.labelKey as any)
                    : item.status === "in-progress"
                      ? t("status.inProgress")
                      : t(`status.${item.status}` as any)}
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
