"use client"

import type React from "react"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"

export const dynamic = 'force-dynamic'
export const dynamicParams = true

import { toast } from "sonner"
import { AppShell } from "@/components/app-shell"
import { FormHeader } from "@/components/forms/form-header"
import { FormSection } from "@/components/forms/form-section"
import { FormField } from "@/components/forms/form-field"
import { AttachmentUpload } from "@/components/forms/attachment-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLocale } from "@/lib/locale-context"
import { useAppStore } from "@/lib/store"
import type { Livrable, Attachment, FormStatus, LivrableWorkflowStep } from "@/lib/types"
import { DistributionSelector } from "@/components/forms"
import { sendFormNotificationEmails, collectEmailAddresses } from "@/lib/email-service"
import { X, GripVertical, Mail } from "lucide-react"
import { LivrableCrudCombobox } from "@/components/livrable-crud-combobox"

export default function NewLivrablePage() {
  const router = useRouter()
  const { t } = useLocale()
  const store = useAppStore()
  const { projects = [], currentUser, addLivrable, authUsers = [], userGroups = [], livrableOptionLists } = store || ({} as any)

  // livrableOptionLists are now managed inline inside the dropdowns (CRUD UI)
  
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [sendNotifications, setSendNotifications] = useState(true)
  
  // Form state
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["basic-info"]))
  const [workflowSteps, setWorkflowSteps] = useState<LivrableWorkflowStep[]>([])
  const [newDrawingLink, setNewDrawingLink] = useState("")

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    projectId: "",
    creatorId: currentUser?.id || "",
    status: "draft" as FormStatus,
    
    // Basic Information
    numberValue: "",
    submittalType: "",
    responsibleContractor: "",
    receivedFrom: "",
    submittalManager: "project_manager",
    location: "",
    linkedDrawings: "",
    isPrivate: false,
    
    // Dates
    submitBy: "",
    receivedDate: "",
    issueDate: "",
    
    // Schedule Information
    scheduleTask: "",
    requiredOnSiteDate: "",
    leadTime: 30,
    plannedReturnDate: "",
    designTeamReviewTime: 14,
    plannedInternalReviewCompletedDate: "",
    internalReviewTime: 14,
    plannedSubmitByDate: "",
    
    // Delivery Information
    anticipatedDeliveryDate: "",
    confirmedDeliveryDate: "",
    actualDeliveryDate: "",
    
    // Workflow
    workflowTemplate: "",
    
    // Description
    description: "",
    
    // Attachments
    attachments: [] as Attachment[],
  })

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-generate number based on type: TYPE-000001 format
  const getNextNumberValue = useCallback((type: string) => {
    if (!type) return ""
    const existing = store?.livrables ?? []
    const typePrefix = type.toUpperCase()
    
    // Find all numbers for this type (format: TYPE-000001)
    const typeNumbers = existing
      .map((l) => {
        const numValue = l.numberValue ?? l.number ?? ""
        // Check if number starts with the type prefix
        if (typeof numValue === "string" && numValue.startsWith(typePrefix + "-")) {
          const numPart = numValue.replace(typePrefix + "-", "")
          const n = parseInt(numPart.replace(/\D/g, ""), 10)
          return Number.isNaN(n) ? 0 : n
        }
        return 0
      })
      .filter(n => n > 0)
    
    const max = typeNumbers.length ? Math.max(...typeNumbers, 0) : 0
    const nextNum = max + 1
    return `${typePrefix}-${String(nextNum).padStart(6, "0")}`
  }, [store?.livrables])

  // Auto-generate number when type changes
  useEffect(() => {
    if (formData.submittalType) {
      const generatedNumber = getNextNumberValue(formData.submittalType)
      if (generatedNumber) {
        setFormData((prev) => ({ ...prev, numberValue: generatedNumber }))
      }
    }
  }, [formData.submittalType, getNextNumberValue])

  const formatSortableNumber = useCallback((value: string) => {
    // If value already contains type prefix (e.g., QRT-000001), return as is
    if (value.includes("-")) {
      return value
    }
    // Otherwise, format as before for backward compatibility
    const num = parseInt(String(value).replace(/\D/g, ""), 10)
    if (Number.isNaN(num)) return "000000"
    return String(num).padStart(6, "0")
  }, [])

  // Validation
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = t("alert.required")
    }
    if (!formData.projectId) {
      newErrors.projectId = t("alert.required")
    }
    if (!formData.numberValue.trim()) {
      newErrors.numberValue = t("alert.required")
    }
    if (!formData.submittalManager) {
      newErrors.submittalManager = t("alert.required")
    }
    if (!formData.status) {
      newErrors.status = t("alert.required")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, t])

  // Create livrable object
  const createLivrableObject = useCallback(
    (status: FormStatus): Livrable => {
      const number = formatSortableNumber(formData.numberValue)
      // Distribution is stored as AuthUser IDs (same as other forms)
      const distributionList: string[] = [...selectedUserIds]
      selectedGroupIds.forEach((groupId) => {
        const group = userGroups?.find((g) => g.id === groupId)
        if (group) distributionList.push(...(group.memberIds || []))
      })
      const uniqueDistribution = Array.from(new Set(distributionList))

      return {
        id: `livrable-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        number,
        title: formData.title,
        projectId: formData.projectId,
        creatorId: currentUser?.id || "",
        status,
        distribution: uniqueDistribution,
        attachments: formData.attachments,
        description: formData.description,
        
        // Basic Information
        numberValue: formData.numberValue,
        submittalType: formData.submittalType,
        responsibleContractor: formData.responsibleContractor,
        receivedFrom: formData.receivedFrom,
        submittalManager: formData.submittalManager,
        location: formData.location,
        linkedDrawings: formData.linkedDrawings,
        isPrivate: formData.isPrivate,
        
        // Dates
        submitBy: formData.submitBy ? new Date(formData.submitBy) : null,
        receivedDate: formData.receivedDate ? new Date(formData.receivedDate) : null,
        issueDate: formData.issueDate ? new Date(formData.issueDate) : null,
        
        // Schedule Information
        scheduleTask: formData.scheduleTask,
        requiredOnSiteDate: formData.requiredOnSiteDate ? new Date(formData.requiredOnSiteDate) : null,
        leadTime: formData.leadTime,
        plannedReturnDate: formData.plannedReturnDate ? new Date(formData.plannedReturnDate) : null,
        designTeamReviewTime: formData.designTeamReviewTime,
        plannedInternalReviewCompletedDate: formData.plannedInternalReviewCompletedDate ? new Date(formData.plannedInternalReviewCompletedDate) : null,
        internalReviewTime: formData.internalReviewTime,
        plannedSubmitByDate: formData.plannedSubmitByDate ? new Date(formData.plannedSubmitByDate) : null,
        
        // Delivery Information
        anticipatedDeliveryDate: formData.anticipatedDeliveryDate ? new Date(formData.anticipatedDeliveryDate) : null,
        confirmedDeliveryDate: formData.confirmedDeliveryDate ? new Date(formData.confirmedDeliveryDate) : null,
        actualDeliveryDate: formData.actualDeliveryDate ? new Date(formData.actualDeliveryDate) : null,
        
        // Workflow
        workflowTemplate: formData.workflowTemplate,
        workflowSteps: workflowSteps,
        
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: "pending",
      }
    },
    [formData, currentUser, formatSortableNumber, selectedUserIds, selectedGroupIds, userGroups, authUsers, workflowSteps]
  )

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true)
    try {
      const livrable = createLivrableObject("draft")
      if (typeof addLivrable !== "function") throw new Error("Store not ready")
      addLivrable(livrable)
      toast.success(t("status.savedLocally"))
      await new Promise((r) => setTimeout(r, 0))
      router.replace("/livrables")
    } catch (error) {
      toast.error(t("alert.saveDraft.error"))
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }, [createLivrableObject, addLivrable, router, t])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Validate but allow saving even if validation fails
      const isValid = validateForm()
      if (!isValid) {
        toast.warning(t("alert.fixErrors"))
        // Continue saving anyway - don't return
      }

      setIsSubmitting(true)
      try {
        const livrable = createLivrableObject("submitted")
        if (typeof addLivrable !== "function") throw new Error("Store not ready")
        addLivrable(livrable)

        // Send email notifications if enabled
        if (sendNotifications) {
          const recipientEmails = collectEmailAddresses(
            selectedUserIds,
            selectedGroupIds,
            authUsers,
            userGroups
          )

          if (recipientEmails.length > 0) {
            const project = projects?.find((p) => p.id === formData.projectId)
            
            const emailResult = await sendFormNotificationEmails(
              {
                formType: "livrable",
                formNumber: livrable.number,
                formTitle: livrable.title,
                projectName: project?.name,
                creatorName: currentUser?.name || t("common.unknown"),
                creatorEmail: currentUser?.email || "",
                priority: "medium",
                status: livrable.status,
                description: livrable.description,
                assignedTo: recipientEmails.map((email) => {
                  const user = authUsers.find((u) => u.email === email)
                  return { name: user?.name || email, email }
                }),
              },
              recipientEmails,
              sendNotifications
            )

            if (emailResult.success && emailResult.sent > 0) {
              toast.success(t("toast.livrableCreatedWithEmails" as any, { count: emailResult.sent }))
            } else if (emailResult.failed > 0) {
              toast.warning(t("toast.livrableCreatedEmailsFailed" as any, { count: emailResult.failed }))
            }
          }
        } else {
          toast.success(t("alert.saveSuccess.livrable"))
        }

        await new Promise((r) => setTimeout(r, 0))
        router.replace("/livrables")
      } catch (error) {
        toast.error(t("alert.saveError.livrable"))
        console.error(error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [validateForm, createLivrableObject, addLivrable, router, sendNotifications, selectedUserIds, selectedGroupIds, authUsers, userGroups, projects, currentUser, formData, t]
  )

  const handleFieldChange = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const updated = { ...prev }
          delete updated[field]
          return updated
        })
      }
    },
    [errors]
  )

  const drawingLinks = useMemo(() => {
    const raw = String(formData.linkedDrawings || "").trim()
    if (!raw) return []
    return raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
  }, [formData.linkedDrawings])

  const addDrawingLink = useCallback(() => {
    const raw = newDrawingLink.trim()
    if (!raw) return
    const url = raw.includes("://") ? raw : `https://${raw}`
    try {
      // Accept http(s) URLs only
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

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const updated = new Set(prev)
      if (updated.has(sectionId)) {
        updated.delete(sectionId)
      } else {
        updated.add(sectionId)
      }
      return updated
    })
  }

  const addWorkflowStep = () => {
    const newStep: LivrableWorkflowStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      step: workflowSteps.length + 1,
      name: "",
      role: "",
      dueDate: null,
    }
    setWorkflowSteps([...workflowSteps, newStep])
  }

  const removeWorkflowStep = (id: string) => {
    setWorkflowSteps(workflowSteps.filter((step) => step.id !== id).map((step, index) => ({ ...step, step: index + 1 })))
  }

  const updateWorkflowStep = (id: string, updates: Partial<LivrableWorkflowStep>) => {
    setWorkflowSteps(workflowSteps.map((step) => (step.id === id ? { ...step, ...updates } : step)))
  }

  return (
    <AppShell>
      <FormHeader title={t("livrable.title")} backHref="/livrables" onSaveDraft={handleSaveDraft} isSaving={isSaving} />

      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <FormSection
            title={t("submittal.basicInfo")}
            collapsible={true}
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title - Full Width */}
              <FormField
                label={t("form.title")}
                required
                className="md:col-span-2"
                error={errors.title}
              >
                <Input
                  value={formData.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder={t("livrable.titlePlaceholder")}
                  className={`h-12 ${errors.title ? "border-destructive" : ""}`}
                />
              </FormField>

              {/* Number — auto-generated as TYPE-000001 */}
              <FormField label={`${t("livrable.number")} & ${t("livrable.revision")} *`} required error={errors.numberValue}>
                <Input
                  value={formData.numberValue}
                  onChange={(e) => handleFieldChange("numberValue", e.target.value)}
                  placeholder="QRT-000001"
                  className={`h-12 flex-1 ${errors.numberValue ? "border-destructive" : ""}`}
                  readOnly={!!formData.submittalType}
                />
              </FormField>

              {/* Type de livrable */}
              <FormField label={t("livrable.livrableType")} error={errors.submittalType}>
                <Select value={formData.submittalType} onValueChange={(value) => handleFieldChange("submittalType", value)}>
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
              <FormField label={t("submittal.responsibleContractor")} error={errors.responsibleContractor}>
                <Select value={formData.responsibleContractor} onValueChange={(value) => handleFieldChange("responsibleContractor", value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t("submittal.selectContractor")} />
                  </SelectTrigger>
                  <SelectContent>
                    {authUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {/* Received From */}
              <FormField label={t("livrable.receivedFrom")} error={errors.receivedFrom}>
                <Select value={formData.receivedFrom} onValueChange={(value) => handleFieldChange("receivedFrom", value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t("livrable.selectReceivedFrom")} />
                  </SelectTrigger>
                  <SelectContent>
                    {authUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {/* Gestionnaire de livrable — single option */}
              <FormField label={`${t("livrable.livrableManager")} *`} required error={errors.submittalManager}>
                <Select value={formData.submittalManager} onValueChange={(value) => handleFieldChange("submittalManager", value)}>
                  <SelectTrigger className={`h-12 ${errors.submittalManager ? "border-destructive" : ""}`}>
                    <SelectValue placeholder={t("livrable.selectLivrableManager")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project_manager">{t("livrable.managerOption.projectManager")}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Status */}
              <FormField label={`${t("submittal.status")} *`} required error={errors.status}>
                <Select value={formData.status === "closed" ? "closed" : "open"} onValueChange={(value: any) => handleFieldChange("status", value)}>
                  <SelectTrigger className={`h-12 ${errors.status ? "border-destructive" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">{t("status.initiated" as any)}</SelectItem>
                    <SelectItem value="closed">{t("status.closed")}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Project */}
              <FormField label={t("form.project")} required error={errors.projectId}>
                <Select value={formData.projectId} onValueChange={(value) => {
                  const p = projects?.find((pp: any) => pp.id === value)
                  handleFieldChange("projectId", value)
                  // Always update location when project changes
                  if (p) {
                    handleFieldChange("location", p.location || "")
                  }
                }}>
                  <SelectTrigger className={`h-12 ${errors.projectId ? "border-destructive" : ""}`}>
                    <SelectValue placeholder={t("livrable.selectProject")} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              {/* Creator */}
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
                <Input
                  type="date"
                  value={formData.submitBy}
                  onChange={(e) => handleFieldChange("submitBy", e.target.value)}
                  className="h-12"
                />
              </FormField>

              {/* Received Date */}
              <FormField label={t("submittal.receivedDate")}>
                <Input
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => handleFieldChange("receivedDate", e.target.value)}
                  className="h-12"
                />
              </FormField>

              {/* Issue Date */}
              <FormField label={t("livrable.issueDate")}>
                <Input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => handleFieldChange("issueDate", e.target.value)}
                  className="h-12"
                />
              </FormField>


              {/* Location */}
              <FormField label={t("livrable.location")}>
                <LivrableCrudCombobox
                  listKey="locations"
                  value={formData.location}
                  onChange={(value) => handleFieldChange("location", value)}
                  placeholder={t("livrable.selectLocation")}
                />
              </FormField>

              {/* Linked Drawings */}
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
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary underline break-all flex-1"
                          >
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


              {/* Private Checkbox */}
              <div className="md:col-span-2 flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                <Switch
                  checked={formData.isPrivate}
                  onCheckedChange={(checked) => handleFieldChange("isPrivate", checked)}
                />
                <Label className="cursor-pointer">{t("livrable.isPrivate")}</Label>
                <span className="text-sm text-muted-foreground">{t("livrable.isPrivateDesc")}</span>
              </div>
            </div>
          </FormSection>

          {/* Delivery Information */}
          <FormSection
            title={t("livrable.deliveryInfo")}
            collapsible={true}
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Anticipated Delivery Date */}
              <FormField label={t("submittal.anticipatedDeliveryDate")}>
                <Input
                  type="date"
                  value={formData.anticipatedDeliveryDate}
                  onChange={(e) => handleFieldChange("anticipatedDeliveryDate", e.target.value)}
                  className="h-12"
                />
              </FormField>

              {/* Confirmed Delivery Date */}
              <FormField label={t("livrable.confirmedDeliveryDate")}>
                <Input
                  type="date"
                  value={formData.confirmedDeliveryDate}
                  onChange={(e) => handleFieldChange("confirmedDeliveryDate", e.target.value)}
                  className="h-12"
                />
              </FormField>

              {/* Actual Delivery Date */}
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

          {/* Submittal Workflow */}
          <FormSection
            title={t("livrable.workflow")}
            collapsible={true}
            defaultOpen={false}
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("submittal.workflowDescription")}</p>
              
              {/* Workflow Template */}
              <FormField label={t("submittal.workflowTemplate")}>
                <Select value={formData.workflowTemplate} onValueChange={(value) => handleFieldChange("workflowTemplate", value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t("submittal.selectWorkflowTemplate")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="template1">Template 1</SelectItem>
                    <SelectItem value="template2">Template 2</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Workflow Steps Table */}
              {workflowSteps.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>{t("livrable.step")}</TableHead>
                        <TableHead>{t("livrable.stepName")}</TableHead>
                        <TableHead>{t("livrable.stepRole")}</TableHead>
                        <TableHead>{t("livrable.stepDueDate")}</TableHead>
                        <TableHead className="w-12"></TableHead>
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
                              value={step.dueDate ? new Date(step.dueDate).toISOString().split('T')[0] : ""}
                              onChange={(e) => updateWorkflowStep(step.id, { dueDate: e.target.value ? new Date(e.target.value) : null })}
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeWorkflowStep(step.id)}
                              className="h-9 w-9"
                            >
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

          {/* Description Section */}
          <FormSection
            title={t("form.description")}
            collapsible={true}
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label={t("form.description")}
                className="col-span-1"
              >
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  placeholder={t("livrable.descriptionPlaceholder")}
                  rows={8}
                  className="min-h-50"
                />
              </FormField>
              <div className="col-span-1 flex flex-col gap-2">
                <AttachmentUpload
                  attachments={formData.attachments}
                  onChange={(attachments) => handleFieldChange("attachments", attachments)}
                />
              </div>
            </div>
          </FormSection>

          {/* Distribution - same UX as other forms */}
          <FormSection
            title={t("form.distribution")}
            collapsible={true}
            defaultOpen
          >
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
              <Switch
                id="notify"
                checked={sendNotifications}
                onCheckedChange={setSendNotifications}
              />
              <Label htmlFor="notify" className="cursor-pointer">
                {t("notifyUsers")}
              </Label>
            </div>
          </FormSection>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/livrables")}
              className="flex-1"
            >
              {t("action.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isSaving}
              className="flex-1 bg-primary"
            >
              {isSubmitting ? t("action.saving") : t("action.save")}
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={isSubmitting || isSaving}
              className="flex-1"
              onClick={(e) => {
                e.preventDefault()
                setSendNotifications(true)
                handleSubmit(e)
              }}
            >
              {t("notifyUsers")}
            </Button>
          </div>

          <p className="text-sm text-destructive">{t("form.requiredFields")}</p>
        </form>
      </div>

    </AppShell>
  )
}
