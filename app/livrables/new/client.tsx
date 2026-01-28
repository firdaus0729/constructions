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

export default function NewLivrablePage() {
  const router = useRouter()
  const { t } = useLocale()
  const store = useAppStore()
  const { projects = [], currentUser, addLivrable, authUsers = [], userGroups = [] } = store || {}
  
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [sendNotifications, setSendNotifications] = useState(true)
  
  // Form state
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["basic-info"]))
  const [workflowSteps, setWorkflowSteps] = useState<LivrableWorkflowStep[]>([])

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    projectId: "",
    creatorId: currentUser?.id || "",
    status: "draft" as FormStatus,
    
    // Basic Information
    specSection: "",
    numberValue: "1",
    revision: "0",
    submittalType: "",
    submittalPackage: "",
    responsibleContractor: "",
    receivedFrom: "",
    submittalManager: "",
    costCode: "",
    location: "",
    linkedDrawings: "",
    ballInCourt: "",
    isPrivate: false,
    
    // Dates
    submitBy: "",
    receivedDate: "",
    issueDate: "",
    finalDueDate: "",
    
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

  // Generate submittal number
  const generateSubmittalNumber = useCallback(() => {
    const timestamp = Date.now().toString(36).toUpperCase()
    return `SUB-${timestamp.slice(-6)}`
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
    if (!formData.revision.trim()) {
      newErrors.revision = t("alert.required")
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
      const number = generateSubmittalNumber()
      const distributionList: string[] = []
      
      selectedUserIds.forEach((userId) => {
        const user = authUsers?.find((u) => u.id === userId)
        if (user) {
          distributionList.push(user.email)
        }
      })
      selectedGroupIds.forEach((groupId) => {
        const group = userGroups?.find((g) => g.id === groupId)
        if (group) {
          group.memberIds?.forEach((memberId) => {
            const user = authUsers?.find((u) => u.id === memberId)
            if (user) {
              distributionList.push(user.email)
            }
          })
        }
      })

      return {
        id: `livrable-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        number,
        title: formData.title,
        projectId: formData.projectId,
        creatorId: currentUser?.id || "",
        status,
        distribution: [...new Set(distributionList)],
        attachments: formData.attachments,
        description: formData.description,
        
        // Basic Information
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
        
        // Dates
        submitBy: formData.submitBy ? new Date(formData.submitBy) : null,
        receivedDate: formData.receivedDate ? new Date(formData.receivedDate) : null,
        issueDate: formData.issueDate ? new Date(formData.issueDate) : null,
        finalDueDate: formData.finalDueDate ? new Date(formData.finalDueDate) : null,
        
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
    [formData, currentUser, generateSubmittalNumber, selectedUserIds, selectedGroupIds, userGroups, authUsers, workflowSteps]
  )

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true)
    try {
      const livrable = createLivrableObject("draft")
      addLivrable(livrable)
      toast.success(t("status.savedLocally"))
      router.push("/livrables")
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

      if (!validateForm()) {
        toast.error(t("alert.fixErrors"))
        return
      }

      setIsSubmitting(true)
      try {
        const livrable = createLivrableObject("submitted")
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
                creatorName: currentUser?.name || "Unknown",
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
              toast.success(`Livrable créé et ${emailResult.sent} email(s) envoyé(s)`)
            } else if (emailResult.failed > 0) {
              toast.warning(`Livrable créé mais ${emailResult.failed} email(s) ont échoué`)
            }
          }
        } else {
          toast.success(t("alert.saveSuccess.livrable"))
        }

        router.push("/livrables")
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

              {/* Spec Section */}
              <FormField label={t("submittal.specSection")} error={errors.specSection}>
                <Select value={formData.specSection} onValueChange={(value) => handleFieldChange("specSection", value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t("submittal.selectSpecSection")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="section1">Section 1</SelectItem>
                    <SelectItem value="section2">Section 2</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Number & Revision */}
              <FormField label={`${t("livrable.number")} & ${t("livrable.revision")} *`} required error={errors.numberValue || errors.revision}>
                <div className="flex gap-2">
                  <Input
                    value={formData.numberValue}
                    onChange={(e) => handleFieldChange("numberValue", e.target.value)}
                    placeholder="1"
                    className={`h-12 flex-1 ${errors.numberValue ? "border-destructive" : ""}`}
                  />
                  <Input
                    value={formData.revision}
                    onChange={(e) => handleFieldChange("revision", e.target.value)}
                    placeholder="0"
                    className={`h-12 w-24 ${errors.revision ? "border-destructive" : ""}`}
                  />
                </div>
              </FormField>

              {/* Submittal Type */}
              <FormField label={t("submittal.submittalType")} error={errors.submittalType}>
                <Select value={formData.submittalType} onValueChange={(value) => handleFieldChange("submittalType", value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t("submittal.selectSubmittalType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Product Data</SelectItem>
                    <SelectItem value="sample">Sample</SelectItem>
                    <SelectItem value="shop-drawing">Shop Drawing</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Submittal Package */}
              <FormField label={t("livrable.livrablePackage")} error={errors.submittalPackage}>
                <Select value={formData.submittalPackage} onValueChange={(value) => handleFieldChange("submittalPackage", value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t("livrable.selectLivrablePackage")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="package1">Package 1</SelectItem>
                    <SelectItem value="package2">Package 2</SelectItem>
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

              {/* Submittal Manager */}
              <FormField label={`${t("livrable.livrableManager")} *`} required error={errors.submittalManager}>
                <Select value={formData.submittalManager} onValueChange={(value) => handleFieldChange("submittalManager", value)}>
                  <SelectTrigger className={`h-12 ${errors.submittalManager ? "border-destructive" : ""}`}>
                    <SelectValue placeholder={t("livrable.selectLivrableManager")} />
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

              {/* Status */}
              <FormField label={`${t("submittal.status")} *`} required error={errors.status}>
                <Select value={formData.status} onValueChange={(value: any) => handleFieldChange("status", value)}>
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

              {/* Project */}
              <FormField label={t("form.project")} required error={errors.projectId}>
                <Select value={formData.projectId} onValueChange={(value) => handleFieldChange("projectId", value)}>
                  <SelectTrigger className={`h-12 ${errors.projectId ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Select project" />
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
                <Input
                  value={currentUser?.name || ""}
                  disabled
                  className="h-12 bg-muted"
                />
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

              {/* Final Due Date */}
              <FormField label={t("submittal.finalDueDate")}>
                <Input
                  type="date"
                  value={formData.finalDueDate}
                  onChange={(e) => handleFieldChange("finalDueDate", e.target.value)}
                  className="h-12"
                />
              </FormField>

              {/* Cost Code */}
              <FormField label={t("livrable.costCode")}>
                <Select value={formData.costCode} onValueChange={(value) => handleFieldChange("costCode", value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t("livrable.selectCostCode")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code1">Code 1</SelectItem>
                    <SelectItem value="code2">Code 2</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Location */}
              <FormField label={t("submittal.location")}>
                <Select value={formData.location} onValueChange={(value) => handleFieldChange("location", value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t("submittal.selectLocation")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="location1">Location 1</SelectItem>
                    <SelectItem value="location2">Location 2</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Linked Drawings */}
              <FormField label={t("livrable.linkedDrawings")}>
                <Input
                  value={formData.linkedDrawings}
                  onChange={(e) => handleFieldChange("linkedDrawings", e.target.value)}
                  placeholder="--"
                  className="h-12"
                />
              </FormField>

              {/* Ball In Court */}
              <FormField label={t("livrable.ballInCourt")} className="md:col-span-2">
                <Input
                  value={formData.ballInCourt}
                  onChange={(e) => handleFieldChange("ballInCourt", e.target.value)}
                  placeholder="--"
                  className="h-12"
                />
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

          {/* Submittal Schedule Information */}
          <FormSection
            title={t("submittal.scheduleInfo")}
            collapsible={true}
            defaultOpen={false}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Schedule Task - Full Width */}
              <FormField label={t("livrable.scheduleTask")} className="md:col-span-2">
                <Select value={formData.scheduleTask} onValueChange={(value) => handleFieldChange("scheduleTask", value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t("livrable.selectScheduleTask")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task1">Task 1</SelectItem>
                    <SelectItem value="task2">Task 2</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Required On-Site Date */}
              <FormField label={t("submittal.requiredOnSiteDate")}>
                <Input
                  type="date"
                  value={formData.requiredOnSiteDate}
                  onChange={(e) => handleFieldChange("requiredOnSiteDate", e.target.value)}
                  className="h-12"
                />
              </FormField>

              {/* Lead Time */}
              <FormField label={t("livrable.leadTime")}>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={formData.leadTime}
                    onChange={(e) => handleFieldChange("leadTime", Number.parseInt(e.target.value) || 0)}
                    className="h-12"
                  />
                  <span className="text-sm text-muted-foreground">{t("livrable.leadTimeDays")}</span>
                </div>
              </FormField>

              {/* Planned Return Date */}
              <FormField label={t("submittal.plannedReturnDate")}>
                <Input
                  type="date"
                  value={formData.plannedReturnDate}
                  onChange={(e) => handleFieldChange("plannedReturnDate", e.target.value)}
                  className="h-12"
                />
              </FormField>

              {/* Design Team Review Time */}
              <FormField label={t("livrable.designTeamReviewTime")}>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={formData.designTeamReviewTime}
                    onChange={(e) => handleFieldChange("designTeamReviewTime", Number.parseInt(e.target.value) || 0)}
                    className="h-12"
                  />
                  <span className="text-sm text-muted-foreground">{t("livrable.designTeamReviewTimeDays")}</span>
                </div>
              </FormField>

              {/* Planned Internal Review Completed Date */}
              <FormField label={t("submittal.plannedInternalReviewCompletedDate")}>
                <Input
                  type="date"
                  value={formData.plannedInternalReviewCompletedDate}
                  onChange={(e) => handleFieldChange("plannedInternalReviewCompletedDate", e.target.value)}
                  className="h-12"
                />
              </FormField>

              {/* Internal Review Time */}
              <FormField label={t("livrable.internalReviewTime")}>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={formData.internalReviewTime}
                    onChange={(e) => handleFieldChange("internalReviewTime", Number.parseInt(e.target.value) || 0)}
                    className="h-12"
                  />
                  <span className="text-sm text-muted-foreground">{t("livrable.internalReviewTimeDays")}</span>
                </div>
              </FormField>

              {/* Planned Submit By Date */}
              <FormField label={t("submittal.plannedSubmitByDate")}>
                <Input
                  type="date"
                  value={formData.plannedSubmitByDate}
                  onChange={(e) => handleFieldChange("plannedSubmitByDate", e.target.value)}
                  className="h-12"
                />
              </FormField>
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
                              placeholder="Name"
                              className="h-9"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={step.role}
                              onChange={(e) => updateWorkflowStep(step.id, { role: e.target.value })}
                              placeholder="Role"
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
                  placeholder="Enter description"
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

          <p className="text-sm text-destructive">*required fields</p>
        </form>
      </div>
    </AppShell>
  )
}
