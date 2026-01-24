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
import { getObservationTypes } from "@/lib/reference-data-loader"
import { AlertTriangle, CheckCircle2, Mail, Save } from "lucide-react"
import type { Observation, Attachment } from "@/lib/types"
import { useLocale } from "@/lib/locale-context"

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
    location: string
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
    location: "",
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
          projectNumber: formData.projectNumber,
          description: formData.description,
          priority: formData.priority,
          concernedCompany: formData.concernedCompany,
          referenceArticle: formData.referenceArticle,
          distribution: uniqueDistribution,
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
              label={t("field.type")}
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

          <FormField label={t("observation.projectNumber")}>
            <Input
              value={formData.projectNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, projectNumber: e.target.value }))}
              placeholder={t("form.description")}
            />
          </FormField>

          <FormField label={t("field.location")}>
            <Input
              value={formData.location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder={t("form.description")}
            />
          </FormField>

          <FormField label={t("observation.concernedCompanyLabel")}>
            <Input
              value={formData.concernedCompany}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, concernedCompany: e.target.value }))}
              placeholder={t("observation.concernedCompanyPlaceholder")}
            />
          </FormField>

          <FormField label={t("observation.referenceArticleLabel")}>
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
