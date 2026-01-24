"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FormHeader, FormSection, FormField, AttachmentUpload, DistributionSelector } from "@/components/forms"
import { AppShell } from "@/components/app-shell"
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
import { getObservationTypes } from "@/lib/reference-data-loader"
import { AlertTriangle, CheckCircle2, Mail } from "lucide-react"
import type { Observation, Attachment } from "@/lib/types"
import { useLocale } from "@/lib/locale-context"

export default function NewObservation() {
  const router = useRouter()
  const store = useAppStore()
  const { t } = useLocale()
  const [observationTypes, setObservationTypes] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [sendNotifications, setSendNotifications] = useState(true)

  // Safely destructure store with defaults
  const { addObservation, projects = [], currentUser, authUsers = [], userGroups = [] } = store || {}

  // Load observation types on client side only
  useEffect(() => {
    setObservationTypes(getObservationTypes())
  }, [])

  const [formData, setFormData] = useState<{
    title: string
    type: string
    projectId: string
    projectNumber: string
    description: string
    priority: "low" | "medium" | "high"
    status: "draft" | "in-progress" | "submitted"
    concernedCompany: string
    referenceArticle: string
    dueDate: string
    completionDate: string
    attachments: Attachment[]
    safetyAnalysis: {
      danger: string
      contributingCondition: string
      contributingBehavior: string
    }
  }>(() => ({
    title: "",
    type: "",
    projectId: (projects && Array.isArray(projects) && projects.length > 0) ? projects[0]?.id : "",
    projectNumber: projects && Array.isArray(projects) && projects.length > 0 ? projects[0]?.code || "" : "",
    description: "",
    priority: "medium",
    status: "draft",
    concernedCompany: "",
    referenceArticle: "",
    dueDate: "",
    completionDate: "",
    attachments: [] as Attachment[],
    safetyAnalysis: {
      danger: "",
      contributingCondition: "",
      contributingBehavior: "",
    },
  }))

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

  // Auto-generate project number when project changes
  useEffect(() => {
    const selected = projects?.find((p) => p.id === formData.projectId)
    if (selected && selected.code && formData.projectNumber !== selected.code) {
      setFormData((prev) => ({ ...prev, projectNumber: selected.code }))
    }
  }, [formData.projectId, projects])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        alert(t("alert.requiredFields"))
        return
      }

      setIsSubmitting(true)

      try {
        // Build distribution list from selected users and groups
        const distributionList: string[] = [...selectedUserIds]
        // Add all members from selected groups
        selectedGroupIds.forEach((groupId) => {
          const group = userGroups.find((g) => g.id === groupId)
          if (group) {
            distributionList.push(...group.memberIds)
          }
        })
        // Remove duplicates
        const uniqueDistribution = Array.from(new Set(distributionList))

        // Auto-generate project number if not set
        let projectNumber = formData.projectNumber
        if (!projectNumber) {
          const selected = projects?.find((p) => p.id === formData.projectId)
          if (selected && selected.code) projectNumber = selected.code
        }

        const observation: Observation = {
          id: crypto.randomUUID(),
          number: `OBS-${Date.now().toString().slice(-6)}`,
          title: formData.title,
          type: formData.type,
          projectId: formData.projectId,
          projectNumber,
          creatorId: currentUser?.id || "unknown",
          assignedPersonId: currentUser?.id || "unknown",
          priority: formData.priority,
          status: formData.status,
          distribution: uniqueDistribution,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
          completionDate: formData.completionDate ? new Date(formData.completionDate) : null,
          concernedCompany: formData.concernedCompany,
          description: formData.description,
          referenceArticle: formData.referenceArticle,
          attachments: formData.attachments,
          safetyAnalysis: formData.safetyAnalysis,
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: "pending",
        }

        addObservation(observation)

        // Send email notifications if enabled
        if (sendNotifications && uniqueDistribution.length > 0) {
          await sendEmailNotifications(observation, uniqueDistribution, authUsers)
        }

        // Show success message
        alert(t("alert.saveSuccess.observation"))
        router.push("/observations")
      } catch (error) {
        console.error("Error saving observation:", error)
        alert(t("alert.saveError.observation"))
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, validateForm, addObservation, currentUser, router, selectedUserIds, selectedGroupIds, sendNotifications, userGroups, authUsers, projects],
  )

  // Email notification function (simulated for now)
  const sendEmailNotifications = async (observation: Observation, userIds: string[], users: any[]) => {
    console.log("📧 Email notifications would be sent to:")
    userIds.forEach((userId) => {
      const user = users.find((u) => u.id === userId)
      if (user) {
        console.log(`   → ${user.name} <${user.email}>`)
        console.log(`      Subject: New Observation Assignment - ${observation.title}`)
        console.log(`      Body: You have been assigned to observation ${observation.number}`)
      }
    })
    // In production, this would call an email API service
  }
  const selectedType = observationTypes?.find((t) => t.id === formData.type)
  const selectedProject = projects?.find((p) => p.id === formData.projectId)
  
  const handleSaveDraft = useCallback(async () => {
    if (!formData.title.trim()) {
      alert(t("error.titleRequired"))
      return
    }
    try {
      const observation: Observation = {
        id: `obs-${Date.now()}`,
        number: `OBS-${Math.floor(Math.random() * 10000)}`,
        title: formData.title,
        type: formData.type,
        projectId: formData.projectId,
        projectNumber: formData.projectNumber,
        description: formData.description,
        priority: formData.priority,
        concernedCompany: formData.concernedCompany,
        referenceArticle: formData.referenceArticle,
        safetyAnalysis: formData.safetyAnalysis,
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "draft" as const,
        syncStatus: "pending",
        creatorId: currentUser?.id || "unknown",
        assignedPersonId: currentUser?.id || "unknown",
        distribution: [],
        dueDate: null,
        completionDate: null,
      }
      addObservation(observation)
      alert(t("status.savedLocally"))
      router.push("/observations")
    } catch (error) {
      alert(t("alert.saveDraft.error"))
    }
  }, [formData.title, formData.type, formData.projectId, formData.projectNumber, formData.description, formData.priority, formData.concernedCompany, formData.referenceArticle, formData.safetyAnalysis, addObservation, currentUser, router, t])

  return (
    <AppShell>
      <FormHeader
        title={t("observation.title")}
        backHref="/observations"
        onSaveDraft={handleSaveDraft}
        isSaving={false}
      />

      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">

      {/* Priority indicators */}
      <div className="grid grid-cols-3 gap-4">
        {(["low", "medium", "high"] as const).map((level) => (
          <Card
            key={level}
            className={`cursor-pointer transition-all ${
              formData.priority === level
                ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950"
                : "hover:border-blue-300"
            }`}
            onClick={() => setFormData((prev) => ({ ...prev, priority: level }))}
          >
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                {level === "low" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {level === "medium" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                {level === "high" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                <span className="capitalize font-medium">{t(`priority.${level}` as any)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
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
            <FormField
              label={t("observation.type")}
              error={errors.type}
              required
            >
              <Select value={formData.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("inspection.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {observationTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {t(`observation.type.${type.id}` as any)}
                    </SelectItem>
                  ))}
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
            <FormField label={t("observation.projectNumber")}> 
              <Input
                value={formData.projectNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, projectNumber: e.target.value }))}
                placeholder={t("observation.projectNumber")}
              />
            </FormField>

            <FormField label={t("form.status")} required>
              <Select value={formData.status} onValueChange={(value: any) => setFormData((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("status.draft")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t("status.draft")}</SelectItem>
                  <SelectItem value="in-progress">{t("status.inProgress")}</SelectItem>
                  <SelectItem value="submitted">{t("status.submitted")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("form.createdBy")}>
              <Input
                value={currentUser?.name || ""}
                disabled
                className="bg-muted"
              />
            </FormField>

            <FormField label={t("form.priority")} required>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData((prev) => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("priority.medium")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("priority.low")}</SelectItem>
                  <SelectItem value="medium">{t("priority.medium")}</SelectItem>
                  <SelectItem value="high">{t("priority.high")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("observation.dueDate")}> 
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                placeholder={t("observation.dueDate")}
              />
            </FormField>

            <FormField label={t("observation.completionDate")}> 
              <Input
                type="date"
                value={formData.completionDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, completionDate: e.target.value }))}
                placeholder={t("observation.completionDate")}
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
        </FormSection>

        {/* Description Section */}
        <FormSection title={t("form.description")} defaultOpen>
          <div className="space-y-4">
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

            <FormField label={t("observation.referenceArticle")}> 
              <Input
                value={formData.referenceArticle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, referenceArticle: e.target.value }))}
                placeholder={t("observation.referenceArticle")}
              />
            </FormField>

            <FormField label={t("form.attachments")}>
              <AttachmentUpload
                attachments={formData.attachments}
                onChange={(attachments) => setFormData((prev) => ({ ...prev, attachments }))}
              />
            </FormField>
          </div>
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

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6">
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("action.saving") : t("form.save")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            {t("form.cancel")}
          </Button>
        </div>
      </form>
    </div>
  </AppShell>
  )
}
