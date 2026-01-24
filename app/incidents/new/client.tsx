"use client"

import type React from "react"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"

export const dynamic = 'force-dynamic'
export const dynamicParams = true

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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle2, Clock, Mail, Save } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { useAppStore } from "@/lib/store"
import { getAccidentTypes, getInjuryTypes, getBodyParts } from "@/lib/reference-data-loader"
import type { Incident, Attachment, FormStatus } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { DistributionSelector } from "@/components/forms"

export default function NewIncidentPage() {
  const router = useRouter()
  const { t } = useLocale()
  const store = useAppStore()
  const { projects = [], currentUser, addIncident, authUsers = [], userGroups = [] } = store || {}
  
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

  // Form state
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasMedicalTreatment, setHasMedicalTreatment] = useState(false)
  const [isFatal, setIsFatal] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["incident-info"]))

  // Form data with proper typing
  const [formData, setFormData] = useState({
    // Basic Info
    title: "",
    projectId: "",
    creatorId: currentUser?.id || "",
    status: "draft" as "draft" | "in-progress" | "submitted",
    location: "",
    date: "", // <-- New date field (form creation or report date)
    eventDate: "",
    eventTime: "",
    accidentType: "",
    concernedCompany: "",

    // Description
    description: "",
    
    // Investigation
    danger: "",
    contributingCondition: "",
    contributingBehavior: "",
    
    // Medical Treatment (optional)
    injuryType: "",
    bodyPart: "",
    emergencyTreatment: false,
    hospitalizedOvernight: false,
    daysAbsent: 0,
    restrictedWorkDays: 0,
    returnToWorkDate: "",
    treatmentProvider: "",
    treatmentCenter: "",
    dateOfDeath: "",
    
    // Attachments
    attachments: [] as Attachment[],
  })

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Memoized body parts grouped by category
  const bodyPartsByCategory = useMemo(() => {
    const grouped = {
      upper: bodyParts.filter((p) => p.category === "upper"),
      torso: bodyParts.filter((p) => p.category === "torso"),
      lower: bodyParts.filter((p) => p.category === "lower"),
      other: bodyParts.filter((p) => p.category === "other"),
    }
    return grouped
  }, [])

  // Validation logic
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields validation
    if (!formData.title?.trim()) {
      newErrors.title = t("error.incidentTitleRequired")
    }
    if (!formData.projectId) {
      newErrors.projectId = t("error.projectRequired")
    }
    if (!formData.location?.trim()) {
      newErrors.location = t("error.locationRequired")
    }
    if (!formData.eventDate) {
      newErrors.eventDate = t("error.eventDateRequired")
    }
    if (!formData.eventTime) {
      newErrors.eventTime = t("error.eventTimeRequired")
    }
    if (!formData.accidentType) {
      newErrors.accidentType = t("error.accidentTypeRequired")
    }
    if (!formData.description?.trim()) {
      newErrors.description = t("error.descriptionRequired")
    }

    // Medical treatment validation
    if (hasMedicalTreatment) {
      if (!formData.injuryType) {
        newErrors.injuryType = t("error.injuryTypeRequired")
      }
      if (!formData.bodyPart) {
        newErrors.bodyPart = t("error.bodyPartRequired")
      }
      if (isFatal && !formData.dateOfDeath) {
        newErrors.dateOfDeath = t("error.dateOfDeathRequired")
      }
      if (!isFatal && !formData.returnToWorkDate && formData.daysAbsent > 0) {
        newErrors.returnToWorkDate = t("error.returnToWorkDateRequired")
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, hasMedicalTreatment, isFatal])

  const generateIncidentNumber = useCallback((): string => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `INC-${year}${month}-${random}`
  }, [])

  const createIncidentObject = useCallback(
    (status: FormStatus): Incident => {
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

      return {
        id: Math.random().toString(36).substring(7),
        number: generateIncidentNumber(),
        title: formData.title,
        projectId: formData.projectId,
        creatorId: currentUser?.id || "",
        location: formData.location,
        eventDate: new Date(formData.eventDate),
        eventTime: formData.eventTime,
        accidentType: formData.accidentType,
        status: formData.status || status,
        distribution: uniqueDistribution,
        concernedCompany: formData.concernedCompany,
        description: formData.description,
        attachments: formData.attachments,
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
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: "pending",
      }
    },
    [formData, currentUser, hasMedicalTreatment, isFatal, generateIncidentNumber, selectedUserIds, selectedGroupIds, userGroups]
  )

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true)
    try {
      const incident = createIncidentObject("draft")
      addIncident(incident)
      toast.success(t("status.savedLocally"))
      router.push("/incidents")
    } catch (error) {
      toast.error(t("alert.saveDraft.error"))
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }, [createIncidentObject, addIncident, router, t])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        toast.error(t("alert.fixErrors"))
        return
      }

      setIsSubmitting(true)
      try {
        const incident = createIncidentObject("submitted")
        addIncident(incident)
        toast.success(t("alert.saveSuccess.incident"))
        router.push("/incidents")
      } catch (error) {
        toast.error(t("alert.saveError.incident"))
        console.error(error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [validateForm, createIncidentObject, addIncident, router]
  )

  const handleFieldChange = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const updated = { ...prev }
          delete updated[field]
          return updated
        })
      }
    },
    [errors]
  )

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const updated = new Set(prev)
      if (updated.has(sectionId)) {
        updated.delete(sectionId)
      } else {
        updated.add(sectionId)
      }
      return updated
    })
  }

  const getAccidentTypeDescription = (typeId: string) => {
    return accidentTypes?.find((t) => t.id === typeId)?.description || ""
  }

  const getInjuryTypeSeverity = (typeId: string) => {
    const injury = injuryTypes?.find((i) => i.id === typeId)
    return injury?.severity
  }

  return (
    <AppShell>
      <FormHeader title={t("incident.title")} backHref="/incidents" onSaveDraft={handleSaveDraft} isSaving={isSaving} />

      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
        {/* Critical Incident Alert */}
        {formData.accidentType &&
          accidentTypes?.find((t) => t.id === formData.accidentType)?.riskLevel === "critical" && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive ml-2">
                {t("incident.criticalAlert")}
              </AlertDescription>
            </Alert>
          )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSection
            title={t("incident.basicInfo")}
            collapsible={true}
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <FormField
                label={t("form.title")}
                required
                className="md:col-span-2"
                error={errors.title}
              >
                <Input
                  value={formData.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  placeholder={t("incident.titlePlaceholder")}
                  className={`h-12 ${errors.title ? "border-destructive" : ""}`}
                />
              </FormField>

              {/* Project */}
              <FormField label={t("form.project")} required error={errors.projectId}>
                <Select value={formData.projectId} onValueChange={(value) => handleFieldChange("projectId", value)}>
                  <SelectTrigger className={`h-12 ${errors.projectId ? "border-destructive" : ""}`}>
                    <SelectValue placeholder={t("incident.selectProject")} />
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

              {/* Creator */}
              <FormField label={t("form.createdBy")}>
                <Input
                  value={currentUser?.name || ""}
                  disabled
                  className="h-12 bg-muted"
                />
              </FormField>

              {/* Date (new field) */}
              <FormField label={t("field.date")} required>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleFieldChange("date", e.target.value)}
                  className="h-12"
                />
              </FormField>

              {/* Event Date */}
              <FormField label={t("incident.eventDate")} required error={errors.eventDate}>
                <Input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => handleFieldChange("eventDate", e.target.value)}
                  className={`h-12 ${errors.eventDate ? "border-destructive" : ""}`}
                />
              </FormField>

              {/* Status */}
              <FormField label={t("form.status")} required>
                <Select value={formData.status} onValueChange={(value: any) => handleFieldChange("status", value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t("status.draft")}</SelectItem>
                    <SelectItem value="in-progress">{t("status.inProgress")}</SelectItem>
                    <SelectItem value="submitted">{t("status.submitted")}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              {/* Location */}
              <FormField label={t("incident.location")} required error={errors.location}>
                <Input
                  value={formData.location}
                  onChange={(e) => handleFieldChange("location", e.target.value)}
                  placeholder={t("incident.locationPlaceholder")}
                  className={`h-12 ${errors.location ? "border-destructive" : ""}`}
                />
              </FormField>

              {/* Event Time */}
              <FormField label={t("incident.eventTime")} required error={errors.eventTime}>
                <Input
                  type="time"
                  value={formData.eventTime}
                  onChange={(e) => handleFieldChange("eventTime", e.target.value)}
                  className={`h-12 ${errors.eventTime ? "border-destructive" : ""}`}
                />
              </FormField>

              {/* Accident Type */}
              <FormField label={t("incident.accidentType")} required error={errors.accidentType}>
                <Select value={formData.accidentType} onValueChange={(value) => handleFieldChange("accidentType", value)}>
                  <SelectTrigger className={`h-12 ${errors.accidentType ? "border-destructive" : ""}`}>
                    <SelectValue placeholder={t("incident.selectAccidentType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {accidentTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <span>{type.label}</span>
                          {type.riskLevel === "critical" && (
                            <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">{t("incident.critical")}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.accidentType && (
                  <p className="text-sm text-muted-foreground mt-1">{getAccidentTypeDescription(formData.accidentType)}</p>
                )}
              </FormField>

              {/* Concerned Company */}
              <FormField label={t("observation.concernedCompany")}>
                <Input
                  value={formData.concernedCompany}
                  onChange={(e) => handleFieldChange("concernedCompany", e.target.value)}
                  placeholder={t("incident.concernedCompanyPlaceholder")}
                  className="h-12"
                />
              </FormField>
            </div>
          </FormSection>

        {/* Description Section (with attachments) */}
        <FormSection
          title={t("form.description")}
          collapsible={true}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t("incident.whatHappened")}
              required
              error={errors.description}
              description={t("incident.whatHappenedDesc")}
              className="col-span-1"
            >
              <Textarea
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                placeholder={t("incident.descriptionPlaceholder")}
                rows={8}
                className={`min-h-50 ${errors.description ? "border-destructive" : ""}`}
              />
            </FormField>
            <div className="col-span-1 flex flex-col gap-2">
              <AttachmentUpload
                attachments={formData.attachments}
                onChange={(attachments) => handleFieldChange("attachments", attachments)}
              />
            </div>
          </div>
        </FormSection>

        {/* Investigation Section */}
        <FormSection
          title={t("incident.investigation")}
          collapsible={true}
          defaultOpen={true}
        >
          <div className="space-y-4">
            <FormField
              label={t("observation.danger")}
              description={t("incident.dangerDesc")}
            >
              <Textarea
                value={formData.danger}
                onChange={(e) => handleFieldChange("danger", e.target.value)}
                placeholder={t("incident.dangerPlaceholder")}
                rows={3}
              />
            </FormField>

            <FormField
              label={t("observation.contributingCondition")}
              description={t("incident.contributingConditionDesc")}
            >
              <Textarea
                value={formData.contributingCondition}
                onChange={(e) => handleFieldChange("contributingCondition", e.target.value)}
                placeholder={t("incident.contributingConditionPlaceholder")}
                rows={3}
              />
            </FormField>

            <FormField
              label={t("observation.contributingBehavior")}
              description={t("incident.contributingBehaviorDesc")}
            >
              <Textarea
                value={formData.contributingBehavior}
                onChange={(e) => handleFieldChange("contributingBehavior", e.target.value)}
                placeholder={t("incident.contributingBehaviorPlaceholder")}
                rows={3}
              />
            </FormField>
          </div>
        </FormSection>

        {/* Medical Treatment Section */}
        <FormSection
          title={t("incident.medicalTreatment")}
          collapsible={true}
          defaultOpen={hasMedicalTreatment}
        >
          <div className="space-y-6">
            {/* Medical Treatment Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
              <div>
                <Label htmlFor="hasMedical" className="font-semibold cursor-pointer">
                  {t("incident.medicalTreatmentLabel")}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("incident.medicalTreatmentInfo")}
                </p>
              </div>
              <Switch
                id="hasMedical"
                checked={hasMedicalTreatment}
                onCheckedChange={setHasMedicalTreatment}
              />
            </div>

            {hasMedicalTreatment && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                {/* Row 1: Type de blessure | Partie du corps affectée */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label={t("incident.injuryType")}
                    required
                    error={errors.injuryType}
                    description={t("incident.selectInjuryTypeDesc")}
                  >
                    <Select
                      value={formData.injuryType}
                      onValueChange={(value) => {
                        handleFieldChange("injuryType", value)
                        setIsFatal(value === "fatal")
                      }}
                    >
                      <SelectTrigger className={`h-12 ${errors.injuryType ? "border-destructive" : ""}`}>
                        <SelectValue placeholder={t("incident.selectInjuryType")} />
                      </SelectTrigger>
                      <SelectContent>
                        {injuryTypes?.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <span>{type.label}</span>
                              {type.severity === "critical" && (
                                <span className="text-xs bg-destructive/20 text-destructive px-1 rounded">
                                  {t("incident.critical")}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.injuryType && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("incident.severity")}: {getInjuryTypeSeverity(formData.injuryType) || t("incident.unknown")}
                      </p>
                    )}
                  </FormField>

                  <FormField
                    label={t("incident.bodyPart")}
                    required
                    error={errors.bodyPart}
                    description={t("incident.selectBodyPartDesc")}
                  >
                    <Select value={formData.bodyPart} onValueChange={(value) => handleFieldChange("bodyPart", value)}>
                      <SelectTrigger className={`h-12 ${errors.bodyPart ? "border-destructive" : ""}`}>
                        <SelectValue placeholder={t("incident.selectBodyPart")} />
                      </SelectTrigger>
                      <SelectContent>
                        {bodyParts && bodyParts.length > 0 ? (
                          bodyParts.map((part) => (
                            <SelectItem key={part.id} value={part.id}>
                              {part.label}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="">No body parts available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                {/* Row 2: Nombre de jours d'absence | Nombre de jours en travail restreint */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label={t("incident.daysAbsent")}
                    description={t("incident.daysAbsentDesc")}
                  >
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={formData.daysAbsent}
                      onChange={(e) => handleFieldChange("daysAbsent", Math.max(0, Number.parseInt(e.target.value) || 0))}
                      className="h-12"
                    />
                  </FormField>

                  <FormField
                    label={t("incident.restrictedWorkDays")}
                    description={t("incident.restrictedDaysDesc")}
                  >
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={formData.restrictedWorkDays}
                      onChange={(e) =>
                        handleFieldChange("restrictedWorkDays", Math.max(0, Number.parseInt(e.target.value) || 0))
                      }
                      className="h-12"
                    />
                  </FormField>
                </div>

                {/* Row 3: Date de retour au travail | Date du décès (optional) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label={t("incident.returnToWorkDate")}
                    description={t("incident.returnDateDesc")}
                    error={errors.returnToWorkDate}
                  >
                    <Input
                      type="date"
                      value={formData.returnToWorkDate}
                      onChange={(e) => handleFieldChange("returnToWorkDate", e.target.value)}
                      className={`h-12 ${errors.returnToWorkDate ? "border-destructive" : ""}`}
                    />
                  </FormField>
                  <FormField
                    label={t("incident.dateOfDeath")}
                    description={t("incident.dateOfDeathDesc")}
                  >
                    <Input
                      type="date"
                      value={formData.dateOfDeath}
                      onChange={(e) => handleFieldChange("dateOfDeath", e.target.value)}
                      className="h-12"
                    />
                  </FormField>
                </div>

                {/* Row 4: Fournisseur de traitement | Centre de traitement & adresse */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label={t("incident.treatmentProvider")}
                    description={t("incident.treatmentProviderDesc")}
                  >
                    <Input
                      type="text"
                      value={formData.treatmentProvider || ""}
                      onChange={(e) => handleFieldChange("treatmentProvider", e.target.value)}
                      placeholder="e.g., Dr. Smith"
                      className="h-12"
                    />
                  </FormField>

                  <FormField
                    label={t("incident.treatmentCenter")}
                    description={t("incident.treatmentCenterDesc")}
                  >
                    <Input
                      type="text"
                      value={formData.treatmentCenter || ""}
                      onChange={(e) => handleFieldChange("treatmentCenter", e.target.value)}
                      placeholder="e.g., City General Hospital"
                      className="h-12"
                    />
                  </FormField>
                </div>

                {/* Row 5: Traité aux urgences | Hospitalisé jusqu'au lendemain */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div>
                      <Label htmlFor="emergency" className="font-semibold cursor-pointer">
                        {t("incident.emergencyTreatment")}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">{t("incident.emergencyTreatmentDesc")}</p>
                    </div>
                    <Switch
                      id="emergency"
                      checked={formData.emergencyTreatment}
                      onCheckedChange={(checked) => handleFieldChange("emergencyTreatment", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div>
                      <Label htmlFor="hospitalized" className="font-semibold cursor-pointer">
                        {t("incident.hospitalizedOvernight")}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">{t("incident.hospitalizedDesc")}</p>
                    </div>
                    <Switch
                      id="hospitalized"
                      checked={formData.hospitalizedOvernight}
                      onCheckedChange={(checked) => handleFieldChange("hospitalizedOvernight", checked)}
                    />
                  </div>
                </div>

                {isFatal && (
                  <Alert className="border-destructive/50 bg-destructive/10">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive ml-2">
                      This is a fatal incident. Management and regulatory authorities must be notified immediately.
                      Please provide accurate information.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
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
              id="notify-incident"
              checked={sendNotifications}
              onCheckedChange={setSendNotifications}
            />
            <Label htmlFor="notify-incident" className="cursor-pointer">
              {t("notifyUsers")}
            </Label>
          </div>
        </FormSection>

        {/* Attachments Section removed: attachments are handled in the description section above */}

        {/* Form Summary & Status */}
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{t("form.formStatus")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("form.formStatusDescription")}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button Group */}
        <div className="flex gap-3 bg-muted/50 p-4 rounded-lg sticky bottom-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/incidents")}
            disabled={isSaving || isSubmitting}
          >
            {t("form.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isSaving || isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? t("form.saving") : t("form.submit")}
          </Button>
        </div>
      </form>
      </div>
    </AppShell>
  )
}
