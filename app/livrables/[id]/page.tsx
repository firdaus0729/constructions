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

const statusVariants = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary/10 text-primary",
  open: "bg-warning/10 text-warning-foreground",
  closed: "bg-accent/10 text-accent",
  "in-progress": "bg-info/10 text-info",
}

export default function LivrableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t, locale } = useLocale()
  const { livrables, projects, users } = useAppStore()

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

  return (
    <AppShell>
      <FormHeader
        title={livrable.title || livrable.number}
        backHref="/livrables"
        onEdit={() => router.push(`/livrables/${id}/edit`)}
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
                {t(`status.${livrable.status}` as any)}
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
                  <p className="font-medium">{formatLocalized(new Date(livrable.receivedDate), "MMMM d, yyyy", locale)}</p>
                </div>
              </div>
            )}
          </div>
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
