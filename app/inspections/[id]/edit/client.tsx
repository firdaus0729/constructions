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

export default function EditInspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t } = useLocale()
  const store = useAppStore()
  const { projects = [], currentUser, updateInspection, inspections, authUsers = [], userGroups = [] } = store || {}
  
  const inspection = inspections?.find((i) => i.id === id)

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [sendNotifications, setSendNotifications] = useState(true)

  // Form data
  const [formData, setFormData] = useState<{
    documentTitle: string
    type: string
    projectId: string
    description: string
    status: string
    responses: Record<string, InspectionItemResponse>
    attachments: Attachment[]
  }>(() => ({
    documentTitle: inspection?.documentTitle || "",
    type: inspection?.type || "",
    projectId: inspection?.projectId || (projects && Array.isArray(projects) && projects.length > 0 ? projects[0]?.id : ""),
    description: inspection?.description || "",
    status: (inspection?.status as string) || "draft",
    responses: inspection?.responses?.reduce((acc, resp) => {
      acc[resp.itemId] = resp
      return acc
    }, {} as Record<string, InspectionItemResponse>) || {},
    attachments: [],
  }))

  // Sync form data when inspection loads
  useEffect(() => {
    if (inspection) {
      setFormData({
        documentTitle: inspection.documentTitle,
        type: inspection.type,
        projectId: inspection.projectId,
        description: inspection.description,
        status: (inspection.status as string),
        responses: inspection.responses?.reduce((acc, resp) => {
          acc[resp.itemId] = resp
          return acc
        }, {} as Record<string, InspectionItemResponse>) || {},
        attachments: [],
      })
    }
  }, [inspection?.id])

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
    if (completionPercentage < 50) newErrors.completion = t("error.minimumCompletion")

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, completionPercentage, t])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        alert(t("alert.completeBeforeSubmit"))
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
            group.members?.forEach((memberId) => {
              const user = authUsers?.find((u) => u.id === memberId)
              if (user) {
                distributionList.push({ userId: memberId, groupId, email: user.email })
              }
            })
          }
        })

        const updatedInspection: Inspection = {
          ...inspection!,
          documentTitle: formData.documentTitle,
          type: formData.type,
          projectId: formData.projectId,
          description: formData.description,
          status: formData.status,
          distribution: distributionList,
          responses: responsesArray,
          attachments: formData.attachments,
          updatedAt: new Date(),
          syncStatus: "pending",
        }

        updateInspection(id, updatedInspection)

        if (sendNotifications && distributionList.length > 0) {
          console.log("📧 Email notifications would be sent to:")
          distributionList.forEach(({ email }) => {
            if (email) console.log(`   → ${email}`)
          })
        }

        toast.success(t("alert.saveSuccess.inspection"))
        router.push(`/inspections/${id}`)
      } catch (error) {
        console.error("Error updating inspection:", error)
        alert(t("alert.saveError.inspection"))
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, validateForm, updateInspection, id, selectedUserIds, selectedGroupIds, authUsers, userGroups, inspection, sendNotifications, router, t],
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t("inspection.typeLabel")}
              error={errors.type}
              required
            >
              <Select value={formData.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("inspection.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safety">{t("inspection.type.safety")}</SelectItem>
                  <SelectItem value="compliance">{t("inspection.type.compliance")}</SelectItem>
                  <SelectItem value="incident-follow-up">{t("inspection.type.incidentFollowUp")}</SelectItem>
                  <SelectItem value="routine">{t("inspection.type.routine")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label={t("form.project")}
              error={errors.projectId}
              required
            >
              <Select value={formData.projectId} onValueChange={(value) => setFormData((prev) => ({ ...prev, projectId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("inspection.projectSelect")} />
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t("form.status")}
              required
            >
              <Select value={formData.status} onValueChange={(value: any) => setFormData((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("form.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t("status.draft")}</SelectItem>
                  <SelectItem value="in-progress">{t("status.inProgress")}</SelectItem>
                  <SelectItem value="closed">{t("status.closed")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <div className="flex items-end">
              <div className="text-sm text-muted-foreground italic">
                Completion: {completionPercentage}%
              </div>
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
              title={section.title}
              description={t("inspection.itemsChecked", { checked: sectionComplete, total: sectionItems.length })}
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
                              <span className="text-muted-foreground text-sm">{item.number}</span> {t(`inspection.item.${item.id}` as any)}
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

                        {/* Comment field */}
                        <Input
                          type="text"
                          placeholder={t("inspection.addComment")}
                          value={formData.responses[item.id]?.comment || ""}
                          onChange={(e) => handleItemComment(item.id, e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </FormSection>
          )
        })}

        {/* Attachments */}
        <FormSection title={t("field.attachments")} defaultOpen>
          <AttachmentUpload
            attachments={formData.attachments}
            onAttachmentsChange={(attachments) => setFormData((prev) => ({ ...prev, attachments }))}
            readOnly={false}
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
            disabled={isSubmitting || completionPercentage < 50}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? t("action.saving") : t("action.saveInspection", { percent: completionPercentage })}
          </Button>
        </div>
      </form>
    </div>
  )
}
