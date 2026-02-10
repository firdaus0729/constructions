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
import { cn, distanceToNowLocalized, formatDateOnlyLocalized } from "@/lib/utils"
import { exportLivrableAsPdf } from "@/lib/pdf"

const statusVariants = {
  open: "bg-[#27F54D] text-white",
  closed: "bg-[#999999] text-white",
}

// Only "open" (Initié) and "closed" (Fermé) are allowed
const getStatusTranslationKey = (status: string): string => {
  // Normalize status: map "submitted", "draft", "in-progress" to "open" (Initié)
  const normalizedStatus = status === "closed" ? "closed" : "open"
  return normalizedStatus === "closed" ? "status.closed" : "status.initiated"
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

  // Safe date formatting helper - uses formatDateOnlyLocalized to avoid timezone issues
  const safeFormatDate = (dateValue: any, format: string): string => {
    if (!dateValue) return "-"
    try {
      // Use formatDateOnlyLocalized to avoid one-day offset issues
      return formatDateOnlyLocalized(dateValue, format, locale)
    } catch {
      return "-"
    }
  }

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
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#B5B5B5]">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{livrable.number}</span>
              <Badge variant="secondary" className={cn(statusVariants[livrable.status === "closed" ? "closed" : "open"])}>
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

            {livrable.receivedDate && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("livrable.receivedDate")}</p>
                  <p className="font-medium">{safeFormatDate(livrable.receivedDate, "MMMM d, yyyy")}</p>
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
              <p className="font-medium">{safeFormatDate(livrable.submitBy, "MMMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("livrable.issueDate")}</p>
              <p className="font-medium">{safeFormatDate(livrable.issueDate, "MMMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("submittal.receivedDate")}</p>
              <p className="font-medium">{safeFormatDate(livrable.receivedDate, "MMMM d, yyyy")}</p>
            </div>
          </div>
        </FormSection>

        {/* Delivery */}
        <FormSection title={t("livrable.deliveryInfo")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t("submittal.anticipatedDeliveryDate")}</p>
              <p className="font-medium">{safeFormatDate(livrable.anticipatedDeliveryDate, "MMMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("livrable.confirmedDeliveryDate")}</p>
              <p className="font-medium">{safeFormatDate(livrable.confirmedDeliveryDate, "MMMM d, yyyy")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("submittal.actualDeliveryDate")}</p>
              <p className="font-medium">{safeFormatDate(livrable.actualDeliveryDate, "MMMM d, yyyy")}</p>
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
        {livrable.workflowSteps && Array.isArray(livrable.workflowSteps) && livrable.workflowSteps.length > 0 && (
          <FormSection title={t("livrable.workflowSteps")}>
            <div className="space-y-2">
              {livrable.workflowSteps.map((step: any) => (
                <div key={step?.id || Math.random()} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{step?.name || "-"}</p>
                      <p className="text-sm text-muted-foreground">{step?.role || "-"}</p>
                    </div>
                    {step?.dueDate && (
                      <p className="text-sm text-muted-foreground">
                        {safeFormatDate(step.dueDate, "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </FormSection>
        )}

        {/* Attachments */}
        {livrable.attachments && Array.isArray(livrable.attachments) && livrable.attachments.length > 0 && (
          <FormSection title={t("form.attachments")}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {livrable.attachments.map((attachment: any) => (
                <button
                  key={attachment?.id || Math.random()}
                  type="button"
                  onClick={() => attachment?.url && window.open(attachment.url, "_blank")}
                  className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer text-left"
                >
                  <p className="text-sm font-medium truncate">{attachment?.name || "-"}</p>
                  <p className="text-xs text-muted-foreground">
                    {attachment?.size ? `${(attachment.size / 1024).toFixed(1)} KB` : "-"}
                  </p>
                </button>
              ))}
            </div>
          </FormSection>
        )}
      </div>
    </AppShell>
  )
}
