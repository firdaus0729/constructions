"use client"

import { use } from "react"
import { format } from "date-fns"
import { ClipboardCheck, Building, User, FileText, Check, X, Minus, Calendar, MessageSquare, Share2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { FormHeader } from "@/components/forms/form-header"
import { FormSection } from "@/components/forms/form-section"
import { InspectionSummary } from "@/components/forms/inspection-summary"
import { Badge } from "@/components/ui/badge"
import { useLocale } from "@/lib/locale-context"
import { exportInspectionAsPdf } from "@/lib/pdf"
import { useAppStore, inspectionSections } from "@/lib/store"
import { cn, distanceToNowLocalized, formatLocalized } from "@/lib/utils"

const statusVariants = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary/10 text-primary",
  open: "bg-warning/10 text-warning-foreground",
  closed: "bg-accent/10 text-accent",
  "in-progress": "bg-info/10 text-info",
}

export default function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t, locale } = useLocale()
  const { inspections, projects, users } = useAppStore()

  const inspection = inspections.find((i) => i.id === id)

  if (!inspection) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">{t("empty.notFound.inspection")}</p>
        </div>
      </AppShell>
    )
  }

  const project = projects.find((p) => p.id === inspection.projectId)
  const creator = users.find((u) => u.id === inspection.creatorId)

  const getResponseIcon = (response: string | null) => {
    switch (response) {
      case "conforming":
        return <Check className="h-4 w-4 text-accent" />
      case "non-conforming":
        return <X className="h-4 w-4 text-destructive" />
      case "not-applicable":
        return <Minus className="h-4 w-4 text-muted-foreground" />
      default:
        return null
    }
  }

  const getResponseBg = (response: string | null) => {
    switch (response) {
      case "conforming":
        return "bg-accent/10"
      case "non-conforming":
        return "bg-destructive/10"
      case "not-applicable":
        return "bg-muted"
      default:
        return ""
    }
  }

  return (
    <AppShell>

      <FormHeader
        title={inspection.documentTitle || "Inspection"}
        backHref="/inspections"
        onEdit={() => router.push(`/inspections/${id}/edit`)}
        onExportPdf={() => exportInspectionAsPdf(inspection, `${(inspection.documentTitle || "Inspection")}-${locale}.pdf`)}
      />

      <div id="form-detail" className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header info */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <ClipboardCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{inspection.id.slice(-6).toUpperCase()}</span>
              <Badge variant="secondary" className={cn(statusVariants[inspection.status])}>
                {t(`status.${inspection.status}` as any)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("common.updated", { distance: distanceToNowLocalized(new Date(inspection.updatedAt), locale) })}
            </p>
          </div>
        </div>

        {/* Summary */}
        <InspectionSummary sections={inspectionSections} responses={inspection.responses} />

        {/* Details */}
        <FormSection title={t("section.details")} collapsible={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("inspection.number")}</p>
                <p className="font-medium font-mono">{inspection.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("observation.projectNumber")}</p>
                <p className="font-medium">{project?.number || project?.name || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("form.project")}</p>
                <p className="font-medium">{project?.name || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("inspection.type")}</p>
                <p className="font-medium">{inspection.type}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Share2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("form.distribution")}</p>
                <p className="font-medium">
                  {Array.isArray(inspection.distribution) && inspection.distribution.length > 0
                    ? inspection.distribution
                        .map((id: string) => users.find((u) => u.id === id)?.name || id)
                        .join(", ")
                    : "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("form.closedBy")}</p>
                <p className="font-medium">{inspection.closedById ? (users.find((u) => u.id === inspection.closedById)?.name || "-") : "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("form.status")}</p>
                <p className="font-medium">{t(`status.${inspection.status}` as any)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("form.createdBy")}</p>
                <p className="font-medium">{creator?.name || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("inspection.createdLabel")}</p>
                <p className="font-medium">{formatLocalized(new Date(inspection.createdAt), "MMM d, yyyy", locale)}</p>
              </div>
            </div>
          </div>

          {inspection.description && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{t("form.description")}</p>
              <p className="text-foreground">{inspection.description}</p>
            </div>
          )}
        </FormSection>

        {/* Inspection Results by Section */}
        {inspectionSections.map((section) => {
          const sectionResponses = inspection.responses.filter((r) =>
            section.items.some((item) => item.id === r.itemId),
          )
          const hasNonConforming = sectionResponses.some((r) => r.response === "non-conforming")

          return (
            <FormSection
              key={section.id}
              title={t(section.titleKey as any)}
              description={
                hasNonConforming
                  ? t("inspection.issuesCount", { count: sectionResponses.filter((r) => r.response === "non-conforming").length })
                  : undefined
              }
            >
              <div className="space-y-2">
                {section.items.map((item) => {
                  const response = inspection.responses.find((r) => r.itemId === item.id)
                  return (
                    <div
                      key={item.id}
                      className={cn("flex items-start gap-3 p-3 rounded-lg", getResponseBg(response?.response || null))}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background">
                        {getResponseIcon(response?.response || null)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{item.number}</span>
                          <p className="text-sm">{t(`inspection.item.${item.id}` as any)}</p>
                        </div>
                        {response?.comment && (
                          <div className="flex items-start gap-2 mt-2 text-sm text-muted-foreground">
                            <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>{response.comment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </FormSection>
          )
        })}
      </div>
    </AppShell>
  )
}
