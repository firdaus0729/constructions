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
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, Mail, Save } from "lucide-react"
import type { Observation, Attachment } from "@/lib/types"
import { useLocale } from "@/lib/locale-context"
import { ObservationTypeCrudCombobox } from "@/components/observation-type-crud-combobox"
import { ProjectNoCombobox } from "@/components/project-no-combobox"
import { IncidentOptionCrudCombobox } from "@/components/incident-crud-combobox"
import { ObservationContributingBehaviorCrudCombobox } from "@/components/observation-contributing-behavior-crud-combobox"

export default function EditObservation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const store = useAppStore()
  const { t } = useLocale()
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [sendNotifications, setSendNotifications] = useState(true)

  const { updateObservation, observations, projects = [], currentUser, authUsers = [], userGroups = [] } = store || {}

  const observation = observations.find((o) => o.id === id)

  const toDateStr = (date: Date | null | undefined): string => {
    if (!date) return ""
    const d = new Date(date)
    if (isNaN(d.getTime())) return ""
    return d.toISOString().split("T")[0]
  }

  // Initialize form data from observation
  const [formData, setFormData] = useState<{
    title: string
    type: string
    projectId: string
    projectNumber: string
    description: string
    priority: "low" | "medium" | "high"
    status: string
    creatorId: string
    concernedCompany: string
    referenceArticle: string
    origin: string
    location: string
    cnsstSection: string
    trade: string
    date: string
    dueDate: string
    completionDate: string
    attachments: Attachment[]
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
    status: observation?.status === "closed" ? "closed" : "open",
    creatorId: observation?.creatorId || "",
    concernedCompany: observation?.concernedCompany || "",
    referenceArticle: observation?.referenceArticle || "",
    origin: (observation as any)?.origin || "",
    location: (observation as any)?.location || "",
    cnsstSection: (observation as any)?.cnsstSection || "",
    trade: (observation as any)?.trade || "",
    date: "",
    dueDate: "",
    completionDate: "",
    attachments: observation?.attachments || [],
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
        status: observation.status === "closed" ? "closed" : "open",
        creatorId: observation.creatorId || "",
        date: toDateStr(observation.date as Date | null),
        dueDate: toDateStr(observation.dueDate),
        completionDate: toDateStr(observation.completionDate),
        concernedCompany: observation.concernedCompany || "",
        referenceArticle: observation.referenceArticle || "",
        origin: (observation as any).origin || "",
        location: (observation as any).location || "",
        cnsstSection: (observation as any).cnsstSection || "",
        trade: (observation as any).trade || "",
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
          status: (formData.status === "closed" ? "closed" : "open") as Observation["status"],
          creatorId: formData.creatorId || observation!.creatorId,
          date: formData.date ? new Date(formData.date) : null,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
          completionDate: formData.completionDate ? new Date(formData.completionDate) : null,
          concernedCompany: formData.concernedCompany,
          referenceArticle: formData.referenceArticle,
          origin: formData.origin || undefined,
          location: formData.location || undefined,
          cnsstSection: formData.cnsstSection || undefined,
          trade: formData.trade || undefined,
          distribution: uniqueDistribution,
          attachments: formData.attachments,
          safetyAnalysis: formData.safetyAnalysis,
          updatedAt: new Date(),
          syncStatus: "synced", // Mark as synced after successful save
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
              <Select value={formData.status === "closed" ? "closed" : "open"} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{t("status.initiated")}</SelectItem>
                  <SelectItem value="closed">{t("status.closed")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("observation.projectNumber")} error={errors.projectId} required>
              <ProjectNoCombobox
                projects={projects}
                value={formData.projectId}
                onChange={(projectId) => {
                  const p = projects?.find((x) => x.id === projectId)
                  setFormData((prev) => ({ ...prev, projectId: projectId || "", projectNumber: p?.code ?? "" }))
                }}
                placeholder={t("observation.projectNumber")}
              />
            </FormField>

            <FormField label={t("form.createdBy")}>
              <Select
                value={formData.creatorId || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, creatorId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("form.createdBy")} />
                </SelectTrigger>
                <SelectContent>
                  {((authUsers?.length ? authUsers : []) as { id: string; name: string }[]).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <FormField label={t("observation.origin")}>
            <Input
              value={formData.origin}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, origin: e.target.value }))}
              placeholder={t("observation.originPlaceholder")}
            />
          </FormField>
          <FormField label={t("observation.location")}>
            <Input
              value={formData.location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder={t("observation.locationPlaceholder")}
            />
          </FormField>
          <FormField label={t("observation.cnsstSection")}>
            <Input
              value={formData.cnsstSection}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, cnsstSection: e.target.value }))}
              placeholder={t("observation.cnsstSectionPlaceholder")}
            />
          </FormField>
          <FormField label={t("observation.trade")}>
            <Input
              value={formData.trade}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, trade: e.target.value }))}
              placeholder={t("observation.tradePlaceholder")}
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
            <IncidentOptionCrudCombobox
              listKey="danger"
              value={formData.safetyAnalysis.danger}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  safetyAnalysis: { ...prev.safetyAnalysis, danger: value },
                }))
              }
              placeholder={t("observation.danger")}
            />
          </FormField>

          <FormField
            label={t("observation.contributingCondition")}
            error={errors.condition}
            required
          >
            <IncidentOptionCrudCombobox
              listKey="contributingCondition"
              value={formData.safetyAnalysis.contributingCondition}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  safetyAnalysis: {
                    ...prev.safetyAnalysis,
                    contributingCondition: value,
                  },
                }))
              }
              placeholder={t("observation.contributingCondition")}
            />
          </FormField>

          <FormField
            label={t("observation.contributingBehavior")}
            error={errors.behavior}
            required
          >
            <ObservationContributingBehaviorCrudCombobox
              value={formData.safetyAnalysis.contributingBehavior}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  safetyAnalysis: {
                    ...prev.safetyAnalysis,
                    contributingBehavior: value,
                  },
                }))
              }
              placeholder={t("observation.contributingBehavior")}
            />
          </FormField>
        </FormSection>

        {/* Attachments */}
        <FormSection title={t("form.attachments")} defaultOpen>
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

          <FormField label={t("form.attachments")}>
            <AttachmentUpload
              attachments={formData.attachments}
              onChange={(attachments) => setFormData((prev) => ({ ...prev, attachments }))}
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
