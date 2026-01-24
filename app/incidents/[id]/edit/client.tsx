"use client"

import type React from "react"
import { useState, useCallback, useMemo, useEffect } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import { AlertTriangle, CheckCircle2, Clock, Mail, Save } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { useAppStore } from "@/lib/store"
import { getAccidentTypes, getInjuryTypes, getBodyParts } from "@/lib/reference-data-loader"
import type { Incident, Attachment, FormStatus } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DistributionSelector } from "@/components/forms"

export default function EditIncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t } = useLocale()
  const store = useAppStore()
  const { projects = [], currentUser, updateIncident, incidents, authUsers = [], userGroups = [] } = store || {}
  
  // Load reference data on client side only
  const [accidentTypes, setAccidentTypes] = useState<any[]>([])
  const [injuryTypes, setInjuryTypes] = useState<any[]>([])
  const [bodyParts, setBodyParts] = useState<any[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [sendNotifications, setSendNotifications] = useState(true)
  
  useEffect(() => {
    setAccidentTypes(getAccidentTypes())
    setInjuryTypes(getInjuryTypes())
    setBodyParts(getBodyParts())
  }, [])

  const incident = incidents?.find((i) => i.id === id)

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasMedicalTreatment, setHasMedicalTreatment] = useState(false)
  const [isFatal, setIsFatal] = useState(false)

  // Form data with proper typing
  const [formData, setFormData] = useState<{
    title: string
    projectId: string
    location: string
    eventDate: string
    eventTime: string
    accidentType: string
    concernedCompany: string
    description: string
    danger: string
    contributingCondition: string
    contributingBehavior: string
    injuryType: string
    bodyPart: string
    emergencyTreatment: boolean
    hospitalizedOvernight: boolean
    daysAbsent: number
    restrictedWorkDays: number
    returnToWorkDate: string
    dateOfDeath: string
    attachments: Attachment[]
  }>(() => ({
    title: incident?.title || "",
    projectId: incident?.projectId || (projects && Array.isArray(projects) && projects.length > 0 ? projects[0]?.id : ""),
    location: incident?.location || "",
    eventDate: incident?.eventDate ? new Date(incident.eventDate).toISOString().split("T")[0] : "",
    eventTime: incident?.eventTime || "",
    accidentType: incident?.accidentType || "",
    concernedCompany: incident?.concernedCompany || "",
    description: incident?.description || "",
    danger: incident?.investigation?.danger || "",
    contributingCondition: incident?.investigation?.conditions || "",
    contributingBehavior: incident?.investigation?.behavior || "",
    injuryType: incident?.medicalTreatment?.injuryType || "",
    bodyPart: incident?.medicalTreatment?.bodyPart || "",
    emergencyTreatment: incident?.medicalTreatment?.emergencyTreatment || false,
    hospitalizedOvernight: incident?.medicalTreatment?.hospitalizedOvernight || false,
    daysAbsent: incident?.medicalTreatment?.daysAbsent || 0,
    restrictedWorkDays: incident?.medicalTreatment?.restrictedWorkDays || 0,
    returnToWorkDate: incident?.medicalTreatment?.returnToWorkDate ? new Date(incident.medicalTreatment.returnToWorkDate).toISOString().split("T")[0] : "",
    dateOfDeath: incident?.medicalTreatment?.dateOfDeath ? new Date(incident.medicalTreatment.dateOfDeath).toISOString().split("T")[0] : "",
    attachments: incident?.attachments || [],
  }))

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Memoized body parts grouped by category
  const bodyPartsByCategory = useMemo(() => {
    const grouped = {
      upper: bodyParts.filter((p) => p.category === "upper"),
      torso: bodyParts.filter((p) => p.category === "torso"),
      lower: bodyParts.filter((p) => p.category === "lower"),
    }
    return grouped
  }, [bodyParts])

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = t("error.titleRequired")
    if (!formData.accidentType) newErrors.accidentType = t("error.accidentTypeRequired")
    if (!formData.projectId) newErrors.projectId = t("error.projectRequired")
    if (!formData.eventDate) newErrors.eventDate = t("error.dateRequired")
    if (!formData.location.trim()) newErrors.location = t("error.locationRequired")
    if (!formData.description.trim()) newErrors.description = t("form.description")
    if (!formData.danger.trim()) newErrors.danger = t("observation.danger")
    if (!formData.contributingCondition.trim()) newErrors.condition = t("observation.contributingCondition")
    if (!formData.contributingBehavior.trim()) newErrors.behavior = t("observation.contributingBehavior")
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, t])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        toast.error(t("alert.fixErrors"))
        return
      }

      setIsSubmitting(true)
      try {
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

        const updatedIncident: Incident = {
          ...incident!,
          title: formData.title,
          projectId: formData.projectId,
          location: formData.location,
          eventDate: new Date(formData.eventDate),
          eventTime: formData.eventTime,
          accidentType: formData.accidentType,
          concernedCompany: formData.concernedCompany,
          description: formData.description,
          investigation: {
            danger: formData.danger,
            conditions: formData.contributingCondition,
            behavior: formData.contributingBehavior,
          },
          medicalTreatment: hasMedicalTreatment
            ? {
                injuryType: formData.injuryType,
                bodyPart: formData.bodyPart,
                emergencyTreatment: formData.emergencyTreatment,
                hospitalizedOvernight: formData.hospitalizedOvernight,
                daysAbsent: formData.daysAbsent,
                restrictedWorkDays: formData.restrictedWorkDays,
                returnToWorkDate: formData.returnToWorkDate ? new Date(formData.returnToWorkDate) : null,
                dateOfDeath: isFatal && formData.dateOfDeath ? new Date(formData.dateOfDeath) : null,
              }
            : null,
          distribution: distributionList,
          attachments: formData.attachments,
          updatedAt: new Date(),
          syncStatus: "pending",
        }

        updateIncident(id, updatedIncident)

        if (sendNotifications && distributionList.length > 0) {
          console.log("📧 Email notifications would be sent to:")
          distributionList.forEach(({ email }) => {
            if (email) console.log(`   → ${email}`)
          })
        }

        toast.success(t("alert.saveSuccess.incident"))
        router.push(`/incidents/${id}`)
      } catch (error) {
        toast.error(t("alert.saveError.incident"))
        console.error(error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, validateForm, updateIncident, id, selectedUserIds, selectedGroupIds, authUsers, userGroups, incident, hasMedicalTreatment, isFatal, sendNotifications, router, t],
  )

  if (!incident) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t("empty.notFound.incident")}</p>
      </div>
    )
  }

  const getAccidentTypeDescription = (typeId: string) => {
    return accidentTypes?.find((t) => t.id === typeId)?.description || ""
  }

  const getInjuryTypeSeverity = (typeId: string) => {
    const injury = injuryTypes?.find((i) => i.id === typeId)
    return injury?.severity
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
      <FormHeader title={t("form.edit")} backHref={`/incidents/${id}`} />

      {/* Critical Incident Alert */}
      {formData.accidentType && (
        <Alert className="bg-red-50 border-red-200 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{getAccidentTypeDescription(formData.accidentType) || ""}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <FormSection title={t("incident.basicInfo")} defaultOpen>
          <FormField label={t("form.title")} error={errors.title} required>
            <Input
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder={t("form.title")}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("field.type")} error={errors.accidentType} required>
              <Select value={formData.accidentType} onValueChange={(value) => setFormData((prev) => ({ ...prev, accidentType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("inspection.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {accidentTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={t("form.project")} error={errors.projectId} required>
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

          <FormField label={t("field.location")} error={errors.location} required>
            <Input
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder={t("field.location")}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("field.date")} error={errors.eventDate} required>
              <Input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, eventDate: e.target.value }))}
              />
            </FormField>

            <FormField label={t("field.time")}> 
              <Input
                type="time"
                value={formData.eventTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, eventTime: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField label={t("observation.concernedCompanyLabel")}>
            <Input
              value={formData.concernedCompany}
              onChange={(e) => setFormData((prev) => ({ ...prev, concernedCompany: e.target.value }))}
              placeholder={t("observation.concernedCompanyPlaceholder")}
            />
          </FormField>

          <FormField label={t("form.description")} error={errors.description} required>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t("form.description")}
              rows={4}
            />
          </FormField>
        </FormSection>

        {/* Investigation */}
        <FormSection title={t("incident.investigation")} defaultOpen>
          <Alert className="mb-4 bg-yellow-50 border-yellow-200 dark:bg-yellow-950">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{t("incident.investigationDescription")}</AlertDescription>
          </Alert>

          <FormField label={t("observation.danger")} error={errors.danger} required>
            <Textarea
              value={formData.danger}
              onChange={(e) => setFormData((prev) => ({ ...prev, danger: e.target.value }))}
              placeholder={t("form.description")}
              rows={3}
            />
          </FormField>

          <FormField label={t("observation.contributingCondition")} error={errors.condition} required>
            <Textarea
              value={formData.contributingCondition}
              onChange={(e) => setFormData((prev) => ({ ...prev, contributingCondition: e.target.value }))}
              placeholder={t("form.description")}
              rows={3}
            />
          </FormField>

          <FormField label={t("observation.contributingBehavior")} error={errors.behavior} required>
            <Textarea
              value={formData.contributingBehavior}
              onChange={(e) => setFormData((prev) => ({ ...prev, contributingBehavior: e.target.value }))}
              placeholder={t("form.description")}
              rows={3}
            />
          </FormField>
        </FormSection>

        {/* Medical Treatment */}
        <FormSection title={t("incident.medicalTreatment")} defaultOpen>
          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Switch
                id="has-medical"
                checked={hasMedicalTreatment}
                onCheckedChange={setHasMedicalTreatment}
              />
              <Label htmlFor="has-medical" className="cursor-pointer">
                {t("incident.withMedicalTreatment")}
              </Label>
            </div>

            {hasMedicalTreatment && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <FormField label={t("incident.injuryType")} required>
                  <Select value={formData.injuryType} onValueChange={(value) => setFormData((prev) => ({ ...prev, injuryType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {injuryTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <span>{type.label}</span>
                            {type.severity && (
                              <Badge variant="outline" className="text-xs">
                                {type.severity}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label={t("incident.bodyPart")} required>
                  <Select value={formData.bodyPart} onValueChange={(value) => setFormData((prev) => ({ ...prev, bodyPart: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(bodyPartsByCategory).map(([category, parts]) => (
                        <div key={category}>
                          <div className="font-semibold text-xs text-gray-600 p-2">{category.toUpperCase()}</div>
                          {parts.map((part) => (
                            <SelectItem key={part.id} value={part.id}>
                              {part.label}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emergency"
                      checked={formData.emergencyTreatment}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, emergencyTreatment: checked }))}
                    />
                    <Label htmlFor="emergency">{t("incident.emergencyTreatment")}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hospitalized"
                      checked={formData.hospitalizedOvernight}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, hospitalizedOvernight: checked }))}
                    />
                    <Label htmlFor="hospitalized">{t("incident.hospitalizedOvernight")}</Label>
                  </div>
                </div>

                <FormField label={t("incident.daysAbsent")}>
                  <Input
                    type="number"
                    min="0"
                    value={formData.daysAbsent}
                    onChange={(e) => setFormData((prev) => ({ ...prev, daysAbsent: parseInt(e.target.value) || 0 }))}
                  />
                </FormField>

                <FormField label={t("incident.restrictedWorkDays")}>
                  <Input
                    type="number"
                    min="0"
                    value={formData.restrictedWorkDays}
                    onChange={(e) => setFormData((prev) => ({ ...prev, restrictedWorkDays: parseInt(e.target.value) || 0 }))}
                  />
                </FormField>

                <FormField label={t("incident.returnToWorkDate")}>
                  <Input
                    type="date"
                    value={formData.returnToWorkDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, returnToWorkDate: e.target.value }))}
                  />
                </FormField>

                <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <Switch id="fatal" checked={isFatal} onCheckedChange={setIsFatal} />
                  <Label htmlFor="fatal" className="cursor-pointer font-semibold">
                    {t("incident.fatal")}
                  </Label>
                </div>

                {isFatal && (
                  <FormField label={t("incident.dateOfDeath")} required>
                    <Input
                      type="date"
                      value={formData.dateOfDeath}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dateOfDeath: e.target.value }))}
                    />
                  </FormField>
                )}
              </div>
            )}
          </div>
        </FormSection>

        {/* Attachments */}
        <FormSection title={t("field.attachments")} defaultOpen>
          <AttachmentUpload
            attachments={formData.attachments}
            onAttachmentsChange={(attachments) => setFormData((prev) => ({ ...prev, attachments }))}
            readOnly={false}
          />
        </FormSection>

        {/* Distribution */}
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
              id="notify-incident"
              checked={sendNotifications}
              onCheckedChange={setSendNotifications}
            />
            <Label htmlFor="notify-incident">{t("notifyUsers")}</Label>
          </div>
        </FormSection>

        {/* Action Buttons */}
        <div className="flex gap-3 bg-muted/50 p-4 rounded-lg sticky bottom-0">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            {t("form.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? t("form.saving") : t("form.save")}
          </Button>
        </div>
      </form>
    </div>
  )
}
