"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
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
import type { Incident, Attachment, FormStatus } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DistributionSelector } from "@/components/forms"
import { ProjectNoCombobox } from "@/components/project-no-combobox"
import { IncidentAccidentTypeCrudCombobox, IncidentOptionCrudCombobox } from "@/components/incident-crud-combobox"
import { LivrableCrudCombobox } from "@/components/livrable-crud-combobox"

export default function EditIncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t } = useLocale()
  const store = useAppStore()
  const { projects = [], currentUser, updateIncident, incidents, authUsers = [], userGroups = [], users = [] } = store || {}
  const creatorOptions = (authUsers?.length ? authUsers : users) as { id: string; name: string }[]
  
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [sendNotifications, setSendNotifications] = useState(true)

  const incident = incidents?.find((i) => i.id === id)

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasMedicalTreatment, setHasMedicalTreatment] = useState(false)
  const [isFatal, setIsFatal] = useState(false)

  // Form data with proper typing
  const [formData, setFormData] = useState<{
    title: string
    projectId: string
    projectNumber: string
    creatorId: string
    status: FormStatus
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
    aDeclarer: boolean
    isPrivate: boolean
    date: string
    attachments: Attachment[]
  }>(() => ({
    title: incident?.title || "",
    projectId: incident?.projectId || (projects && Array.isArray(projects) && projects.length > 0 ? projects[0]?.id : ""),
    projectNumber: (incident as any)?.projectNumber || (projects?.find((p) => p.id === incident?.projectId)?.code) || "",
    creatorId: incident?.creatorId || "",
    // UI only supports Initié (open) and Fermé (closed); normalize legacy statuses to open.
    status: ((incident?.status as FormStatus) === "closed" ? "closed" : "open") as FormStatus,
    location: incident?.location || "",
    eventDate: incident?.eventDate ? new Date(incident.eventDate).toISOString().split("T")[0] : "",
    eventTime: incident?.eventTime || "",
    accidentType: incident?.accidentType || "",
    concernedCompany: incident?.concernedCompany || "",
    description: incident?.description || "",
    danger: incident?.investigation?.danger || "",
    contributingCondition: incident?.investigation?.contributingCondition || "",
    contributingBehavior: incident?.investigation?.contributingBehavior || "",
    injuryType: incident?.medicalTreatment?.injuryType || "",
    bodyPart: incident?.medicalTreatment?.bodyPart || "",
    emergencyTreatment: incident?.medicalTreatment?.emergencyTreatment || false,
    hospitalizedOvernight: incident?.medicalTreatment?.hospitalizedOvernight || false,
    daysAbsent: incident?.medicalTreatment?.daysAbsent || 0,
    restrictedWorkDays: incident?.medicalTreatment?.restrictedWorkDays || 0,
    returnToWorkDate: incident?.medicalTreatment?.returnToWorkDate ? new Date(incident.medicalTreatment.returnToWorkDate).toISOString().split("T")[0] : "",
    dateOfDeath: incident?.medicalTreatment?.dateOfDeath ? new Date(incident.medicalTreatment.dateOfDeath).toISOString().split("T")[0] : "",
    aDeclarer: (incident as any)?.aDeclarer || false,
    isPrivate: (incident as any)?.isPrivate || false,
    date: incident?.date || "",
    attachments: incident?.attachments || [],
  }))

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Memoized body parts grouped by category

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
          projectNumber: formData.projectNumber || undefined,
          creatorId: formData.creatorId || incident!.creatorId,
          status: formData.status,
          location: formData.location,
          eventDate: new Date(formData.eventDate),
          eventTime: formData.eventTime,
          accidentType: formData.accidentType,
          concernedCompany: formData.concernedCompany,
          description: formData.description,
          investigation: {
            danger: formData.danger,
            contributingCondition: formData.contributingCondition,
            contributingBehavior: formData.contributingBehavior,
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
          aDeclarer: formData.aDeclarer,
          isPrivate: formData.isPrivate,
          date: formData.date,
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
          <AlertDescription>{t("incident.accidentType")}</AlertDescription>
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
            <FormField label={t("incident.accidentType")} error={errors.accidentType} required>
              <IncidentAccidentTypeCrudCombobox
                value={formData.accidentType}
                onChange={(value) => setFormData((prev) => ({ ...prev, accidentType: value }))}
                placeholder={t("incident.selectAccidentType")}
              />
            </FormField>

            <FormField label={t("observation.projectNumber")} error={errors.projectId} required>
              <ProjectNoCombobox
                projects={projects}
                value={formData.projectId}
                onChange={(projectId) => {
                  const p = projects.find((pp) => pp.id === projectId)
                  setFormData((prev) => ({ ...prev, projectId: projectId || "", projectNumber: p?.code || "" }))
                }}
                placeholder={t("observation.projectNumber")}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={t("form.createdBy")}>
              <Select
                value={formData.creatorId || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, creatorId: value }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={t("form.createdBy")} />
                </SelectTrigger>
                <SelectContent>
                  {creatorOptions.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t("form.status")}>
              <Select
                value={formData.status}
                onValueChange={(value: FormStatus) => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">{t("status.initiated" as any)}</SelectItem>
                  <SelectItem value="closed">{t("status.closed")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
              <Label className="font-semibold">{t("incident.toDeclare")}</Label>
              <Switch
                checked={!!formData.aDeclarer}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, aDeclarer: checked }))}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
              <Label className="font-semibold">{t("incident.private")}</Label>
              <Switch
                checked={!!formData.isPrivate}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPrivate: checked }))}
              />
            </div>
          </div>

          <FormField label={t("field.location")} error={errors.location} required>
            <LivrableCrudCombobox
              listKey="locations"
              value={formData.location}
              onChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
              placeholder={t("incident.locationPlaceholder")}
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

            <FormField label={t("incident.eventTime")}> 
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
            <IncidentOptionCrudCombobox
              listKey="danger"
              value={formData.danger}
              onChange={(value) => setFormData((prev) => ({ ...prev, danger: value }))}
              placeholder={t("incident.dangerPlaceholder")}
            />
          </FormField>

          <FormField label={t("observation.contributingCondition")} error={errors.condition} required>
            <IncidentOptionCrudCombobox
              listKey="contributingCondition"
              value={formData.contributingCondition}
              onChange={(value) => setFormData((prev) => ({ ...prev, contributingCondition: value }))}
              placeholder={t("incident.contributingConditionPlaceholder")}
            />
          </FormField>

          <FormField label={t("observation.contributingBehavior")} error={errors.behavior} required>
            <IncidentOptionCrudCombobox
              listKey="contributingBehavior"
              value={formData.contributingBehavior}
              onChange={(value) => setFormData((prev) => ({ ...prev, contributingBehavior: value }))}
              placeholder={t("incident.contributingBehaviorPlaceholder")}
            />
          </FormField>

          {/* Attachments in Investigation Section – editable from this box when editing an incident */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <FormField
              label={t("field.attachments")}
              description={t("incident.attachmentsDesc")}
            >
              <AttachmentUpload
                attachments={formData.attachments}
                onAttachmentsChange={(attachments) => setFormData((prev) => ({ ...prev, attachments }))}
                readOnly={false}
              />
            </FormField>
          </div>
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
                  <IncidentOptionCrudCombobox
                    listKey="injuryTypes"
                    value={formData.injuryType}
                    onChange={(value) => setFormData((prev) => ({ ...prev, injuryType: value }))}
                    placeholder={t("incident.selectInjuryType")}
                  />
                </FormField>

                <FormField label={t("incident.bodyPart")} required>
                  <IncidentOptionCrudCombobox
                    listKey="bodyParts"
                    value={formData.bodyPart}
                    onChange={(value) => setFormData((prev) => ({ ...prev, bodyPart: value }))}
                    placeholder={t("incident.selectBodyPart")}
                  />
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
