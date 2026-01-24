"use client"

import { useState } from "react"
import { Check, X, Minus, MessageSquare, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useLocale } from "@/lib/locale-context"
import type { InspectionSection, InspectionResponse, InspectionItemResponse } from "@/lib/types"

interface InspectionChecklistProps {
  section: InspectionSection
  responses: InspectionItemResponse[]
  onResponseChange: (itemId: string, response: InspectionResponse) => void
  onCommentChange: (itemId: string, comment: string) => void
}

export function InspectionChecklist({
  section,
  responses,
  onResponseChange,
  onCommentChange,
}: InspectionChecklistProps) {
  const { t } = useLocale()
  const [isOpen, setIsOpen] = useState(true)

  const getResponseForItem = (itemId: string) => {
    return responses.find((r) => r.itemId === itemId)
  }

  // Calculate summary
  const conformingCount = responses.filter((r) => r.response === "conforming").length
  const nonConformingCount = responses.filter((r) => r.response === "non-conforming").length
  const naCount = responses.filter((r) => r.response === "not-applicable").length
  const answeredCount = conformingCount + nonConformingCount + naCount

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card rounded-xl border overflow-hidden">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 md:p-5 hover:bg-muted/50 transition-colors">
          <div className="text-left flex-1">
            <h3 className="text-base font-semibold text-foreground">{t(section.titleKey as any)}</h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>
                {answeredCount}/{section.items.length} answered
              </span>
              {nonConformingCount > 0 && (
                <span className="text-destructive font-medium">{nonConformingCount} non-conforming</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1">
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-accent/10 text-accent text-xs">
                <Check className="h-3 w-3" />
                {conformingCount}
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-destructive/10 text-destructive text-xs">
                <X className="h-3 w-3" />
                {nonConformingCount}
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted text-muted-foreground text-xs">
                <Minus className="h-3 w-3" />
                {naCount}
              </div>
            </div>
            <ChevronDown
              className={cn("h-5 w-5 text-muted-foreground transition-transform", isOpen && "transform rotate-180")}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t">
            {/* Instruction note */}
            <div className="px-4 md:px-5 py-3 bg-muted/30 text-sm text-muted-foreground">
              {t("inspection.instruction")}
            </div>

            {/* Checklist items */}
            <div className="divide-y">
              {section.items.map((item) => {
                const itemResponse = getResponseForItem(item.id)
                return (
                  <div key={item.id} className="px-4 md:px-5 py-4">
                    <div className="flex items-start gap-4">
                      {/* Item number */}
                      <span className="text-sm font-mono text-muted-foreground shrink-0 w-10">{item.number}</span>

                      {/* Label */}
                      <p className="flex-1 text-sm text-foreground min-w-0">{t(`inspection.item.${item.id}` as any)}</p>

                      {/* Response buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-10 w-10 rounded-lg transition-all",
                            itemResponse?.response === "conforming"
                              ? "bg-accent text-accent-foreground hover:bg-accent/90"
                              : "hover:bg-accent/10 text-muted-foreground hover:text-accent",
                          )}
                          onClick={() => onResponseChange(item.id, "conforming")}
                          aria-label="Conforming"
                        >
                          <Check className="h-5 w-5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-10 w-10 rounded-lg transition-all",
                            itemResponse?.response === "non-conforming"
                              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive",
                          )}
                          onClick={() => onResponseChange(item.id, "non-conforming")}
                          aria-label="Non-conforming"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-10 w-10 rounded-lg transition-all",
                            itemResponse?.response === "not-applicable"
                              ? "bg-muted text-foreground"
                              : "hover:bg-muted text-muted-foreground",
                          )}
                          onClick={() => onResponseChange(item.id, "not-applicable")}
                          aria-label="Not applicable"
                        >
                          <Minus className="h-5 w-5" />
                        </Button>

                      </div>
                    </div>

                    {/* Comment field always available */}
                    <div className="mt-3 ml-14">
                      <Textarea
                        placeholder={t("inspection.addComment")}
                        value={itemResponse?.comment || ""}
                        onChange={(e) => onCommentChange(item.id, e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
