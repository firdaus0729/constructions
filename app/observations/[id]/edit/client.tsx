"use client"

import { useState, useCallback, useEffect } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { FormHeader, FormSection, FormField, AttachmentUpload, DistributionSelector } from "@/components/forms"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/lib/store"
import { AlertTriangle, CheckCircle2, Mail, Save } from "lucide-react"
import type { Observation, Attachment } from "@/lib/types"
import { useLocale } from "@/lib/locale-context"
import { ObservationTypeCrudCombobox } from "@/components/observation-type-crud-combobox"
import { ProjectNoCombobox } from "@/components/project-no-combobox"

export default function EditObservation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const store = useAppStore()
  const { t } = useLocale()
  const [observationTypes, setObservationTypes] = useState<any[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [sendNotifications, setSendNotifications] = useState(true)

  const { updateObservation, observations, projects = [], currentUser, authUsers = [], userGroups = [] } = store || {}

  const observation = observations.find((o) => o.id === id)

  // Load observation types on client side only
  useEffect(() => {
    setObservationTypes(getObservationTypes())
  }, [])

  // Initialize form data from observation
  const [formData, setFormData] = useState<{
    title: string
    type: string
    projectId: string
    projectNumber: string
    description: string
    priority: "low" | "medium" | "high"
    concernedCompany: string
    referenceArticle: string
    safetyAnalysis: {
      danger: string
      contributingCondition: string
      contributingBehavior: string
    }
  }>(() => ({
    title: observation?.title || "",
    type: observation?.type || "",
    projectId: observation?.projectId || (projects && Array.isArray(projects) && projects.length > 0) ? projects[0]?.id : "",
    projectNumber: observation?.projectNumber || "",
    description: observation?.description || "",
    priority: (observation?.priority as any) || "medium",
    concernedCompany: observation?.concernedCompany || "",
    referenceArticle: observation?.referenceArticle || "",
    safetyAnalysis: observation?.safetyAnalysis || {
      danger: "",
      contributingCondition: "",
      contributingBehavior: "",
    },
  }))

  useEffect(() => {
    if (observation) {
      setFormData({
        title: observation.title,
        type: observation.type,
        projectId: observation.projectId,
        projectNumber: observation.projectNumber || "",
        description: observation.description || "",
        priority: (observation.priority as any) || "medium",
        status: (observation.status as string) || "draft",
        date: toDateStr(observation.date as Date | null),
        dueDate: toDateStr(observation.dueDate),
        completionDate: toDateStr(observation.completionDate),
        concernedCompany: observation.concernedCompany || "",
        referenceArticle: observation.referenceArticle || "",
        attachments: observation.attachments || [],
        safetyAnalysis: observation.safetyAnalysis || { danger: "", contributingCondition: "", contributingBehavior: "" },
      })
    }
  }, [observation?.id])

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = t("error.titleRequired")
    if (!formData.type) newErrors.type = t("observation.type")
    if (!formData.projectId) newErrors.projectId = t("error.projectRequired")
    if (!formData.description.trim()) newErrors.description = t("form.description")
    if (!formData.safetyAnalysis.danger.trim()) newErrors.danger = t("observation.danger")
    if (!formData.safetyAnalysis.contributingCondition.trim())
      newErrors.condition = t("observation.contributingCondition")
    if (!formData.safetyAnalysis.contributingBehavior.trim())
      newErrors.behavior = t("observation.contributingBehavior")

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        alert(t("alert.requiredFields"))
        return
      }

      setIsSubmitting(true)

      try {
        const distributionList: string[] = [...selectedUserIds]
        
        selectedGroupIds.forEach((groupId) => {
          const group = userGroups.find((g) => g.id === groupId)
          if (group) {
            distributionList.push(...group.memberIds)
          }
        })
        
        const uniqueDistribution = Array.from(new Set(distributionList))
        
        const updatedObservation: Observation = {
          ...observation!,
          title: formData.title,
          type: formData.type,
          projectId: formData.projectId,
          projectNumber: formData.projectNumber || undefined,
          description: formData.description,
          priority: formData.priority,
          status: formData.status as Observation["status"],
          date: formData.date ? new Date(formData.date) : null,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
          completionDate: formData.completionDate ? new Date(formData.completionDate) : null,
          concernedCompany: formData.concernedCompany,
          referenceArticle: formData.referenceArticle,
          distribution: uniqueDistribution,
          attachments: formData.attachments,
          safetyAnalysis: formData.safetyAnalysis,
          updatedAt: new Date(),
          syncStatus: "pending",
        }

        updateObservation(id, updatedObservation)

        if (sendNotifications && uniqueDistribution.length > 0) {
          console.log("📧 Email notifications would be sent to:")
          uniqueDistribution.forEach((userId) => {
            const user = authUsers.find((u) => u.id === userId)
            if (user) {
              console.log(`   → ${user.name} <${user.email}>`)
            }
          })
        }

        alert(t("alert.saveSuccess.observation"))
        router.push(`/observations/${id}`)
      } catch (error) {
        console.error("Error updating observation:", error)
        alert(t("alert.saveError.observation"))
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, validateForm, updateObservation, id, selectedUserIds, selectedGroupIds, sendNotifications, userGroups, authUsers, observation, router, t],
  )

  if (!observation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t("empty.notFound.observation")}</p>
      </div>
    )
  }

  const selectedProject = projects?.find((p) => p.id === formData.projectId)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <FormHeader
        title={t("form.edit")}
        backHref={`/observations/${id}`}
      />

      {/* Priority indicators */}
      <div className="grid grid-cols-3 gap-4">
        {(["low", "medium", "high"] as const).map((level) => {
          const isSelected = formData.priority === level
          const bg = isSelected ? (level === "low" ? "#05F719" : level === "medium" ? "#F28705" : "#F70505") : undefined
          return (
            <Card
              key={level}
              className={`cursor-pointer transition-all ${isSelected ? "ring-2 ring-offset-2" : "hover:border-muted-foreground/30"}`}
              style={isSelected ? { backgroundColor: bg, borderColor: bg } : undefined}
              onClick={() => setFormData((prev) => ({ ...prev, priority: level }))}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  {level === "low" && <CheckCircle2 className={cn("h-4 w-4", isSelected ? "text-white" : "text-green-600")} />}
                  {level === "medium" && <AlertTriangle className={cn("h-4 w-4", isSelected ? "text-white" : "text-yellow-600")} />}
                  {level === "high" && <AlertTriangle className={cn("h-4 w-4", isSelected ? "text-white" : "text-red-600")} />}
                  <span className={cn("capitalize font-medium", isSelected && "text-white")}>{t(`priority.${level}` as any)}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <FormSection title={t("observation.basicInfo")} defaultOpen>
          <FormField
            label={t("form.title")}
            error={errors.title}
            required
          >
            <Input
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder={t("form.description")}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("field.type")} error={errors.type} required>
              <ObservationTypeCrudCombobox
                value={formData.type}
                onChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                placeholder={t("inspection.selectType")}
              />
            </FormField>

            <FormField label={t("form.status")}>
              <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t("status.draft")}</SelectItem>
                  <SelectItem value="in-progress">{t("status.inProgress")}</SelectItem>
                  <SelectItem value="open">{t("status.open")}</SelectItem>
                  <SelectItem value="closed">{t("status.closed")}</SelectItem>
                  <SelectItem value="submitted">{t("status.submitted")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("form.project")} error={errors.projectId} required>
              <Input
                value={formData.projectId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, projectId: e.target.value }))}
                placeholder={t("form.project")}
              />
            </FormField>
            <FormField label={t("observation.projectNumber")}>
              <ProjectNoCombobox
                projects={projects}
                value={projects?.find((p) => p.code === formData.projectNumber)?.id ?? null}
                onChange={(projectId) => {
                  const p = projects?.find((x) => x.id === projectId)
                  setFormData((prev) => ({ ...prev, projectNumber: p?.code ?? "" }))
                }}
                placeholder={t("observation.projectNumber")}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label={t("field.date")}>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              />
            </FormField>
            <FormField label={t("observation.dueDateMeasure")}>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </FormField>
            <FormField label={t("observation.correctionDateLabel")}>
              <Input
                type="date"
                value={formData.completionDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, completionDate: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField label={t("observation.concernedCompanyLabel")}>
            <Input
              value={formData.concernedCompany}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, concernedCompany: e.target.value }))}
              placeholder={t("observation.concernedCompanyPlaceholder")}
            />
          </FormField>

          <FormField label="Référence Article CRTC">
            <Input
              value={formData.referenceArticle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, referenceArticle: e.target.value }))}
              placeholder={t("observation.referenceArticlePlaceholder")}
            />
          </FormField>

          <FormField
            label={t("form.description")}
            error={errors.description}
            required
          >
            <Textarea
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t("observation.descriptionPlaceholder")}
              rows={5}
            />
          </FormField>
        </FormSection>

        {/* Safety Analysis */}
        <FormSection title={t("observation.safetyAnalysis")} defaultOpen>
          <Alert className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-950">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t("observation.safetyAnalysis")}
            </AlertDescription>
          </Alert>

          <FormField
            label={t("observation.danger")}
            error={errors.danger}
            required
          >
            <Textarea
              value={formData.safetyAnalysis.danger}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  safetyAnalysis: { ...prev.safetyAnalysis, danger: e.target.value },
                }))
              }
              placeholder={t("form.description")}
              rows={3}
            />
          </FormField>

          <FormField
            label={t("observation.contributingCondition")}
            error={errors.condition}
            required
          >
            <Textarea
              value={formData.safetyAnalysis.contributingCondition}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  safetyAnalysis: {
                    ...prev.safetyAnalysis,
                    contributingCondition: e.target.value,
                  },
                }))
              }
              placeholder={t("form.description")}
              rows={3}
            />
          </FormField>

          <FormField
            label={t("observation.contributingBehavior")}
            error={errors.behavior}
            required
          >
            <Textarea
              value={formData.safetyAnalysis.contributingBehavior}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  safetyAnalysis: {
                    ...prev.safetyAnalysis,
                    contributingBehavior: e.target.value,
                  },
                }))
              }
              placeholder={t("form.description")}
              rows={3}
            />
          </FormField>
        </FormSection>

        {/* Attachments */}
        <FormSection title={t("form.attachments")} defaultOpen>
          <AttachmentUpload
            attachments={formData.attachments}
            onChange={(attachments) => setFormData((prev) => ({ ...prev, attachments }))}
          />
        </FormSection>

        {/* Distribution - Assign Users & Groups */}
        <FormSection title={t("form.distribution")} defaultOpen>
          <Alert className="mb-4">
            <Mail className="h-4 w-4" />
            <AlertDescription>
              {t("sendEmailNotifications")}
            </AlertDescription>
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
        <div className="flex gap-3 bg-muted/50 p-4 rounded-lg sticky bottom-0">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t("form.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? t("form.saving") : t("form.save")}
          </Button>
        </div>
      </form>
    </div>
  )
}
