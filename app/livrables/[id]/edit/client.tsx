"use client"

import type React from "react"

import { use, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { FormHeader } from "@/components/forms/form-header"
import { FormSection } from "@/components/forms/form-section"
import { FormField } from "@/components/forms/form-field"
import { AttachmentUpload } from "@/components/forms/attachment-upload"
import { DistributionSelector } from "@/components/forms"
import { LivrableCrudCombobox } from "@/components/livrable-crud-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useLocale } from "@/lib/locale-context"
import { useAppStore } from "@/lib/store"
import type { Attachment, FormStatus, LivrableWorkflowStep } from "@/lib/types"
import { collectEmailAddresses, sendFormNotificationEmails } from "@/lib/email-service"
import { Mail, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const toDateInput = (d: any) => {
  if (!d) return ""
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ""
  return dt.toISOString().slice(0, 10)
}

export default function EditLivrablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t } = useLocale()
  const store = useAppStore()
  const { livrables, updateLivrable, projects = [], currentUser, authUsers = [], userGroups = [] } = store

  const livrable = livrables.find((s) => s.id === id)

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(() => {
    if (!livrable?.distribution) return []
    // distribution is stored as AuthUser IDs
    return livrable.distribution.filter((uid) => authUsers.some((u) => u.id === uid))
  })
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [sendNotifications, setSendNotifications] = useState(true)

  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [workflowSteps, setWorkflowSteps] = useState<LivrableWorkflowStep[]>(() => livrable?.workflowSteps || [])
  const [newDrawingLink, setNewDrawingLink] = useState("")

  const [formData, setFormData] = useState(() => ({
    title: livrable?.title || "",
    projectId: livrable?.projectId || "",
    creatorId: livrable?.creatorId || currentUser?.id || "",
    status: (livrable?.status || "draft") as FormStatus,

    specSection: livrable?.specSection || "",
    numberValue: livrable?.numberValue || "1",
    revision: livrable?.revision || "0",
    submittalType: livrable?.submittalType || "",
    submittalPackage: livrable?.submittalPackage || "",
    responsibleContractor: livrable?.responsibleContractor || "",
    receivedFrom: livrable?.receivedFrom || "",
    submittalManager: livrable?.submittalManager || "",
    costCode: livrable?.costCode || "",
    location: livrable?.location || "",
    linkedDrawings: livrable?.linkedDrawings || "",
    ballInCourt: livrable?.ballInCourt || "",
    isPrivate: Boolean(livrable?.isPrivate),

    submitBy: toDateInput(livrable?.submitBy),
    receivedDate: toDateInput(livrable?.receivedDate),
    issueDate: toDateInput(livrable?.issueDate),
    finalDueDate: toDateInput(livrable?.finalDueDate),

    scheduleTask: livrable?.scheduleTask || "",
    requiredOnSiteDate: toDateInput(livrable?.requiredOnSiteDate),
    leadTime: livrable?.leadTime ?? 30,
    plannedReturnDate: toDateInput(livrable?.plannedReturnDate),
    designTeamReviewTime: livrable?.designTeamReviewTime ?? 14,
    plannedInternalReviewCompletedDate: toDateInput(livrable?.plannedInternalReviewCompletedDate),
    internalReviewTime: livrable?.internalReviewTime ?? 14,
    plannedSubmitByDate: toDateInput(livrable?.plannedSubmitByDate),

    anticipatedDeliveryDate: toDateInput(livrable?.anticipatedDeliveryDate),
    confirmedDeliveryDate: toDateInput(livrable?.confirmedDeliveryDate),
    actualDeliveryDate: toDateInput(livrable?.actualDeliveryDate),

    workflowTemplate: livrable?.workflowTemplate || "",
    description: livrable?.description || "",
    attachments: (livrable?.attachments || []) as Attachment[],
  }))

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleFieldChange = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next[field]
          return next
        })
      }
    },
    [errors]
  )

  const drawingLinks = useMemo(() => {
    const raw = String(formData.linkedDrawings || "").trim()
    if (!raw) return []
    return raw.split("\n").map((s) => s.trim()).filter(Boolean)
  }, [formData.linkedDrawings])

  const addDrawingLink = useCallback(() => {
    const url = newDrawingLink.trim()
    if (!url) return
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return
    } catch {
      return
    }
    setFormData((prev) => {
      const existing = String(prev.linkedDrawings || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
      if (existing.includes(url)) return prev
      return { ...prev, linkedDrawings: [...existing, url].join("\n") }
    })
    setNewDrawingLink("")
  }, [newDrawingLink])

  const removeDrawingLink = useCallback((url: string) => {
    setFormData((prev) => {
      const next = String(prev.linkedDrawings || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((u) => u !== url)
      return { ...prev, linkedDrawings: next.join("\n") }
    })
  }, [])

  if (!livrable) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">{t("empty.notFound.livrable")}</p>
        </div>
      </AppShell>
    )
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!formData.title.trim()) next.title = t("alert.required")
    if (!formData.projectId) next.projectId = t("alert.required")
    if (!formData.numberValue.trim()) next.numberValue = t("alert.required")
    if (!formData.revision.trim()) next.revision = t("alert.required")
    if (!formData.submittalManager) next.submittalManager = t("alert.required")
    if (!formData.status) next.status = t("alert.required")
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const buildDistribution = () => {
    const dist: string[] = [...selectedUserIds]
    selectedGroupIds.forEach((gid) => {
      const g = userGroups.find((gg) => gg.id === gid)
      if (g) dist.push(...(g.memberIds || []))
    })
    return Array.from(new Set(dist))
  }

  const onSave = async (status: FormStatus) => {
    if (!validate()) {
      toast.error(t("alert.fixErrors"))
      return
    }
    setIsSaving(true)
    try {
      const updated = {
        title: formData.title,
        projectId: formData.projectId,
        status,
        distribution: buildDistribution(),
        description: formData.description,
        attachments: formData.attachments,

        specSection: formData.specSection,
        numberValue: formData.numberValue,
        revision: formData.revision,
        submittalType: formData.submittalType,
        submittalPackage: formData.submittalPackage,
        responsibleContractor: formData.responsibleContractor,
        receivedFrom: formData.receivedFrom,
        submittalManager: formData.submittalManager,
        costCode: formData.costCode,
        location: formData.location,
        linkedDrawings: formData.linkedDrawings,
        ballInCourt: formData.ballInCourt,
        isPrivate: formData.isPrivate,

        submitBy: formData.submitBy ? new Date(formData.submitBy) : null,
        receivedDate: formData.receivedDate ? new Date(formData.receivedDate) : null,
        issueDate: formData.issueDate ? new Date(formData.issueDate) : null,
        finalDueDate: formData.finalDueDate ? new Date(formData.finalDueDate) : null,

        scheduleTask: formData.scheduleTask,
        requiredOnSiteDate: formData.requiredOnSiteDate ? new Date(formData.requiredOnSiteDate) : null,
        leadTime: formData.leadTime,
        plannedReturnDate: formData.plannedReturnDate ? new Date(formData.plannedReturnDate) : null,
        designTeamReviewTime: formData.designTeamReviewTime,
        plannedInternalReviewCompletedDate: formData.plannedInternalReviewCompletedDate
          ? new Date(formData.plannedInternalReviewCompletedDate)
          : null,
        internalReviewTime: formData.internalReviewTime,
        plannedSubmitByDate: formData.plannedSubmitByDate ? new Date(formData.plannedSubmitByDate) : null,

        anticipatedDeliveryDate: formData.anticipatedDeliveryDate ? new Date(formData.anticipatedDeliveryDate) : null,
        confirmedDeliveryDate: formData.confirmedDeliveryDate ? new Date(formData.confirmedDeliveryDate) : null,
        actualDeliveryDate: formData.actualDeliveryDate ? new Date(formData.actualDeliveryDate) : null,

        workflowTemplate: formData.workflowTemplate,
        workflowSteps,
        syncStatus: "pending" as const,
      }

      updateLivrable(id, updated as any)

      // optional email notifications on submit
      if (status === "submitted" && sendNotifications) {
        const recipientEmails = collectEmailAddresses(selectedUserIds, selectedGroupIds, authUsers, userGroups)
        if (recipientEmails.length > 0) {
          const project = projects.find((p) => p.id === formData.projectId)
          await sendFormNotificationEmails(
            {
              formType: "livrable",
              formNumber: livrable.number,
              formTitle: formData.title,
              projectName: project?.name,
              creatorName: currentUser?.name || "Unknown",
              creatorEmail: (currentUser as any)?.email || "",
              priority: "medium",
              status,
              description: formData.description,
              assignedTo: recipientEmails.map((email) => ({ name: email, email })),
            } as any,
            recipientEmails,
            true
          )
        }
      }

      toast.success(t("alert.saveSuccess.livrable"))
      router.push(`/livrables/${id}`)
    } catch (e) {
      console.error(e)
      toast.error(t("alert.saveError.livrable"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppShell>
      <FormHeader
        title={t("form.edit")}
        backHref={`/livrables/${id}`}
        onSaveDraft={() => onSave("draft")}
        isSaving={isSaving}
      />

      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setIsSubmitting(true)
            onSave("submitted").finally(() => setIsSubmitting(false))
          }}
          className="space-y-6"
        >
          <FormSection title={t("livrable.basicInfo")} defaultOpen>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={t("form.title")} required className="md:col-span-2" error={errors.title}>
                <Input value={formData.title} onChange={(e) => handleFieldChange("title", e.target.value)} className="h-12" />
              </FormField>

              <FormField label={t("form.project")} required error={errors.projectId}>
                <Select value={formData.projectId} onValueChange={(v) => handleFieldChange("projectId", v)}>
                  <SelectTrigger className={`h-12 ${errors.projectId ? "border-destructive" : ""}`}>
                    <SelectValue placeholder={t("incident.selectProject")} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label={`${t("submittal.status")} *`} required error={errors.status}>
                <Select value={formData.status} onValueChange={(v: any) => handleFieldChange("status", v)}>
                  <SelectTrigger className={`h-12 ${errors.status ? "border-destructive" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t("status.draft")}</SelectItem>
                    <SelectItem value="in-progress">{t("status.inProgress")}</SelectItem>
                    <SelectItem value="submitted">{t("status.submitted")}</SelectItem>
                    <SelectItem value="open">{t("status.open")}</SelectItem>
                    <SelectItem value="closed">{t("status.closed")}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label={t("livrable.livrableType")}>
                <LivrableCrudCombobox
                  listKey="types"
                  value={formData.submittalType}
                  onChange={(v) => handleFieldChange("submittalType", v)}
                  placeholder={t("livrable.selectLivrableType")}
                />
              </FormField>

              <FormField label={t("livrable.livrablePackage")}>
                <LivrableCrudCombobox
                  listKey="packages"
                  value={formData.submittalPackage}
                  onChange={(v) => handleFieldChange("submittalPackage", v)}
                  placeholder={t("livrable.selectLivrablePackage")}
                />
              </FormField>

              <FormField label={t("livrable.costCode")}>
                <LivrableCrudCombobox
                  listKey="costCodes"
                  value={formData.costCode}
                  onChange={(v) => handleFieldChange("costCode", v)}
                  placeholder={t("livrable.selectCostCode")}
                />
              </FormField>

              <FormField label={t("livrable.location")}>
                <LivrableCrudCombobox
                  listKey="locations"
                  value={formData.location}
                  onChange={(v) => handleFieldChange("location", v)}
                  placeholder={t("livrable.selectLocation")}
                />
              </FormField>

              <FormField label={t("livrable.linkedDrawings")}>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newDrawingLink}
                      onChange={(e) => setNewDrawingLink(e.target.value)}
                      placeholder={t("livrable.linkedDrawingsUrlPlaceholder")}
                      className="h-12"
                    />
                    <Button type="button" variant="outline" className="h-12 shrink-0" onClick={addDrawingLink}>
                      {t("livrable.linkedDrawingsAddLink")}
                    </Button>
                  </div>
                  {drawingLinks.length > 0 ? (
                    <div className="space-y-2">
                      {drawingLinks.map((url) => (
                        <div key={url} className="flex items-center gap-2 rounded-lg border p-3 bg-muted/30">
                          <a href={url} target="_blank" rel="noreferrer" className="text-sm text-primary underline break-all flex-1">
                            {url}
                          </a>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeDrawingLink(url)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("livrable.linkedDrawingsHelp")}</p>
                  )}
                </div>
              </FormField>

              <div className="md:col-span-2">
                <FormField label={t("form.description")}>
                  <Textarea value={formData.description} onChange={(e) => handleFieldChange("description", e.target.value)} rows={6} />
                </FormField>
              </div>

              <div className="md:col-span-2">
                <AttachmentUpload attachments={formData.attachments} onChange={(atts) => handleFieldChange("attachments", atts)} />
              </div>

              <div className="md:col-span-2 flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                <Switch checked={formData.isPrivate} onCheckedChange={(checked) => handleFieldChange("isPrivate", checked)} />
                <Label className="cursor-pointer">{t("livrable.isPrivate")}</Label>
                <span className="text-sm text-muted-foreground">{t("livrable.isPrivateDesc")}</span>
              </div>
            </div>
          </FormSection>

          <FormSection title={t("form.distribution")} defaultOpen>
            <Alert className="mb-4">
              <Mail className="h-4 w-4" />
              <AlertDescription>{t("sendEmailNotifications")}</AlertDescription>
            </Alert>
            <DistributionSelector
              selectedUserIds={selectedUserIds}
              selectedGroupIds={selectedGroupIds}
              onUsersChange={setSelectedUserIds}
              onGroupsChange={setSelectedGroupIds}
            />
            <div className="flex items-center space-x-2 mt-4 p-4 bg-muted/50 rounded-lg">
              <Switch id="notify" checked={sendNotifications} onCheckedChange={setSendNotifications} />
              <Label htmlFor="notify" className="cursor-pointer">
                {t("notifyUsers")}
              </Label>
            </div>
          </FormSection>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? t("action.saving") : t("form.submit")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t("form.cancel")}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
