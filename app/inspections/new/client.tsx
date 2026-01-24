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
import { useAppStore, inspectionSections } from "@/lib/store"
import { Check, X, AlertCircle, Mail } from "lucide-react"
import type { Inspection, InspectionItemResponse } from "@/lib/types"
import { useLocale } from "@/lib/locale-context"

export default function NewInspection() {
  const router = useRouter()
  const store = useAppStore()
  const { addInspection, projects = [], currentUser, authUsers = [], userGroups = [] } = store || {}
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
    description: "",
    status: "draft" as string,
    responses: {} as Record<string, InspectionItemResponse>,
  })

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const allItems = (inspectionSections || []).flatMap((s) => s?.items || [])
    const answered = Object.values(formData.responses).filter((r) => r.response !== null).length
    return allItems.length > 0 ? Math.round((answered / allItems.length) * 100) : 0
  }, [formData.responses])
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!formData.documentTitle.trim()) newErrors.documentTitle = t("error.titleRequired")
    if (!formData.type) newErrors.type = t("error.inspectionTypeRequired")
    if (!formData.projectId) newErrors.projectId = t("error.projectRequired")
    if (completionPercentage < 50)
      newErrors.completion = t("error.minimumCompletion")

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, completionPercentage])

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

        const inspection: Inspection = {
          id: crypto.randomUUID(),
          documentTitle: formData.documentTitle,
          type: formData.type,
          projectId: formData.projectId,
          description: formData.description,
          creatorId: currentUser?.id || "unknown",
          distribution: distributionList,
          closedById: null,
          status: formData.status,
          responses: responsesArray,
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: "pending",
        }

        addInspection(inspection)
        alert(t("alert.saveSuccess.inspection"))
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
        createdBy: currentUser?.name || "Unknown",
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t("inspection.typeLabel")}
              required
              error={errors.type}
            >
              <select
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="">{t("inspection.selectType")}</option>
                <option value="safety">{t("inspection.type.safety")}</option>
                <option value="compliance">{t("inspection.type.compliance")}</option>
                <option value="incident-follow-up">{t("inspection.type.incidentFollowUp")}</option>
                <option value="routine">{t("inspection.type.routine")}</option>
              </select>
            </FormField>

            <FormField
              label={t("form.project")}
              required
              error={errors.projectId}
            >
              <select
                value={formData.projectId}
                onChange={(e) => setFormData((prev) => ({ ...prev, projectId: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="">{t("inspection.projectSelect")}</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                <option value="in-progress">{t("status.inProgress")}</option>
                <option value="closed">{t("status.closed")}</option>
              </select>
            </FormField>

            <div></div>
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

          {errors.completion && (
            <Alert variant="destructive">
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

                        {/* Comment field for non-conforming items */}
                        {formData.responses[item.id]?.response === "non-conforming" && (
                          <textarea
                            placeholder={t("inspection.commentPlaceholder")}
                            value={formData.responses[item.id]?.comment || ""}
                            onChange={(e) => handleItemComment(item.id, e.target.value)}
                            className="w-full text-sm p-2 border rounded bg-red-50 dark:bg-red-950 border-red-200"
                            rows={2}
                          />
                        )}
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
            disabled={isSubmitting || completionPercentage < 50}
          >
            {isSubmitting ? t("action.saving") : t("action.saveInspection", { percent: completionPercentage })}
          </Button>
        </div>
      </form>
    </div>
  </AppShell>
  )
}
