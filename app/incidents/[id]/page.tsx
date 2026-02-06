"use client"

import { use, useState } from "react"
import { format } from "date-fns"
import {
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Building,
  MapPin,
  Activity,
  Heart,
  FileText,
  AlertCircle,
  Eye,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { FormHeader } from "@/components/forms/form-header"
import { FormSection } from "@/components/forms/form-section"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/app-shell"
import { useLocale } from "@/lib/locale-context"
import { exportIncidentAsPdf } from "@/lib/pdf"
import { toast } from "sonner"
import { useAppStore } from "@/lib/store"
import { cn, distanceToNowLocalized, formatDateOnlyLocalized } from "@/lib/utils"

// Status display: Initié (any non-closed) / Fermé only, with requested colors
const INITIATED_BADGE = "bg-[#27F54D] text-white"
const CLOSED_BADGE = "bg-[#999999] text-white"

const isClosed = (status: string) => status === "closed"
const getDisplayStatusKey = (status: string): string =>
  isClosed(status) ? "status.closed" : "status.initiated"

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

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t, locale } = useLocale()
  const { incidents, projects, users, authUsers = [], incidentOptionLists } = useAppStore()

  const incident = incidents.find((i) => i.id === id)
  const creator = (authUsers?.find((u: any) => u.id === incident?.creatorId) || users?.find((u) => u.id === incident?.creatorId)) as { name: string } | undefined
  const accidentTypeLabel = incidentOptionLists?.accidentTypes?.find((t: { id: string; label: string }) => t.id === incident?.accidentType)?.label || incident?.accidentType
  const resolveIncidentOptionLabel = (
    items: { id: string; label: string }[] | undefined,
    value: string | undefined,
  ): string => {
    if (!value) return ""
    const match = items?.find((it) => it.id === value)
    return match?.label || value
  }

  if (!incident) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">{t("empty.notFound.incident")}</p>
        </div>
      </AppShell>
    )
  }

  const project = projects.find((p) => p.id === incident.projectId)

  return (
    <AppShell>
      <FormHeader
        title={incident.title || incident.number}
        backHref="/incidents"
        onEdit={() => router.push(`/incidents/${id}/edit`)}
        onExportPdf={async () => {
          try {
            await exportIncidentAsPdf(incident, undefined, { projects, users })
            toast.success(t("toast.pdfExportSuccess.incident" as any))
          } catch (e) {
            console.error("PDF export error:", e)
            toast.error(t("toast.pdfExportError.incident" as any))
          }
        }}
      />

      <div id="form-detail" className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header info */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#F70505]">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{incident.number}</span>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  isClosed(incident.status) ? CLOSED_BADGE : INITIATED_BADGE,
                )}
              >
                {t(getDisplayStatusKey(incident.status) as any)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("common.updated", { distance: distanceToNowLocalized(new Date(incident.updatedAt), locale) })}
            </p>
          </div>
        </div>

        {/* Event Details */}
        <FormSection title={t("incident.eventDetails")} collapsible={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("form.project")}</p>
                <p className="font-medium">
                  {project?.name || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("observation.projectNumber")}</p>
                <p className="font-medium">{(incident as any).projectNumber || project?.code || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("incident.location")}</p>
                <p className="font-medium">{incident.location || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("incident.eventDate")}</p>
                <p className="font-medium">{formatDateOnlyLocalized(incident.eventDate, "MMMM d, yyyy", locale)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("incident.eventTime")}</p>
                <p className="font-medium">{incident.eventTime || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("incident.accidentType")}</p>
                <p className="font-medium">{accidentTypeLabel || "-"}</p>
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
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("form.status")}</p>
                <p className="font-medium">{t(getDisplayStatusKey(incident.status) as any)}</p>
              </div>
            </div>
          </div>
        </FormSection>

        {/* Description */}
        {incident.description && (
          <FormSection title={t("form.description")}>
            <p className="text-foreground whitespace-pre-wrap">{incident.description}</p>
          </FormSection>
        )}

        {/* Investigation */}
        {(incident.investigation.danger ||
          incident.investigation.contributingCondition ||
          incident.investigation.contributingBehavior) && (
          <FormSection title={t("incident.investigation")}>
            <div className="space-y-4">
              {incident.investigation.danger && (
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="font-medium text-sm">{t("observation.danger")}</p>
                  </div>
                  <p className="text-sm text-foreground">
                    {resolveIncidentOptionLabel(incidentOptionLists.danger, incident.investigation.danger) || "-"}
                  </p>
                </div>
              )}

              {incident.investigation.contributingCondition && (
                <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                  <p className="font-medium text-sm mb-2">{t("observation.contributingCondition")}</p>
                  <p className="text-sm text-foreground">
                    {resolveIncidentOptionLabel(
                      incidentOptionLists.contributingCondition,
                      incident.investigation.contributingCondition,
                    ) || "-"}
                  </p>
                </div>
              )}

              {incident.investigation.contributingBehavior && (
                <div className="p-4 bg-info/5 border border-info/20 rounded-lg">
                  <p className="font-medium text-sm mb-2">{t("observation.contributingBehavior")}</p>
                  <p className="text-sm text-foreground">
                    {resolveIncidentOptionLabel(
                      incidentOptionLists.contributingBehavior,
                      incident.investigation.contributingBehavior,
                    ) || "-"}
                  </p>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Medical Treatment */}
        {incident.medicalTreatment && (
          <FormSection title={t("incident.medicalTreatment")}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("incident.injuryType")}</p>
                  <p className="font-medium">{incident.medicalTreatment.injuryType || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Heart className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("incident.bodyPart")}</p>
                  <p className="font-medium">{resolveIncidentOptionLabel(incidentOptionLists?.bodyParts, incident.medicalTreatment?.bodyPart) || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("incident.emergencyTreatment")}</p>
                  <p className="font-medium">
                    {incident.medicalTreatment.emergencyTreatment ? t("action.yes") : t("action.no")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("incident.hospitalized")}</p>
                  <p className="font-medium">
                    {incident.medicalTreatment.hospitalizedOvernight ? t("action.yes") : t("action.no")}
                  </p>
                </div>
              </div>

              {incident.medicalTreatment.daysAbsent > 0 && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("incident.daysAbsent")}</p>
                    <p className="font-medium">{t("units.days", { count: incident.medicalTreatment.daysAbsent })}</p>
                  </div>
                </div>
              )}

              {incident.medicalTreatment.restrictedWorkDays > 0 && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("incident.restrictedDays")}</p>
                    <p className="font-medium">{t("units.days", { count: incident.medicalTreatment.restrictedWorkDays })}</p>
                  </div>
                </div>
              )}

              {incident.medicalTreatment.dateOfDeath && (
                <div className="md:col-span-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t("incident.dateOfDeath")}</p>
                      <p className="font-medium text-destructive">
                        {formatDateOnlyLocalized(incident.medicalTreatment.dateOfDeath, "MMMM d, yyyy", locale)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Attachments */}
        {incident.attachments.length > 0 && (
          <FormSection title={t("form.attachments")}>
            {/* Image attachments */}
            {incident.attachments.some((a: any) => a.type?.startsWith("image/")) && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">{t("form.attachments")} - {t("field.photos")}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {incident.attachments
                    .filter((a: any) => a.type?.startsWith("image/"))
                    .map((attachment: any) => (
                      <ImagePreviewButton key={attachment.id} attachment={attachment} />
                    ))}
                </div>
              </div>
            )}
            
            {/* Non-image attachments */}
            {incident.attachments.some((a: any) => !a.type?.startsWith("image/")) && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">{t("form.attachments")}</p>
                <div className="space-y-2">
                  {incident.attachments
                    .filter((a: any) => !a.type?.startsWith("image/"))
                    .map((attachment: any) => (
                      <button
                        key={attachment.id}
                        type="button"
                        onClick={() => window.open(attachment.url, "_blank")}
                        className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer text-left"
                      >
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </FormSection>
        )}
      </div>
    </AppShell>
  )
}
