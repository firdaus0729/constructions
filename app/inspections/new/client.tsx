"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { FormHeader, FormSection, FormField, DistributionSelector } from "@/components/forms"
import { AppShell } from "@/components/app-shell"

export const dynamic = 'force-dynamic'
export const dynamicParams = true

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AttachmentUpload } from "@/components/forms/attachment-upload"
import { useAppStore, inspectionSections } from "@/lib/store"
import { Check, X, AlertCircle, Mail } from "lucide-react"
import type { Inspection, InspectionItemResponse } from "@/lib/types"
import { useLocale } from "@/lib/locale-context"
import { sendFormNotificationEmails, collectEmailAddresses } from "@/lib/email-service"
import { toast } from "sonner"
import { ProjectNoCombobox } from "@/components/project-no-combobox"
import { InspectionTypeCrudCombobox } from "@/components/inspection-type-crud-combobox"

export default function NewInspection() {
  const router = useRouter()
  const store = useAppStore()
  const { addInspection, projects = [], currentUser, authUsers = [], userGroups = [], users = [] } = store || {}
  const { t } = useLocale()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [sendNotifications, setSendNotifications] = useState(true)

  const [formData, setFormData] = useState({
    documentTitle: "",
    type: "",
    projectId: projects[0]?.id || "",
    projectNumber: "",
    projectLocation: "",
    metier: "",
    lieu: "",
    sectionDevis: "",
    plansLies: "",
    inspectionDate: "",
    dueDate: "",
    contactPoint: "",
    contractor: "",
    createdBy: currentUser?.name || "Unknown",
    creatorId: currentUser?.id || "",
    description: "",
    status: "draft" as string,
    responses: {} as Record<string, InspectionItemResponse>,
  })

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    // Only count the first 127 items for completion (purely informational)
    const allItems = (inspectionSections || []).flatMap((s) => s?.items || []).slice(0, 127)
    const answered = Object.values(formData.responses).filter(
      (r) => r.response !== null && allItems.find((i) => i.id === r.itemId),
    ).length
    return allItems.length > 0 ? Math.round((answered / allItems.length) * 100) : 0
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

      if (!validateForm()) {
        alert(t("alert.fixErrors"))
        return
      }

      setIsSubmitting(true)

      try {
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
            group.memberIds?.forEach((memberId) => {
              const user = authUsers?.find((u) => u.id === memberId)
              if (user) {
                distributionList.push({ userId: memberId, groupId, email: user.email })
              }
            })
          }
        })

        const generateInspectionNumber = () => {
          const stamp = Date.now().toString(36).toUpperCase()
          return `INS-${stamp.slice(-7)}`
        }

        const inspection: Inspection = {
          id: generateInspectionNumber(),
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
          inspectionDate: formData.inspectionDate ? new Date(formData.inspectionDate) : new Date(),
          dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
          contactPoint: formData.contactPoint,
          contractor: formData.contractor,
          createdBy: formData.createdBy || currentUser?.name || "Unknown",
          description: formData.description,
          creatorId: formData.creatorId || currentUser?.id || "unknown",
          distribution: distributionList.map((d) => d.email || "").filter(Boolean),
          closedById: null,
          status: formData.status,
          responses: responsesArray,
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: "pending",
        }

        addInspection(inspection)

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
                formType: "inspection",
                formNumber: inspection.id.slice(0, 8).toUpperCase(),
                formTitle: inspection.documentTitle,
                projectName: project?.name,
                creatorName: currentUser?.name || "Unknown",
                creatorEmail: currentUser?.email || "",
                status: inspection.status,
                description: inspection.description,
                assignedTo: recipientEmails.map((email) => {
                  const user = authUsers.find((u) => u.email === email)
                  return { name: user?.name || email, email }
                }),
              },
              recipientEmails,
              sendNotifications
            )

            if (emailResult.success && emailResult.sent > 0) {
              toast.success(`Inspection créée et ${emailResult.sent} email(s) envoyé(s)`)
            } else if (emailResult.failed > 0) {
              toast.warning(`Inspection créée mais ${emailResult.failed} email(s) ont échoué`)
            }
          }
        } else {
          toast.success(t("alert.saveSuccess.inspection") || "Inspection créée avec succès")
        }

        router.push("/inspections")
      } catch (error) {
        console.error("Error saving inspection:", error)
        alert(t("alert.saveError.inspection"))
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, validateForm, addInspection, currentUser, router, selectedUserIds, selectedGroupIds, authUsers, userGroups],
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
    // Only count the first 127 items for stats
    const allItems = (inspectionSections || []).flatMap((s) => s?.items || []).slice(0, 127)
    const allResponses = Object.values(formData.responses).filter(r => allItems.find(i => i.id === r.itemId))
    return {
      conforming: allResponses.filter((r) => r.response === "conforming").length,
      nonConforming: allResponses.filter((r) => r.response === "non-conforming").length,
      notApplicable: allResponses.filter((r) => r.response === "not-applicable").length,
      unanswered: allItems.length - allResponses.filter((r) => r.response !== null).length,
    }
  }

  const stats = getResponseStats()

  const handleSaveDraft = useCallback(async () => {
    if (!formData.documentTitle.trim()) {
      alert(t("error.titleRequired"))
      return
    }
    try {
      const inspection: Inspection = {
        id: `insp-${Date.now()}`,
        number: `INSP-${Math.floor(Math.random() * 10000)}`,
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
        inspectionDate: formData.inspectionDate ? new Date(formData.inspectionDate) : new Date(),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        contactPoint: formData.contactPoint,
        contractor: formData.contractor,
        description: formData.description,
        responses: Object.entries(formData.responses).map(([itemId, response]) => ({
          itemId,
          response: response.response,
          comment: response.comment || "",
          attachments: response.attachments || [],
        })),
        status: "draft" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: null,
        closedBy: null,
        syncStatus: "pending",
        createdBy: formData.createdBy || currentUser?.name || "Unknown",
        creatorId: formData.creatorId || currentUser?.id || "",
      }
      addInspection(inspection)
      alert(t("status.savedLocally"))
      router.push("/inspections")
    } catch (error) {
      alert(t("alert.saveDraft.error"))
    }
  }, [formData.documentTitle, formData.type, formData.projectId, formData.description, formData.responses, addInspection, currentUser, router, t])

  return (
    <AppShell>
      <FormHeader
        title={t("inspection.title")}
        backHref="/inspections"
        onSaveDraft={handleSaveDraft}
        isSaving={false}
      />

      <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">

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
        <FormSection title="Inspection Information" defaultOpen>
          <FormField
            label={t("inspection.titleLabel")}
            required
            error={errors.documentTitle}
          >
            <Input
              placeholder={t("inspection.titlePlaceholder")}
              value={formData.documentTitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, documentTitle: e.target.value }))}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t("inspection.typeLabel")}
              required
              error={errors.type}
            >
              <InspectionTypeCrudCombobox
                value={formData.type}
                onChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                placeholder={t("inspection.selectType")}
              />
            </FormField>

            <FormField
              label={t("observation.projectNumber")}
              required
              error={errors.projectId}
            >
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
                    projectLocation: prev.projectLocation || p.location,
                  }))
                }}
                placeholder={t("observation.projectNumber")}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t("field.location")}>
              <Input
                value={formData.projectLocation}
                onChange={(e) => setFormData((prev) => ({ ...prev, projectLocation: e.target.value }))}
                placeholder={t("field.location")}
                className="h-10"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Métier">
              <Input
                value={formData.metier}
                onChange={(e) => setFormData((prev) => ({ ...prev, metier: e.target.value }))}
                placeholder="Métier"
                className="h-10"
              />
            </FormField>
            <FormField label="Lieu">
              <Input
                value={formData.lieu}
                onChange={(e) => setFormData((prev) => ({ ...prev, lieu: e.target.value }))}
                placeholder="Lieu"
                className="h-10"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Section du devis">
              <Input
                value={formData.sectionDevis}
                onChange={(e) => setFormData((prev) => ({ ...prev, sectionDevis: e.target.value }))}
                placeholder="Section du devis"
                className="h-10"
              />
            </FormField>
            <FormField label="Plans liés">
              <Input
                value={formData.plansLies}
                onChange={(e) => setFormData((prev) => ({ ...prev, plansLies: e.target.value }))}
                placeholder="Plans liés"
                className="h-10"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Date de l'inspection">
              <Input
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, inspectionDate: e.target.value }))}
                className="h-10"
              />
            </FormField>
            <FormField label="Date d'échéance">
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="h-10"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Point de contact">
              <Input
                value={formData.contactPoint}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactPoint: e.target.value }))}
                placeholder="Point de contact"
                className="h-10"
              />
            </FormField>
            <FormField label="Entrepreneur responsable">
              <Input
                value={formData.contractor}
                onChange={(e) => setFormData((prev) => ({ ...prev, contractor: e.target.value }))}
                placeholder="Entrepreneur responsable"
                className="h-10"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t("form.createdBy")}>
              <Select
                value={formData.creatorId}
                onValueChange={(value: string) => {
                  const selectedUser =
                    authUsers?.find((u) => u.id === value) || users?.find((u) => u.id === value)
                  setFormData((prev) => ({
                    ...prev,
                    creatorId: value,
                    createdBy: selectedUser?.name || prev.createdBy,
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
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="draft">{t("status.draft")}</option>
                <option value="open">{t("status.open")}</option>
                <option value="in-progress">{t("status.inProgress")}</option>
                <option value="submitted">{t("status.submitted")}</option>
                <option value="closed">{t("status.closed")}</option>
              </select>
            </FormField>
          </div>

          <FormField
            label={t("inspection.descriptionNotes")}
          >
            <Textarea
              placeholder={t("form.description")}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </FormField>

          {/* No hard completion requirement – progress is informational only */}
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
                          <textarea
                            placeholder={t("inspection.commentPlaceholder")}
                            value={formData.responses[item.id]?.comment || ""}
                            onChange={(e) => handleItemComment(item.id, e.target.value)}
                            className={`w-full text-sm p-2 border rounded ${
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
            {isSubmitting ? t("action.saving") : t("action.saveInspection", { percent: completionPercentage })}
          </Button>
        </div>
      </form>
    </div>
  </AppShell>
  )
}
