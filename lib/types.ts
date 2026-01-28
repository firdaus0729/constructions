// Core data types for the construction forms application

export type FormStatus = "draft" | "submitted" | "open" | "closed" | "in-progress"
export type Priority = "low" | "medium" | "high" | "critical"
export type SyncStatus = "synced" | "pending" | "error"
export type UserRole = "admin" | "supervisor" | "worker"

// Azure AD Group Configuration
export interface AzureADGroupConfig {
  role: UserRole
  azureGroupId: string | null
  azureGroupName: string | null
  description?: string
  lastSyncedAt: Date | null
  memberCount?: number
}

// Authentication user (different from form creator)
export interface AuthUser {
  id: string
  email: string
  name: string
  passwordHash: string
  role: UserRole
  createdAt: Date
  azureAdId?: string // Azure AD Object ID
  azureAdUpn?: string // Azure AD User Principal Name
  azureAdGroupId?: string // Azure AD Group ID the user belongs to
}

export interface UserGroup {
  id: string
  name: string
  description: string
  memberIds: string[] // AuthUser IDs
  createdAt: Date
}

export interface FormAssignment {
  formId: string
  formType: "observation" | "incident" | "inspection" | "submittal"
  assignedToUserIds: string[] // AuthUser IDs
  assignedToGroupIds: string[] // UserGroup IDs
  assignedByUserId: string // AuthUser ID
  assignedAt: Date
  notifyOnSubmit: boolean
  notifyEmails: string[]
  status: "pending" | "viewed" | "completed"
}

export interface User {
  id: string
  name: string
  email: string
  role: string
}

export interface Project {
  id: string
  name: string
  code: string
  location: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt: Date
}

// Observation form types
export interface Observation {
  id: string
  number: string
  title: string
  type: string
  projectId: string
  projectNumber?: string
  creatorId: string
  assignedPersonId: string
  priority: Priority
  status: FormStatus
  distribution: string[]
  // "Date de notification" (reference PDF shows this explicitly)
  date: Date | null
  dueDate: Date | null
  completionDate: Date | null
  concernedCompany: string
  description: string
  referenceArticle: string
  attachments: Attachment[]
  safetyAnalysis: {
    danger: string
    contributingCondition: string
    contributingBehavior: string
  }
  createdAt: Date
  updatedAt: Date
  syncStatus: SyncStatus
}

// Incident form types
export interface Incident {
  id: string
  number: string
  title: string
  projectId: string
  creatorId: string
  location: string
  date: string // new field for form/report date
  eventDate: Date
  eventTime: string
  accidentType: string
  status: FormStatus
  distribution: string[]
  concernedCompany: string
  description: string
  attachments: Attachment[]
  aDeclarer?: boolean // Field for "À déclarer"
  isPrivate?: boolean // Field for "Privé(e)"
  investigation: {
    danger: string
    contributingCondition: string
    contributingBehavior: string
  }
  medicalTreatment: {
    injuryType: string
    bodyPart: string
    emergencyTreatment: boolean
    hospitalizedOvernight: boolean
    daysAbsent: number
    restrictedWorkDays: number
    returnToWorkDate: Date | null
    dateOfDeath: Date | null
  } | null
  createdAt: Date
  updatedAt: Date
  syncStatus: SyncStatus
}

// Inspection form types
export type InspectionResponse = "conforming" | "non-conforming" | "not-applicable" | null

export interface InspectionItem {
  id: string
  number: string
  label: string
  sectionId: string
}

export interface InspectionSection {
  id: string
  key: string
  titleKey: string
  instruction?: string
  items: InspectionItem[]
}

export interface InspectionItemResponse {
  itemId: string
  response: InspectionResponse
  comment: string
  attachments: Attachment[]
}

export interface Inspection {
  id: string
  documentTitle: string
  projectId: string
  projectNumber?: string
  projectName?: string
  projectLocation?: string
  type: string
  metier?: string
  description: string
  lieu?: string
  sectionDevis?: string
  plansLies?: string
  inspectionDate?: Date | string
  dueDate?: Date | string | null
  contactPoint?: string
  contractor?: string
  createdBy?: string
  attachments?: Attachment[]
  creatorId: string
  distribution: string[]
  closedById: string | null
  status: FormStatus
  responses: InspectionItemResponse[]
  createdAt: Date
  updatedAt: Date
  syncStatus: SyncStatus
}

// Livrable workflow step
export interface LivrableWorkflowStep {
  id: string
  step: number
  name: string
  role: string
  dueDate: Date | null
}

// Livrable form types
export interface Livrable {
  id: string
  number: string
  title: string
  projectId: string
  creatorId: string
  status: FormStatus
  distribution: string[]
  attachments: Attachment[]
  description: string
  
  // Basic Information
  specSection: string
  numberValue: string
  revision: string
  submittalType: string
  submittalPackage: string
  responsibleContractor: string
  receivedFrom: string
  submittalManager: string
  costCode: string
  location: string
  linkedDrawings: string
  ballInCourt: string
  isPrivate: boolean
  
  // Dates
  submitBy: Date | null
  receivedDate: Date | null
  issueDate: Date | null
  finalDueDate: Date | null
  
  // Schedule Information
  scheduleTask: string
  requiredOnSiteDate: Date | null
  leadTime: number
  plannedReturnDate: Date | null
  designTeamReviewTime: number
  plannedInternalReviewCompletedDate: Date | null
  internalReviewTime: number
  plannedSubmitByDate: Date | null
  
  // Delivery Information
  anticipatedDeliveryDate: Date | null
  confirmedDeliveryDate: Date | null
  actualDeliveryDate: Date | null
  
  // Workflow
  workflowTemplate: string
  workflowSteps: LivrableWorkflowStep[]
  
  createdAt: Date
  updatedAt: Date
  syncStatus: SyncStatus
}

// Form list item (for dashboard display)
export interface FormListItem {
  id: string
  type: "inspection" | "observation" | "incident" | "livrable"
  number: string
  title: string
  projectName: string
  status: FormStatus
  updatedAt: Date
  syncStatus: SyncStatus
}
