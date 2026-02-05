"use client"

import { use } from "react"
import { format } from "date-fns"
import { FileText, Calendar, User, Building } from "lucide-react"
import { useRouter } from "next/navigation"
import { FormHeader } from "@/components/forms/form-header"
import { FormSection } from "@/components/forms/form-section"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/app-shell"
import { useLocale } from "@/lib/locale-context"
import { toast } from "sonner"
import { useAppStore } from "@/lib/store"
import { cn, distanceToNowLocalized, formatLocalized } from "@/lib/utils"
import { exportLivrableAsPdf } from "@/lib/pdf"

const statusVariants = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary/10 text-primary",
  open: "bg-warning/10 text-warning-foreground",
  closed: "bg-accent/10 text-accent",
  "in-progress": "bg-info/10 text-info",
}

const getStatusTranslationKey = (status: string): string => {
  const statusMap: Record<string, string> = {
    "draft": "status.draft",
    "open": "status.open",
    "in-progress": "status.inProgress",
    "closed": "status.closed",
    "submitted": "status.submitted",
  }
  return statusMap[status] || `status.${status}`
}

export default function LivrableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t, locale } = useLocale()
  const { livrables, projects, users, authUsers } = useAppStore()

  const livrable = livrables.find((s) => s.id === id)

  if (!livrable) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">{t("empty.notFound.livrable")}</p>
        </div>
      </AppShell>
    )
  }

  const project = projects.find((p) => p.id === livrable.projectId)
  const creator = users.find((u) => u.id === livrable.creatorId)
  const userNameById = (idOrEmail: string | undefined) => {
    if (!idOrEmail) return "-"
    if (idOrEmail === "project_manager") return t("livrable.managerOption.projectManager")
    if (idOrEmail.includes("@")) return idOrEmail
    return authUsers.find((u) => u.id === idOrEmail)?.name || idOrEmail
  }

  const distributionNames =
    (livrable.distribution || [])
      .map((v: string) => {
        if (!v) return null
        if (v.includes("@")) return v
        return userNameById(v)
      })
      .filter(Boolean) as string[]

  const linkLines =
    String(livrable.linkedDrawings || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)

  return (
    <AppShell>
      <FormHeader
        title={livrable.title || livrable.number}
        backHref="/livrables"
        onEdit={() => router.push(`/livrables/${id}/edit`)}
        onExportPdf={async () => {
          try {
            await exportLivrableAsPdf(livrable, "Livrable.pdf")
            toast.success(t("toast.pdfExportSuccess.livrable" as any))
          } catch (e) {
            console.error(e)
            toast.error(t("toast.pdfExportError.livrable" as any))
          }
        }}
      />

      <div id="form-detail" className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header info */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{livrable.number}</span>
              <Badge variant="secondary" className={cn(statusVariants[livrable.status])}>
                {t(getStatusTranslationKey(livrable.status) as any)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t("common.updated", { distance: distanceToNowLocalized(new Date(livrable.updatedAt), locale) })}
            </p>
          </div>
        </div>

        {/* Basic Details */}
        <FormSection title={t("livrable.basicInfo")} collapsible={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("form.project")}</p>
                <p className="font-medium">{project?.name || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("form.createdBy")}</p>
                <p className="font-medium">{creator?.name || "-"}</p>
              </div>
            </div>

            {livrable.submittalType && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("livrable.livrableType")}</p>
                  <p className="font-medium">{livrable.submittalType || "-"}</p>
                </div>
              </div>
            )}

            {livrable.submittalPackage && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("livrable.livrablePackage")}</p>
                  <p className="font-medium">{livrable.submittalPackage || "-"}</p>
                </div>
              </div>
            )}

            {livrable.receivedDate && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("livrable.receivedDate")}</p>
                  <p className="font-medium">{formatLocalized(new Date(livrable.receivedDate), "MMMM d, yyyy", locale)}</p>
                </div>
              </div>
            )}

            {livrable.costCode && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("livrable.costCode")}</p>
                  <p className="font-medium">{livrable.costCode}</p>
                </div>
              </div>
            )}

            {livrable.location && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("livrable.location")}</p>
                  <p className="font-medium">{livrable.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("livrable.number")} / {t("livrable.revision")}</p>
                <p className="font-medium">{livrable.numberValue || "-"} / {livrable.revision || "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("livrable.livrableManager")}</p>
                <p className="font-medium">{userNameById(livrable.submittalManager)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("submittal.responsibleContractor")}</p>
                <p className="font-medium">{userNameById(livrable.responsibleContractor)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("livrable.receivedFrom")}</p>
                <p className="font-medium">{userNameById(livrable.receivedFrom)}</p>
              </div>
            </div>

            {livrable.ballInCourt && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg md:col-span-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("livrable.ballInCourt")}</p>
                  <p className="font-medium">{livrable.ballInCourt}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("livrable.isPrivate")}</p>
                <p className="font-medium">{livrable.isPrivate ? t("action.yes") : t("action.no")}</p>
              </div>
            </div>
          </div>
        </FormSection>

        {/* Dates */}
        <FormSection title={t("section.details")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t("livrable.submitBy")}</p>
              <p className="font-medium">{livrable.submitBy ? formatLocalized(new Date(livrable.submitBy), "MMMM d, yyyy", locale) : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("submittal.finalDueDate")}</p>
              <p className="font-medium">{livrable.finalDueDate ? formatLocalized(new Date(livrable.finalDueDate), "MMMM d, yyyy", locale) : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("livrable.issueDate")}</p>
              <p className="font-medium">{livrable.issueDate ? formatLocalized(new Date(livrable.issueDate), "MMMM d, yyyy", locale) : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("submittal.receivedDate")}</p>
              <p className="font-medium">{livrable.receivedDate ? formatLocalized(new Date(livrable.receivedDate), "MMMM d, yyyy", locale) : "-"}</p>
            </div>
          </div>
        </FormSection>

        {/* Schedule */}
        <FormSection title={t("submittal.scheduleInfo")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t("livrable.scheduleTask")}</p>
              <p className="font-medium">{livrable.scheduleTask || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("submittal.requiredOnSiteDate")}</p>
              <p className="font-medium">{livrable.requiredOnSiteDate ? formatLocalized(new Date(livrable.requiredOnSiteDate), "MMMM d, yyyy", locale) : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("livrable.leadTime")}</p>
              <p className="font-medium">{typeof livrable.leadTime === "number" ? `${livrable.leadTime}` : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("submittal.plannedReturnDate")}</p>
              <p className="font-medium">{livrable.plannedReturnDate ? formatLocalized(new Date(livrable.plannedReturnDate), "MMMM d, yyyy", locale) : "-"}</p>
            </div>
          </div>
        </FormSection>

        {/* Delivery */}
        <FormSection title={t("livrable.deliveryInfo")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t("submittal.anticipatedDeliveryDate")}</p>
              <p className="font-medium">{livrable.anticipatedDeliveryDate ? formatLocalized(new Date(livrable.anticipatedDeliveryDate), "MMMM d, yyyy", locale) : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("livrable.confirmedDeliveryDate")}</p>
              <p className="font-medium">{livrable.confirmedDeliveryDate ? formatLocalized(new Date(livrable.confirmedDeliveryDate), "MMMM d, yyyy", locale) : "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("submittal.actualDeliveryDate")}</p>
              <p className="font-medium">{livrable.actualDeliveryDate ? formatLocalized(new Date(livrable.actualDeliveryDate), "MMMM d, yyyy", locale) : "-"}</p>
            </div>
          </div>
        </FormSection>

        {/* Linked Drawings */}
        <FormSection title={t("livrable.linkedDrawings")}>
          {linkLines.length > 0 ? (
            <div className="space-y-2">
              {linkLines.map((u) => (
                <a key={u} href={u} target="_blank" rel="noreferrer" className="block text-sm text-primary underline break-all">
                  {u}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">-</p>
          )}
        </FormSection>

        {/* Distribution */}
        <FormSection title={t("form.distribution")}>
          {distributionNames.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {distributionNames.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">-</p>
          )}
        </FormSection>

        {/* Description */}
        {livrable.description && (
          <FormSection title={t("form.description")}>
            <p className="text-foreground whitespace-pre-wrap">{livrable.description}</p>
          </FormSection>
        )}

        {/* Workflow Steps */}
        {livrable.workflowSteps && livrable.workflowSteps.length > 0 && (
          <FormSection title={t("livrable.workflowSteps")}>
            <div className="space-y-2">
              {livrable.workflowSteps.map((step) => (
                <div key={step.id} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{step.name}</p>
                      <p className="text-sm text-muted-foreground">{step.role}</p>
                    </div>
                    {step.dueDate && (
                      <p className="text-sm text-muted-foreground">
                        {formatLocalized(new Date(step.dueDate), "MMM d, yyyy", locale)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </FormSection>
        )}

        {/* Attachments */}
        {livrable.attachments.length > 0 && (
          <FormSection title={t("form.attachments")}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {livrable.attachments.map((attachment) => (
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
