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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLocale } from "@/lib/locale-context"
import { useAppStore } from "@/lib/store"
import type { Attachment, FormStatus, LivrableWorkflowStep } from "@/lib/types"
import { collectEmailAddresses, sendFormNotificationEmails } from "@/lib/email-service"
import { GripVertical, Mail, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toDateOnlyString } from "@/lib/utils"

const toDateInput = (d: any) => {
  if (!d) return ""
  return toDateOnlyString(d)
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
    // distribution may be stored as AuthUser IDs (preferred) or legacy emails
    return livrable.distribution
      .map((v) => {
        if (!v) return null
        if (v.includes("@")) return authUsers.find((u) => u.email === v)?.id || null
        return authUsers.some((u) => u.id === v) ? v : null
      })
      .filter(Boolean) as string[]
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
    status: (livrable?.status === "closed" ? "closed" : "open") as FormStatus,

    numberValue: livrable?.numberValue || "1",
    submittalType: livrable?.submittalType || "",
    responsibleContractor: livrable?.responsibleContractor || "",
    receivedFrom: livrable?.receivedFrom || "",
    submittalManager: livrable?.submittalManager || "",
    location: livrable?.location || "",
    linkedDrawings: livrable?.linkedDrawings || "",
    isPrivate: Boolean(livrable?.isPrivate),

    submitBy: toDateInput(livrable?.submitBy),
    receivedDate: toDateInput(livrable?.receivedDate),
    issueDate: toDateInput(livrable?.issueDate),

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

  const addWorkflowStep = () => {
    const newStep: LivrableWorkflowStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      step: workflowSteps.length + 1,
      name: "",
      role: "",
      dueDate: null,
    }
    setWorkflowSteps((prev) => [...prev, newStep])
  }

  const removeWorkflowStep = (stepId: string) => {
    setWorkflowSteps((prev) =>
      prev.filter((s) => s.id !== stepId).map((s, idx) => ({ ...s, step: idx + 1 })),
    )
  }

  const updateWorkflowStep = (stepId: string, updates: Partial<LivrableWorkflowStep>) => {
    setWorkflowSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s)))
  }

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
    const raw = newDrawingLink.trim()
    if (!raw) return
    const url = raw.includes("://") ? raw : `https://${raw}`
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
    // Validate but allow saving even if validation fails
    const isValid = validate()
    if (!isValid) {
      toast.warning(t("alert.fixErrors"))
      // Continue saving anyway - don't return
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

        numberValue: formData.numberValue,
        submittalType: formData.submittalType,
        responsibleContractor: formData.responsibleContractor,
        receivedFrom: formData.receivedFrom,
        submittalManager: formData.submittalManager,
        location: formData.location,
        linkedDrawings: formData.linkedDrawings,
        isPrivate: formData.isPrivate,

        submitBy: formData.submitBy ? new Date(formData.submitBy) : null,
        receivedDate: formData.receivedDate ? new Date(formData.receivedDate) : null,
        issueDate: formData.issueDate ? new Date(formData.issueDate) : null,

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
              creatorName: currentUser?.name || t("common.unknown"),
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
        onSaveDraft={() => onSave(formData.status)}
        saveDraftLabel={t("action.save")}
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

              {/* Number & Revision */}
              <FormField
                label={`${t("livrable.number")} & ${t("livrable.revision")} *`}
                required
                error={errors.numberValue}
              >
                <Input
                  value={formData.numberValue}
                  onChange={(e) => handleFieldChange("numberValue", e.target.value)}
                  className={`h-12 flex-1 ${errors.numberValue ? "border-destructive" : ""}`}
                />
              </FormField>

              <FormField label={t("form.project")} required error={errors.projectId}>
                <Select value={formData.projectId} onValueChange={(v) => {
                  const p = projects.find((pp: any) => pp.id === v)
                  handleFieldChange("projectId", v)
                  // Always update location when project changes
                  if (p) {
                    handleFieldChange("location", p.location || "")
                  }
                }}>
                  <SelectTrigger className={`h-12 ${errors.projectId ? "border-destructive" : ""}`}>
                    <SelectValue placeholder={t("livrable.selectProject")} />
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
                <Select value={formData.status === "closed" ? "closed" : "open"} onValueChange={(v: any) => handleFieldChange("status", v)}>
                  <SelectTrigger className={`h-12 ${errors.status ? "border-destructive" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">{t("status.initiated" as any)}</SelectItem>
                    <SelectItem value="closed">{t("status.closed")}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label={t("livrable.livrableType")}>
                <Select value={formData.submittalType} onValueChange={(v) => handleFieldChange("submittalType", v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t("livrable.selectLivrableType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QRT">QRT</SelectItem>
                    <SelectItem value="DMT">DMT</SelectItem>
                    <SelectItem value="PRO">PRO</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Responsible Contractor */}
              <FormField label={t("submittal.responsibleContractor")}>
                <Select value={formData.responsibleContractor} onValueChange={(v) => handleFieldChange("responsibleContractor", v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t("submittal.selectContractor")} />
                  </SelectTrigger>
                  <SelectContent>
                    {authUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {/* Received From */}
              <FormField label={t("livrable.receivedFrom")}>
                <Select value={formData.receivedFrom} onValueChange={(v) => handleFieldChange("receivedFrom", v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t("livrable.selectReceivedFrom")} />
                  </SelectTrigger>
                  <SelectContent>
                    {authUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {/* Gestionnaire de livrable — single option */}
              <FormField label={`${t("livrable.livrableManager")} *`} required error={errors.submittalManager}>
                <Select value={formData.submittalManager} onValueChange={(v) => handleFieldChange("submittalManager", v)}>
                  <SelectTrigger className={`h-12 ${errors.submittalManager ? "border-destructive" : ""}`}>
                    <SelectValue placeholder={t("livrable.selectLivrableManager")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project_manager">{t("livrable.managerOption.projectManager")}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Created By */}
              <FormField label={t("form.createdBy")}>
                <Select
                  value={formData.creatorId || ""}
                  onValueChange={(value) => handleFieldChange("creatorId", value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t("form.createdBy")} />
                  </SelectTrigger>
                  <SelectContent>
                    {authUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {/* Submit By */}
              <FormField label={t("livrable.submitBy")}>
                <Input type="date" value={formData.submitBy} onChange={(e) => handleFieldChange("submitBy", e.target.value)} className="h-12" />
              </FormField>

              {/* Received Date */}
              <FormField label={t("submittal.receivedDate")}>
                <Input type="date" value={formData.receivedDate} onChange={(e) => handleFieldChange("receivedDate", e.target.value)} className="h-12" />
              </FormField>

              {/* Issue Date */}
              <FormField label={t("livrable.issueDate")}>
                <Input type="date" value={formData.issueDate} onChange={(e) => handleFieldChange("issueDate", e.target.value)} className="h-12" />
              </FormField>


              <FormField label={t("livrable.location")}>
                <LivrableCrudCombobox
                  key={formData.projectId}
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


              <div className="md:col-span-2 flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                <Switch checked={formData.isPrivate} onCheckedChange={(checked) => handleFieldChange("isPrivate", checked)} />
                <Label className="cursor-pointer">{t("livrable.isPrivate")}</Label>
                <span className="text-sm text-muted-foreground">{t("livrable.isPrivateDesc")}</span>
              </div>
            </div>
          </FormSection>


          {/* Delivery Information */}
          <FormSection title={t("livrable.deliveryInfo")} collapsible={true} defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={t("submittal.anticipatedDeliveryDate")}>
                <Input
                  type="date"
                  value={formData.anticipatedDeliveryDate}
                  onChange={(e) => handleFieldChange("anticipatedDeliveryDate", e.target.value)}
                  className="h-12"
                />
              </FormField>
              <FormField label={t("livrable.confirmedDeliveryDate")}>
                <Input
                  type="date"
                  value={formData.confirmedDeliveryDate}
                  onChange={(e) => handleFieldChange("confirmedDeliveryDate", e.target.value)}
                  className="h-12"
                />
              </FormField>
              <FormField label={t("submittal.actualDeliveryDate")}>
                <Input
                  type="date"
                  value={formData.actualDeliveryDate}
                  onChange={(e) => handleFieldChange("actualDeliveryDate", e.target.value)}
                  className="h-12"
                />
              </FormField>
            </div>
          </FormSection>

          {/* Workflow */}
          <FormSection title={t("livrable.workflow")} collapsible={true} defaultOpen={false}>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("submittal.workflowDescription")}</p>

              <FormField label={t("submittal.workflowTemplate")}>
                <Select value={formData.workflowTemplate} onValueChange={(v) => handleFieldChange("workflowTemplate", v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t("submittal.selectWorkflowTemplate")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="template1">Template 1</SelectItem>
                    <SelectItem value="template2">Template 2</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {workflowSteps.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12" />
                        <TableHead>{t("livrable.step")}</TableHead>
                        <TableHead>{t("livrable.stepName")}</TableHead>
                        <TableHead>{t("livrable.stepRole")}</TableHead>
                        <TableHead>{t("livrable.stepDueDate")}</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workflowSteps.map((step) => (
                        <TableRow key={step.id}>
                          <TableCell>
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          </TableCell>
                          <TableCell>{step.step}</TableCell>
                          <TableCell>
                            <Input
                              value={step.name}
                              onChange={(e) => updateWorkflowStep(step.id, { name: e.target.value })}
                              placeholder={t("livrable.stepName")}
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={step.role}
                              onChange={(e) => updateWorkflowStep(step.id, { role: e.target.value })}
                              placeholder={t("livrable.stepRole")}
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={step.dueDate ? new Date(step.dueDate).toISOString().split("T")[0] : ""}
                              onChange={(e) =>
                                updateWorkflowStep(step.id, { dueDate: e.target.value ? new Date(e.target.value) : null })
                              }
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeWorkflowStep(step.id)} className="h-9 w-9">
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Button type="button" variant="outline" onClick={addWorkflowStep} className="w-full">
                {t("submittal.addStep")}
              </Button>
            </div>
          </FormSection>

          {/* Description + Attachments */}
          <FormSection title={t("form.description")} collapsible={true} defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label={t("form.description")} className="col-span-1">
                <Textarea value={formData.description} onChange={(e) => handleFieldChange("description", e.target.value)} rows={8} className="min-h-50" />
              </FormField>
              <div className="col-span-1 flex flex-col gap-2">
                <AttachmentUpload attachments={formData.attachments} onChange={(atts) => handleFieldChange("attachments", atts)} />
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
