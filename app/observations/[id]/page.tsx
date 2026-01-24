"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Eye, Calendar, User, Building, AlertTriangle, FileText, X } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { FormHeader } from "@/components/forms/form-header"
import { FormSection } from "@/components/forms/form-section"
import { Badge } from "@/components/ui/badge"
import { useLocale } from "@/lib/locale-context"
import { exportObservationAsPdf } from "@/lib/pdf"
import { useAppStore } from "@/lib/store"
import { cn, distanceToNowLocalized, formatLocalized } from "@/lib/utils"

const statusVariants = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary/10 text-primary",
  open: "bg-warning/10 text-warning-foreground",
  closed: "bg-accent/10 text-accent",
  "in-progress": "bg-info/10 text-info",
}

const priorityVariants = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning-foreground",
  high: "bg-destructive/10 text-destructive",
  critical: "bg-destructive text-destructive-foreground",
}


function ImagePreviewButton({ attachment }: { attachment: any }) {
  const [showPreview, setShowPreview] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setShowPreview(true)}
        className="relative group rounded-lg overflow-hidden border border-border bg-muted/50 aspect-square cursor-pointer hover:border-primary transition-all hover:scale-105"
      >
        <img
          src={attachment.url}
          alt={attachment.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Eye className="h-6 w-6 text-white" />
          <span className="sr-only">Preview image</span>
        </div>
      </button>
      {showPreview && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div className="max-w-4xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={attachment.url}
              alt={attachment.name}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="absolute -top-2 -right-2 bg-white hover:bg-gray-100 text-gray-800 rounded-full p-2 shadow-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function ObservationDetailHeader({ observation, id, locale }: { observation: any; id: string; locale: string }) {
  const router = useRouter()
  const { t } = useLocale()
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPdf = async () => {
    try {
      setIsExporting(true)
      const filename = `${(observation.title || observation.number)}-${locale}.pdf`
      await exportObservationAsPdf(observation, filename)
    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to export PDF")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <FormHeader
      title={observation.title || observation.number}
      backHref="/observations"
      onEdit={() => router.push(`/observations/${id}/edit`)}
      onExportPdf={handleExportPdf}
      isSaving={isExporting}
    />
  )
}


export default function ObservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t, locale } = useLocale()
  const { observations, projects, users } = useAppStore()

  const observation = observations.find((o) => o.id === id)

  if (!observation) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">{t("empty.notFound.observation")}</p>
        </div>
      </AppShell>
    )
  }

  const project = projects.find((p) => p.id === observation.projectId)
  const creator = users.find((u) => u.id === observation.creatorId)
  const assignedPerson = users.find((u) => u.id === observation.assignedPersonId)

  return (
    <AppShell>
      <ObservationDetailHeader 
        observation={observation}
        id={id}
        locale={locale}
      />

      <div id="form-detail" className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header info */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-info/10">
            <Eye className="h-6 w-6 text-info" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{observation.number}</span>
              <Badge variant="secondary" className={cn(statusVariants[observation.status])}>
                {t(`status.${observation.status}` as any)}
              </Badge>
              <Badge variant="secondary" className={cn(priorityVariants[observation.priority])}>
                {t(`priority.${observation.priority}` as any)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("common.updated", { distance: distanceToNowLocalized(new Date(observation.updatedAt), locale) })}
            </p>
          </div>
        </div>

        {/* Details */}
        <FormSection title={t("section.details")} collapsible={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <p className="text-xs text-muted-foreground">{t("observation.type")}</p>
                <p className="font-medium">{observation.type ? t(`observation.type.${observation.type}` as any) : "-"}</p>
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
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("observation.assignedPerson")}</p>
                <p className="font-medium">{assignedPerson?.name || "-"}</p>
              </div>
            </div>

            {observation.dueDate && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("observation.dueDate")}</p>
                  <p className="font-medium">{formatLocalized(new Date(observation.dueDate), "MMM d, yyyy", locale)}</p>
                </div>
              </div>
            )}

            {observation.concernedCompany && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("observation.concernedCompany")}</p>
                  <p className="font-medium">{observation.concernedCompany}</p>
                </div>
              </div>
            )}
          </div>
        </FormSection>

        {/* Description */}
        {observation.description && (
          <FormSection title={t("form.description")}>
            <p className="text-foreground whitespace-pre-wrap">{observation.description}</p>
            {observation.referenceArticle && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{t("observation.referenceArticle")}</p>
                <p className="font-medium">{observation.referenceArticle}</p>
              </div>
            )}
          </FormSection>
        )}

        {/* Safety Analysis */}
        {(observation.safetyAnalysis.danger ||
          observation.safetyAnalysis.contributingCondition ||
          observation.safetyAnalysis.contributingBehavior) && (
          <FormSection title={t("observation.safetyAnalysis")}>
            <div className="space-y-4">
              {observation.safetyAnalysis.danger && (
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="font-medium text-sm">{t("observation.danger")}</p>
                  </div>
                  <p className="text-sm text-foreground">{observation.safetyAnalysis.danger}</p>
                </div>
              )}

              {observation.safetyAnalysis.contributingCondition && (
                <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                  <p className="font-medium text-sm mb-2">{t("observation.contributingCondition")}</p>
                  <p className="text-sm text-foreground">{observation.safetyAnalysis.contributingCondition}</p>
                </div>
              )}

              {observation.safetyAnalysis.contributingBehavior && (
                <div className="p-4 bg-info/5 border border-info/20 rounded-lg">
                  <p className="font-medium text-sm mb-2">{t("observation.contributingBehavior")}</p>
                  <p className="text-sm text-foreground">{observation.safetyAnalysis.contributingBehavior}</p>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Attachments */}
        {observation.attachments.length > 0 && (
          <FormSection title={t("form.attachments")}>
            <div className="space-y-4">
              {/* Images */}
              {observation.attachments.some((a: any) => a.type?.startsWith("image/")) && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-3">{t("field.photos")}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {observation.attachments.map((attachment: any) => {
                      if (!attachment.type?.startsWith("image/")) return null
                      return (
                        <ImagePreviewButton key={attachment.id} attachment={attachment} />
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* Other files */}
              {observation.attachments.some((a: any) => !a.type?.startsWith("image/")) && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-3">Files</p>
                  <div className="space-y-2">
                    {observation.attachments.map((attachment: any) => {
                      if (attachment.type?.startsWith("image/")) return null
                      return (
                        <button
                          key={attachment.id}
                          type="button"
                          onClick={() => window.open(attachment.url, "_blank")}
                          className="w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer text-left"
                        >
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        )}
      </div>
    </AppShell>
    )
}
