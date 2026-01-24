"use client"

import { Check, X, Minus, ClipboardCheck } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import type { InspectionItemResponse, InspectionSection } from "@/lib/types"

interface InspectionSummaryProps {
  sections: InspectionSection[]
  responses: InspectionItemResponse[]
}

export function InspectionSummary({ sections, responses }: InspectionSummaryProps) {
  const { t } = useLocale()

  const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0)
  const conformingCount = responses.filter((r) => r.response === "conforming").length
  const nonConformingCount = responses.filter((r) => r.response === "non-conforming").length
  const naCount = responses.filter((r) => r.response === "not-applicable").length
  const answeredCount = conformingCount + nonConformingCount + naCount
  const notAnsweredCount = totalItems - answeredCount

  const progressPercentage = totalItems > 0 ? Math.round((answeredCount / totalItems) * 100) : 0

  return (
    <div className="bg-card rounded-xl border p-4 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <ClipboardCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">{t("inspection.summary")}</h2>
          <p className="text-sm text-muted-foreground">
            {answeredCount} / {totalItems} {t("inspection.articlesInspected").toLowerCase()}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-right">{progressPercentage}% complete</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="flex flex-col items-center p-3 bg-accent/10 rounded-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 mb-2">
            <Check className="h-4 w-4 text-accent" />
          </div>
          <span className="text-2xl font-bold text-accent">{conformingCount}</span>
          <span className="text-xs text-muted-foreground text-center">{t("inspection.conforming")}</span>
        </div>

        <div className="flex flex-col items-center p-3 bg-destructive/10 rounded-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/20 mb-2">
            <X className="h-4 w-4 text-destructive" />
          </div>
          <span className="text-2xl font-bold text-destructive">{nonConformingCount}</span>
          <span className="text-xs text-muted-foreground text-center">{t("inspection.nonConforming")}</span>
        </div>

        <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted-foreground/20 mb-2">
            <Minus className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-2xl font-bold text-muted-foreground">{naCount}</span>
          <span className="text-xs text-muted-foreground text-center">{t("inspection.notApplicable")}</span>
        </div>

        <div className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted-foreground/10 mb-2">
            <span className="h-4 w-4 text-muted-foreground font-bold">?</span>
          </div>
          <span className="text-2xl font-bold text-muted-foreground">{notAnsweredCount}</span>
          <span className="text-xs text-muted-foreground text-center">{t("inspection.notAnswered" as any)}</span>
        </div>
      </div>
    </div>
  )
}
