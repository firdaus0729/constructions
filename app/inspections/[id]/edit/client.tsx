"use client"

import type React from "react"
import { useState, useCallback, useEffect, useMemo } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
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
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, Check, X, Mail, Save } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { useAppStore, inspectionSections } from "@/lib/store"
import type { Inspection, InspectionItemResponse, Attachment } from "@/lib/types"
import { DistributionSelector } from "@/components/forms"
import { ProjectNoCombobox } from "@/components/project-no-combobox"
import { InspectionTypeCrudCombobox } from "@/components/inspection-type-crud-combobox"
import { LivrableCrudCombobox } from "@/components/livrable-crud-combobox"
import { sendFormNotificationEmails, collectEmailAddresses } from "@/lib/email-service"

export default function EditInspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t } = useLocale()
  const store = useAppStore()
  const { projects = [], currentUser, updateInspection, inspections, authUsers = [], userGroups = [], users = [], livrableOptionLists } = store || {}
  
  const inspection = inspections?.find((i) => i.id === id)

  // Helper function to clean description value (remove translation keys)
  const cleanDescription = (desc: string | undefined | null): string => {
    if (!desc || typeof desc !== "string") return ""
    const trimmed = desc.trim()
    // If the description is a translation key or placeholder text, treat it as empty
    if (
      trimmed === "" ||
      trimmed.startsWith("form.") ||
      trimmed.includes("Placeholder") ||
      trimmed.includes("descriptionPlaceholder") ||
      trimmed === "form.descriptionPlaceholder" ||
      trimmed.toLowerCase().includes("placeholder")
    ) {
      return ""
    }
    return trimmed
  }

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(() => {
    if (!inspection?.distribution) return []
    // Initialize from inspection distribution
    const userIds: string[] = []
    inspection.distribution.forEach((email) => {
      const user = authUsers?.find((u) => u.email === email)
      if (user) userIds.push(user.id)
    })
    return userIds
  })
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(() => {
    if (!inspection?.distribution) return []
    // Initialize from inspection distribution
    const groupIds: string[] = []
    inspection.distribution.forEach((email) => {
      userGroups?.forEach((group) => {
        if (group.members?.some((memberId) => {
          const member = authUsers?.find((u) => u.id === memberId)
          return member?.email === email
        })) {
          if (!groupIds.includes(group.id)) groupIds.push(group.id)
        }
      })
    })
    return groupIds
  })
  const [sendNotifications, setSendNotifications] = useState(true)

  // Form data
  const [formData, setFormData] = useState<{
    documentTitle: string
    type: string
    projectId: string
    projectNumber: string
    projectLocation: string
    metier: string
    lieu: string
    sectionDevis: string
    plansLies: string
    inspectionDate: string
    dueDate: string
    contactPoint: string
    contractor: string
    createdBy: string
    creatorId: string
    description: string
    status: string
    responses: Record<string, InspectionItemResponse>
    attachments: Attachment[]
  }>(() => ({
    documentTitle: inspection?.documentTitle || "",
    type: inspection?.type || "",
    projectId: inspection?.projectId || (projects && Array.isArray(projects) && projects.length > 0 ? projects[0]?.id : ""),
    projectNumber: (inspection as any)?.projectNumber || "",
    projectLocation: (inspection as any)?.projectLocation || "",
    metier: (inspection as any)?.metier || "",
    lieu: (inspection as any)?.lieu || "",
    sectionDevis: (inspection as any)?.sectionDevis || "",
    plansLies: (inspection as any)?.plansLies || "",
    inspectionDate: (inspection as any)?.inspectionDate ? new Date((inspection as any).inspectionDate).toISOString().split("T")[0] : "",
    dueDate: (inspection as any)?.dueDate ? new Date((inspection as any).dueDate).toISOString().split("T")[0] : "",
    contactPoint: (inspection as any)?.contactPoint || "",
    contractor: (inspection as any)?.contractor || "",
    createdBy: (inspection as any)?.createdBy || currentUser?.name || "Unknown",
    creatorId: inspection?.creatorId || currentUser?.id || "",
    description: cleanDescription(inspection?.description),
    status: inspection?.status === "closed" ? "closed" : "open",
    responses: inspection?.responses?.reduce((acc, resp) => {
      acc[resp.itemId] = resp
      return acc
    }, {} as Record<string, InspectionItemResponse>) || {},
    attachments: inspection?.attachments || [],
  }))

  // Sync form data when inspection loads
  useEffect(() => {
    if (inspection) {
      setFormData({
        documentTitle: inspection.documentTitle,
        type: inspection.type,
        projectId: inspection.projectId,
        projectNumber: (inspection as any)?.projectNumber || "",
        projectLocation: (inspection as any)?.projectLocation || "",
        metier: (inspection as any)?.metier || "",
        lieu: (inspection as any)?.lieu || "",
        sectionDevis: (inspection as any)?.sectionDevis || "",
        plansLies: (inspection as any)?.plansLies || "",
        inspectionDate: (inspection as any)?.inspectionDate ? new Date((inspection as any).inspectionDate).toISOString().split("T")[0] : "",
        dueDate: (inspection as any)?.dueDate ? new Date((inspection as any).dueDate).toISOString().split("T")[0] : "",
        contactPoint: (inspection as any)?.contactPoint || "",
        contractor: (inspection as any)?.contractor || "",
        createdBy: (inspection as any)?.createdBy || currentUser?.name || "Unknown",
        creatorId: inspection?.creatorId || currentUser?.id || "",
        description: cleanDescription(inspection.description),
        status: inspection.status === "closed" ? "closed" : "open",
        responses: inspection.responses?.reduce((acc, resp) => {
          acc[resp.itemId] = resp
          return acc
        }, {} as Record<string, InspectionItemResponse>) || {},
        attachments: inspection.attachments || [],
      })
      
      // Initialize distribution from inspection
      if (inspection.distribution) {
        const userIds: string[] = []
        const groupIds: string[] = []
        
        inspection.distribution.forEach((email) => {
          const user = authUsers?.find((u) => u.email === email)
          if (user) {
            userIds.push(user.id)
          } else {
            // Check if email belongs to a group member
            userGroups?.forEach((group) => {
              if (group.members?.some((memberId) => {
                const member = authUsers?.find((u) => u.id === memberId)
                return member?.email === email
              })) {
                if (!groupIds.includes(group.id)) groupIds.push(group.id)
              }
            })
          }
        })
        
        setSelectedUserIds(userIds)
        setSelectedGroupIds(groupIds)
      }
    }
  }, [inspection?.id, authUsers, userGroups])

  // Clean description if it contains placeholder text - run on mount and when description changes
  useEffect(() => {
    const cleaned = cleanDescription(formData.description)
    if (formData.description !== cleaned) {
      setFormData((prev) => ({
        ...prev,
        description: cleaned,
      }))
    }
  }, [formData.description])

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  const completionPercentage = useMemo(() => {
    const allItems = (inspectionSections || []).flatMap((s) => s?.items || [])
    if (allItems.length === 0) return 0
    const answered = Object.values(formData.responses).filter((r) => r?.response !== null).length
    return Math.round((answered / allItems.length) * 100)
  }, [formData.responses])

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}
    if (!formData.documentTitle.trim()) newErrors.documentTitle = t("error.titleRequired")
    if (!formData.type) newErrors.type = t("error.inspectionTypeRequired")
    if (!formData.projectId) newErrors.projectId = t("error.projectRequired")

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, t])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Allow saving even if form is not fully completed
      // Only show errors but don't prevent saving
      validateForm()

      setIsSubmitting(true)

      try {
        // Ensure we have the inspection before proceeding
        if (!inspection) {
          throw new Error("Inspection not found")
        }
        // Convert responses object to array
        const responsesArray: InspectionItemResponse[] = Object.entries(formData.responses).map(
          ([itemId, response]) => ({
            itemId,
            response: response.response,
            comment: response.comment || "",
            attachments: response.attachments || [],
          }),
        )

        // Build distribution list from selected users and groups
        const distributionList: Array<{ userId?: string; groupId?: string; email?: string }> = []
        selectedUserIds.forEach((userId) => {
          const user = authUsers?.find((u) => u.id === userId)
          if (user) {
            distributionList.push({ userId, email: user.email })
          }
        })
        selectedGroupIds.forEach((groupId) => {
          const group = userGroups?.find((g) => g.id === groupId)
          if (group) {
            group.members?.forEach((memberId) => {
              const user = authUsers?.find((u) => u.id === memberId)
              if (user) {
                distributionList.push({ userId: memberId, groupId, email: user.email })
              }
            })
          }
        })

        const updatedInspection: Inspection = {
          ...inspection,
          documentTitle: formData.documentTitle,
          type: formData.type,
          projectId: formData.projectId,
          projectNumber: formData.projectNumber,
          projectName: formData.projectId,
          projectLocation: formData.projectLocation,
          metier: formData.metier,
          lieu: formData.lieu,
          sectionDevis: formData.sectionDevis,
          plansLies: formData.plansLies,
          inspectionDate: formData.inspectionDate ? new Date(formData.inspectionDate) : (inspection as any)?.inspectionDate,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
          contactPoint: formData.contactPoint,
          contractor: formData.contractor,
          createdBy: formData.createdBy || (inspection as any)?.createdBy,
          creatorId: formData.creatorId || inspection?.creatorId || currentUser?.id || "",
          description: cleanDescription(formData.description),
          status: (formData.status === "closed" ? "closed" : "open") as Inspection["status"],
          distribution: distributionList.map((d) => d.email || "").filter(Boolean),
          responses: responsesArray,
          attachments: formData.attachments || [],
          updatedAt: new Date(),
          // Set syncStatus to pending when form is updated (will be synced later)
          syncStatus: "pending" as const,
        }

        // Update inspection in store
        updateInspection(id, updatedInspection)

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
                formType: "inspection",
                formNumber: updatedInspection.id,
                formTitle: updatedInspection.documentTitle,
                projectName: project?.name,
                creatorName: currentUser?.name || "Unknown",
                creatorEmail: currentUser?.email || "",
                status: updatedInspection.status,
                description: updatedInspection.description,
                assignedTo: recipientEmails.map((email) => {
                  const user = authUsers.find((u) => u.email === email)
                  return { name: user?.name || email, email }
                }),
              },
              recipientEmails,
              sendNotifications
            )

            if (emailResult.success && emailResult.sent > 0) {
              toast.success(t("toast.inspectionUpdatedWithEmails" as any, { count: emailResult.sent }))
            } else if (emailResult.failed > 0) {
              toast.warning(t("toast.inspectionUpdatedEmailsFailed" as any, { count: emailResult.failed }))
            } else {
              toast.success(t("alert.saveSuccess.inspection"))
            }
          } else {
            toast.success(t("alert.saveSuccess.inspection"))
          }
        } else {
          toast.success(t("alert.saveSuccess.inspection"))
        }
        router.push(`/inspections/${id}`)
      } catch (error) {
        console.error("Error updating inspection:", error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        toast.error(
          t("alert.saveError.inspection") || "Erreur lors de l'enregistrement de l'inspection. Veuillez réessayer.",
          {
            description: errorMessage,
          }
        )
        setIsSubmitting(false)
      } finally {
        // Ensure submitting state is reset even if navigation fails
        setIsSubmitting(false)
      }
    },
    [formData, validateForm, updateInspection, id, selectedUserIds, selectedGroupIds, authUsers, userGroups, inspection, sendNotifications, router, t, currentUser],
  )

  const handleItemResponse = (
    itemId: string,
    response: "conforming" | "non-conforming" | "not-applicable" | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      responses: {
        ...prev.responses,
        [itemId]: {
          ...prev.responses[itemId],
          itemId,
          response,
          comment: prev.responses[itemId]?.comment || "",
          attachments: prev.responses[itemId]?.attachments || [],
        },
      },
    }))
  }

  const handleItemComment = (itemId: string, comment: string) => {
    setFormData((prev) => ({
      ...prev,
      responses: {
        ...prev.responses,
        [itemId]: {
          ...prev.responses[itemId],
          itemId,
          response: prev.responses[itemId]?.response || null,
          comment,
          attachments: prev.responses[itemId]?.attachments || [],
        },
      },
    }))
  }

  const getResponseStats = () => {
    const allResponses = Object.values(formData.responses)
    return {
      conforming: allResponses.filter((r) => r.response === "conforming").length,
      nonConforming: allResponses.filter((r) => r.response === "non-conforming").length,
      notApplicable: allResponses.filter((r) => r.response === "not-applicable").length,
      unanswered:
        ((inspectionSections || []).flatMap((s) => s?.items || []).length) -
        allResponses.filter((r) => r.response !== null).length,
    }
  }

  const stats = getResponseStats()

  if (!inspection) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t("empty.notFound.inspection")}</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
      <FormHeader title={t("form.edit")} backHref={`/inspections/${id}`} />

      {/* Progress Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{t("inspection.progress")}</h3>
              <div className="text-3xl font-bold text-blue-600">{completionPercentage}%</div>
            </div>
            <Progress value={completionPercentage} className="h-3" />

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-white dark:bg-slate-900 rounded p-3">
                <div className="text-xs text-muted-foreground">{t("inspection.conforming")}</div>
                <div className="text-2xl font-bold text-green-600">{stats.conforming}</div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded p-3">
                <div className="text-xs text-muted-foreground">{t("inspection.nonConforming")}</div>
                <div className="text-2xl font-bold text-red-600">{stats.nonConforming}</div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded p-3">
                <div className="text-xs text-muted-foreground">{t("inspection.notApplicable")}</div>
                <div className="text-2xl font-bold text-gray-600">{stats.notApplicable}</div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded p-3">
                <div className="text-xs text-muted-foreground">{t("inspection.unanswered")}</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.unanswered}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <FormSection title={t("inspection.info")} defaultOpen>
          <FormField
            label={t("inspection.titleLabel")}
            placeholder={t("inspection.titlePlaceholder")}
            value={formData.documentTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, documentTitle: e.target.value }))
            }
            error={errors.documentTitle}
            required
          >
            <Input
              value={formData.documentTitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, documentTitle: e.target.value }))}
              placeholder={t("inspection.titlePlaceholder")}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t("inspection.typeLabel")}
              error={errors.type}
              required
            >
              <InspectionTypeCrudCombobox
                value={formData.type}
                onChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                placeholder={t("inspection.selectType")}
              />
            </FormField>

            <FormField label={t("observation.projectNumber")} error={errors.projectId} required>
              <ProjectNoCombobox
                projects={projects}
                value={formData.projectId || projects.find((p) => p.code === formData.projectNumber)?.id || null}
                onChange={(projectId) => {
                  const p = projects.find((x) => x.id === projectId)
                  if (!p) return
                  setFormData((prev) => ({
                    ...prev,
                    projectId: projectId || "",
                    projectNumber: p.code,
                    // Always update location when project changes
                    projectLocation: p.location || "",
                  }))
                }}
                placeholder={t("observation.projectNumber")}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t("field.location")}>
              <LivrableCrudCombobox
                key={formData.projectId}
                listKey="locations"
                value={formData.projectLocation || ""}
                onChange={(value) => setFormData((prev) => ({ ...prev, projectLocation: value }))}
                placeholder={t("field.location")}
              />
            </FormField>
            <FormField label="Lieu">
              <LivrableCrudCombobox
                listKey="locations"
                value={formData.lieu || ""}
                onChange={(value) => setFormData((prev) => ({ ...prev, lieu: value }))}
                placeholder="Lieu"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Métier">
              <Input
                value={formData.metier}
                onChange={(e) => setFormData((prev) => ({ ...prev, metier: e.target.value }))}
                placeholder="Métier"
                className="h-12"
              />
            </FormField>
          </div>

          <FormField label={t("form.description") || "Description"}>
            <Textarea
              value={(() => {
                const desc = formData.description || ""
                // Always clean the description before displaying - check for placeholder text
                if (desc && (
                  desc === "form.descriptionPlaceholder" ||
                  desc.trim() === "form.descriptionPlaceholder" ||
                  desc.includes("form.descriptionPlaceholder") ||
                  (desc.startsWith("form.") && desc.includes("Placeholder"))
                )) {
                  // If it's placeholder text, update formData and return empty
                  if (formData.description === desc) {
                    // Use a ref or state update to avoid infinite loop
                    setTimeout(() => {
                      setFormData((prev) => {
                        if (prev.description === desc) {
                          return { ...prev, description: "" }
                        }
                        return prev
                      })
                    }, 0)
                  }
                  return ""
                }
                return desc
              })()}
              onChange={(e) => {
                const newValue = e.target.value
                // Only clean if it's exactly the placeholder text, otherwise allow user input
                if (newValue === "form.descriptionPlaceholder" || newValue.trim() === "form.descriptionPlaceholder") {
                  setFormData((prev) => ({ ...prev, description: "" }))
                } else {
                  setFormData((prev) => ({ ...prev, description: newValue }))
                }
              }}
              placeholder="Description détaillée de l'inspection."
              rows={4}
              className="resize-none"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Section du devis">
              <Input
                value={formData.sectionDevis}
                onChange={(e) => setFormData((prev) => ({ ...prev, sectionDevis: e.target.value }))}
                placeholder="Section du devis"
                className="h-12"
              />
            </FormField>
            <FormField label="Plans liés">
              <Input
                value={formData.plansLies}
                onChange={(e) => setFormData((prev) => ({ ...prev, plansLies: e.target.value }))}
                placeholder="Plans liés"
                className="h-12"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Date de l'inspection">
              <Input
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, inspectionDate: e.target.value }))}
                className="h-12"
              />
            </FormField>
            <FormField label="Date d'échéance">
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="h-12"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Point de contact">
              <Input
                value={formData.contactPoint}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactPoint: e.target.value }))}
                placeholder="Point de contact"
                className="h-12"
              />
            </FormField>
            <FormField label="Entrepreneur responsable">
              <Input
                value={formData.contractor}
                onChange={(e) => setFormData((prev) => ({ ...prev, contractor: e.target.value }))}
                placeholder="Entrepreneur responsable"
                className="h-12"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t("form.createdBy")}>
              <Select 
                value={formData.creatorId} 
                onValueChange={(value: string) => {
                  const selectedUser = authUsers?.find((u) => u.id === value) || users?.find((u) => u.id === value)
                  setFormData((prev) => ({ 
                    ...prev, 
                    creatorId: value,
                    createdBy: selectedUser?.name || prev.createdBy
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("form.createdBy")} />
                </SelectTrigger>
                <SelectContent>
                  {(authUsers && authUsers.length > 0 ? authUsers : users || []).map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label={t("form.status")}
              required
            >
              <Select value={formData.status === "closed" ? "closed" : "open"} onValueChange={(value: string) => setFormData((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("form.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{t("status.initiated")}</SelectItem>
                  <SelectItem value="closed">{t("status.closed")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-muted-foreground italic">
              Completion: {completionPercentage}%
            </div>
          </div>

        {errors.completion && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.completion}</AlertDescription>
          </Alert>
        )}
        </FormSection>

        {/* Inspection Sections */}
        {(inspectionSections || []).map((section) => {
          const sectionItems = section?.items || []
          const sectionResponses = sectionItems.map((item) => formData.responses[item.id])
          const sectionComplete = sectionResponses.filter((r) => r?.response !== null && r?.response !== undefined).length

          return (
            <FormSection
              key={section.id}
              title={section.title || (section.titleKey ? (t(section.titleKey as any) as any) : "")}
              defaultOpen={false}
            >
              {section.instruction && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{section.instruction}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {sectionItems.map((item) => (
                  <Card key={item.id} className="border-l-4 border-l-gray-300 hover:border-l-blue-300 transition-colors">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium">
                              <span className="text-muted-foreground text-sm">{item.number}</span> {item.label || t(`inspection.item.${item.id}` as any)}
                            </p>
                          </div>

                          {/* Response buttons */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleItemResponse(item.id, "conforming")}
                              className={`p-2 rounded transition-all ${
                                formData.responses[item.id]?.response === "conforming"
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-200 text-gray-600 hover:bg-green-200"
                              }`}
                              title={t("inspection.conforming")}
                            >
                              <Check className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleItemResponse(item.id, "non-conforming")}
                              className={`p-2 rounded transition-all ${
                                formData.responses[item.id]?.response === "non-conforming"
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-200 text-gray-600 hover:bg-red-200"
                              }`}
                              title={t("inspection.nonConforming")}
                            >
                              <X className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleItemResponse(item.id, "not-applicable")}
                              className={`p-2 rounded transition-all ${
                                formData.responses[item.id]?.response === "not-applicable"
                                  ? "bg-gray-500 text-white"
                                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                              }`}
                              title={t("inspection.notApplicable")}
                            >
                              <AlertCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Comment field for all items */}
                        <div className="space-y-2">
                          <Textarea
                            placeholder={t("inspection.commentPlaceholder")}
                            value={formData.responses[item.id]?.comment || ""}
                            onChange={(e) => handleItemComment(item.id, e.target.value)}
                            className={`text-sm ${
                              formData.responses[item.id]?.response === "non-conforming"
                                ? "bg-red-50 dark:bg-red-950 border-red-200"
                                : formData.responses[item.id]?.response === "conforming"
                                ? "bg-green-50 dark:bg-green-950 border-green-200"
                                : "bg-gray-50 dark:bg-gray-950 border-gray-200"
                            }`}
                            rows={2}
                          />
                          {/* Attachment upload for each item */}
                          <AttachmentUpload
                            attachments={formData.responses[item.id]?.attachments || []}
                            onChange={(attachments) => {
                              setFormData((prev) => ({
                                ...prev,
                                responses: {
                                  ...prev.responses,
                                  [item.id]: {
                                    ...prev.responses[item.id],
                                    itemId: item.id,
                                    response: prev.responses[item.id]?.response || null,
                                    comment: prev.responses[item.id]?.comment || "",
                                    attachments,
                                  },
                                },
                              }))
                            }}
                            maxFiles={5}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </FormSection>
          )
        })}

        {/* Attachments */}
        <FormSection title={`${t("form.attachments")} - ${t("field.photos")}`} defaultOpen>
          <AttachmentUpload
            attachments={formData.attachments}
            onChange={(attachments) => {
              setFormData((prev) => ({ ...prev, attachments }))
            }}
            maxFiles={10}
          />
        </FormSection>

        {/* Distribution / Assignment */}
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
            <Switch
              id="notify-inspection"
              checked={sendNotifications}
              onCheckedChange={setSendNotifications}
            />
            <Label htmlFor="notify-inspection">{t("notifyUsers")}</Label>
          </div>
        </FormSection>

        {/* Action Buttons */}
        <div className="flex gap-3 bg-muted/50 p-4 rounded-lg sticky bottom-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            {t("form.cancel")}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? t("action.saving") : t("action.saveInspection", { percent: completionPercentage })}
          </Button>
        </div>
      </form>
    </div>
  )
}
