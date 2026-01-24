"use client"

import { use } from "react"
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
} from "lucide-react"
import { useRouter } from "next/navigation"
import { FormHeader } from "@/components/forms/form-header"
import { FormSection } from "@/components/forms/form-section"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/app-shell"
import { useLocale } from "@/lib/locale-context"
import { exportElementAsPdf } from "@/lib/pdf"
import { useAppStore } from "@/lib/store"
import { cn, distanceToNowLocalized, formatLocalized } from "@/lib/utils"

const statusVariants = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary/10 text-primary",
  open: "bg-warning/10 text-warning-foreground",
  closed: "bg-accent/10 text-accent",
  "in-progress": "bg-info/10 text-info",
}

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t, locale } = useLocale()
  const { incidents, projects, users } = useAppStore()

  const incident = incidents.find((i) => i.id === id)

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
  const creator = users.find((u) => u.id === incident.creatorId)

  return (
    <AppShell>
      <FormHeader
        title={incident.title || incident.number}
        backHref="/incidents"
        onEdit={() => router.push(`/incidents/${id}/edit`)}
        onExportPdf={() => exportElementAsPdf({ elementId: "form-detail", filename: `${(incident.title || incident.number)}-${locale}.pdf` })}
      />

      <div id="form-detail" className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header info */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{incident.number}</span>
              <Badge variant="secondary" className={cn(statusVariants[incident.status])}>
                {t(`status.${incident.status}` as any)}
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
                <p className="font-medium">{project?.name || "-"}</p>
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
                <p className="font-medium">{formatLocalized(new Date(incident.eventDate), "MMMM d, yyyy", locale)}</p>
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
                <p className="font-medium">{incident.accidentType || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("form.createdBy")}</p>
                <p className="font-medium">{creator?.name || "-"}</p>
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
                  <p className="text-sm text-foreground">{incident.investigation.danger}</p>
                </div>
              )}

              {incident.investigation.contributingCondition && (
                <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                  <p className="font-medium text-sm mb-2">{t("observation.contributingCondition")}</p>
                  <p className="text-sm text-foreground">{incident.investigation.contributingCondition}</p>
                </div>
              )}

              {incident.investigation.contributingBehavior && (
                <div className="p-4 bg-info/5 border border-info/20 rounded-lg">
                  <p className="font-medium text-sm mb-2">{t("observation.contributingBehavior")}</p>
                  <p className="text-sm text-foreground">{incident.investigation.contributingBehavior}</p>
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
                  <p className="font-medium">{incident.medicalTreatment.bodyPart || "-"}</p>
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
                        {formatLocalized(new Date(incident.medicalTreatment.dateOfDeath), "MMMM d, yyyy", locale)}
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {incident.attachments.map((attachment) => (
                <button
                  key={attachment.id}
                  type="button"
                  onClick={() => window.open(attachment.url, "_blank")}
                  className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer text-left"
                >
                  <p className="text-sm font-medium truncate">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>
                </button>
              ))}
            </div>
          </FormSection>
        )}
      </div>
    </AppShell>
  )
}
