"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

// Translation keys for the entire application
const translations = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.siteForms": "Site Forms",
    "nav.inspections": "Inspections",
    "nav.observations": "Observations",
    "nav.incidents": "Incidents",
    "nav.settings": "Settings",

    // Dashboard
    "dashboard.title": "INTERLAG",
    "dashboard.subtitle": "Manage inspections, observations, and incidents",
    "dashboard.newInspection": "New Inspection",
    "dashboard.newObservation": "New Observation",
    "dashboard.newIncident": "New Incident",
    "dashboard.recentDrafts": "Recent Drafts",
    "dashboard.recentSubmissions": "Recent Submissions",
    "dashboard.viewAll": "View All",
    "dashboard.noDrafts": "No drafts yet",
    "dashboard.noSubmissions": "No submissions yet",

    en: {
      // Navigation
      "nav.dashboard": "Dashboard",
      "nav.siteForms": "Site Forms",
      "nav.inspections": "Inspections",
      "nav.observations": "Observations",
      "nav.incidents": "Incidents",
      "nav.settings": "Settings",
      // ...existing code...
      "status.inProgress": "In Progress",
      // ...existing code...
      "field.date": "Date",
      // ...existing code...
    },
    fr: {
      // Navigation
      "nav.dashboard": "Tableau de bord",
      "nav.siteForms": "Formulaires de chantier",
      "nav.inspections": "Inspections",
      "nav.observations": "Observations",
      "nav.incidents": "Incidents",
      "nav.settings": "Paramètres",
      // ...existing code...
      "status.inProgress": "En Progression",
      // ...existing code...
      "field.date": "Date",
      // ...existing code...
    },
    "form.createdBy": "Created By",
    "form.distribution": "Distribution",
    "form.closedBy": "Closed By",
    "form.status": "Status",
    "form.priority": "Priority",
    "form.exportPdf": "Export PDF",
    "form.formStatus": "Form Status",
    "form.formStatusDescription": "This form will be saved locally to IndexedDB. When you submit, it will be marked as pending sync. Once online connectivity is restored, it will automatically sync to the server.",
    "section.details": "Details",

    // Generic
    "common.updated": "Updated {distance}",
    "units.days": "{count} days",

    // Not found
    "empty.notFound.observation": "Observation not found",
    "empty.notFound.inspection": "Inspection not found",
    "empty.notFound.incident": "Incident not found",

    // Settings
    "settings.syncStatus": "Sync Status",
    "settings.syncStatus.desc": "Monitor your data synchronization status",
    "settings.totalForms": "Total Forms",
    "settings.pendingSync": "Pending Sync",
    "settings.language": "Language",
    "settings.language.desc": "Choose your preferred language for the application",
    "settings.applicationLanguage": "Application Language",
    "settings.notifications": "Notifications",
    "settings.notifications.desc": "Configure how you receive updates",
    "settings.pushNotifications": "Push Notifications",
    "settings.pushNotifications.desc": "Receive alerts for new assignments",
    "settings.syncAlerts": "Sync Alerts",
    "settings.syncAlerts.desc": "Get notified when sync completes",
    "settings.appearance": "Appearance",
    "settings.appearance.desc": "Customize the visual appearance",
    "settings.theme": "Theme",
    "settings.theme.desc": "Choose light or dark mode",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.theme.system": "System",
    "sync.allChangesSynced": "All changes synced",
    "sync.pendingChanges": "{count} pending changes",
    "sync.lastSynced": "Last synced {time}",
    "sync.syncNow": "Sync Now",
    "sync.syncing": "Syncing...",

    // Priority levels
    "priority.low": "Low",
    "priority.medium": "Medium",
    "priority.high": "High",
    "priority.critical": "Critical",

    // Observation form
    "observation.title": "Observation Form",
    "observation.basicInfo": "Basic Information",
    "observation.number": "Observation Number",
    "observation.projectNumber": "Project Number",
    "observation.type": "Type of Observation",
    "observation.assignedPerson": "Assigned Person",
    "observation.dueDate": "Corrective Action Due Date",
    "observation.completionDate": "Correction Completion Date",
    "observation.concernedCompany": "Concerned Company",
    "observation.referenceArticle": "Reference Article (CRTC)",
    "observation.safetyAnalysis": "Safety Analysis",
    "observation.danger": "Danger",
    "observation.contributingCondition": "Contributing Condition",
    "observation.contributingBehavior": "Contributing Behavior",

    // Observation types
    "observation.type.unsafe-condition": "Unsafe Condition",
    "observation.type.unsafe-behavior": "Unsafe Behavior",
    "observation.type.near-miss": "Near Miss",
    "observation.type.good-practice": "Good Practice",
    "observation.type.hazard-awareness": "Hazard Awareness",
    "observation.type.ppe-non-compliance": "PPE Non-Compliance",
    "observation.type.housekeeping": "Housekeeping Issue",
    "observation.type.tool-equipment": "Tool/Equipment Issue",

    // Incident form
    "incident.title": "Incident Form",
    "incident.basicInfo": "Basic Information",
    "incident.eventDetails": "Event Details",
    "incident.number": "Incident Number",
    "incident.titlePlaceholder": "Brief summary of the incident",
    "incident.location": "Location",
    "incident.locationPlaceholder": "e.g., North Building Site, Basement Level 2",
    "incident.eventDate": "Event Date",
    "incident.eventTime": "Event Time",
    "incident.accidentType": "Type of Accident",
    "incident.selectAccidentType": "Select accident type",
    "incident.critical": "CRITICAL",
    "incident.concernedCompanyPlaceholder": "Company responsible for the area",
    "incident.whatHappened": "What Happened?",
    "incident.whatHappenedDesc": "Provide a detailed account of the incident. Include who was involved, their roles, what they were doing, what equipment or materials were being used, weather conditions, and any other relevant circumstances.",
    "incident.descriptionPlaceholder": "Be as detailed as possible. This information is crucial for investigation and prevention of future incidents.",
    "incident.investigation": "Investigation",
    "incident.investigationDescription": "Analyze the root causes and contributing factors to this incident",
    "incident.dangerDesc": "What hazard, unsafe condition, or event allowed this incident to occur?",
    "incident.dangerPlaceholder": "e.g., Slippery floor due to spilled water, Missing guardrail, Inadequate lighting",
    "incident.contributingConditionDesc": "What environmental, equipment, or workplace conditions contributed?",
    "incident.contributingConditionPlaceholder": "e.g., Worn equipment, Poor visibility, Crowded work area, Lack of maintenance",
    "incident.contributingBehaviorDesc": "What behavior contributed?",
    "incident.contributingBehaviorPlaceholder": "e.g., Non-compliance with procedures, Neglecting PPE, Working in a hurry",
    "incident.medicalTreatment": "Medical Treatment",
    "incident.withMedicalTreatment": "This incident includes medical treatment",
    "incident.injuryType": "Injury Type",
    "incident.bodyPart": "Body Part Affected",
    "incident.emergencyTreatment": "Treated at Emergency",
    "incident.emergencyTreatmentDesc": "First aid or emergency services provided",
    "incident.hospitalizedOvernight": "Hospitalized Until the Next Day",
    "incident.hospitalized": "Incident Hospitalized",
    "incident.daysAbsent": "Days Absent from Work",
    "incident.restrictedWorkDays": "Number of Days on Restricted Work",
    "incident.returnToWorkDate": "Date of Return to Work",
    "incident.treatmentProvider": "Treatment Provider",
    "incident.treatmentCenter": "Treatment Center & Address",
    "incident.fatal": "This incident resulted in a fatality",
    "incident.dateOfDeath": "Date of Death",
    "incident.criticalAlert": "This is a CRITICAL incident type. Ensure all required fields are completed accurately. Management will be notified immediately.",

    // Inspection form
    "inspection.title": "Inspection Form",
    "inspection.createdLabel": "Created",
    "inspection.documentTitle": "Document Title",
    "inspection.number": "Inspection Number",
    "inspection.type": "Type",
    "inspection.closedBy": "Closed By",
    "inspection.summary": "Inspection Summary",
    "inspection.articlesInspected": "Articles Inspected",
    "inspection.conforming": "Conforming",
    "inspection.nonConforming": "Non-Conforming",
    "inspection.notApplicable": "N/A",
    "inspection.unanswered": "Unanswered",
    "inspection.sections": "Inspection Sections",
    "inspection.instruction": "If not applicable, select N/A for each item",
    "inspection.progress": "Inspection Progress",
    "inspection.info": "Inspection Information",
    "inspection.titleLabel": "Inspection Title",
    "inspection.titlePlaceholder": "e.g., Weekly Safety Inspection - Building A",
    "inspection.typeLabel": "Inspection Type",
    "inspection.selectType": "Select type...",
    "inspection.type.safety": "Safety Inspection",
    "inspection.type.compliance": "Compliance Check",
    "inspection.type.incidentFollowUp": "Incident Follow-up",
    "inspection.type.routine": "Routine Check",
    "inspection.projectSelect": "Select project...",
    "inspection.descriptionNotes": "Description/Notes",
    "inspection.itemsChecked": "{checked}/{total} items checked",
    "inspection.addComment": "Add corrective action or notes...",

    // Inspection sections
    "inspection.section.ast": "Job Safety Analysis (AST)",
    "inspection.section.ppe": "PPE (Personal Protective Equipment)",
    "inspection.section.housekeeping": "Site Housekeeping",
    "inspection.section.fire": "Fire Protection",
    "inspection.section.scaffolding": "Scaffolding, Ladders, Step Ladders",
    "inspection.section.heights": "Working at Heights",
    "inspection.section.water": "Work on or Near Water",
    "inspection.section.lifting": "Lifting Equipment",
    "inspection.section.excavation": "Excavation and Trenches",
    "inspection.section.environment": "Environment",
    "inspection.section.misc": "Miscellaneous (Varia)",

    // Inspection items - AST
    "inspection.item.ast-1": "AST completed before work begins",
    "inspection.item.ast-2": "Workers briefed on hazards identified",
    "inspection.item.ast-3": "Control measures implemented",
    "inspection.item.ast-4": "AST reviewed when conditions change",

    // Inspection items - PPE
    "inspection.item.ppe-1": "Hard hats worn in designated areas",
    "inspection.item.ppe-2": "Safety glasses/goggles worn when required",
    "inspection.item.ppe-3": "High visibility vests worn",
    "inspection.item.ppe-4": "Safety footwear worn",
    "inspection.item.ppe-5": "Hearing protection used when required",
    "inspection.item.ppe-6": "Gloves appropriate for task worn",

    // Inspection items - Housekeeping
    "inspection.item.hk-1": "Work areas clean and organized",
    "inspection.item.hk-2": "Walkways and exits clear",
    "inspection.item.hk-3": "Materials properly stored",
    "inspection.item.hk-4": "Waste disposed of properly",
    "inspection.item.hk-5": "Spills cleaned up immediately",

    // Inspection items - Fire Safety
    "inspection.item.fire-1": "Fire extinguishers accessible and inspected",
    "inspection.item.fire-2": "Hot work permits in place",
    "inspection.item.fire-3": "Flammable materials stored properly",
    "inspection.item.fire-4": "Fire watch posted when required",

    // Inspection items - Scaffolding
    "inspection.item.sc-1": "Scaffolding inspected before use",
    "inspection.item.sc-2": "Guard rails in place",
    "inspection.item.sc-3": "Ladders secured and in good condition",
    "inspection.item.sc-4": "Proper access provided",
    "inspection.item.sc-5": "Tag system in use",

    // Inspection items - Heights
    "inspection.item.ht-1": "Fall protection used above 1.8m/6ft",
    "inspection.item.ht-2": "Anchor points adequate",
    "inspection.item.ht-3": "Harnesses inspected",
    "inspection.item.ht-4": "Openings protected",

    // Inspection items - Water Safety
    "inspection.item.wt-1": "Life jackets available when required",
    "inspection.item.wt-2": "Rescue equipment in place",
    "inspection.item.wt-3": "Barriers in place near water",

    // Inspection items - Electrical
    "inspection.item.elec-1": "Electrical equipment properly grounded",
    "inspection.item.elec-2": "GFI protection in use",
    "inspection.item.elec-3": "Electrical cords in good condition",
    "inspection.item.elec-4": "Lockout/tagout procedures followed",

    // Common actions
    "action.yes": "Yes",
    "action.no": "No",
    "action.back": "Back",
    "action.next": "Next",
    "action.close": "Close",
    "action.edit": "Edit",
    "action.view": "View",
    "action.download": "Download",
    "action.remove": "Remove",
    "action.sync": "Sync",
    "action.saving": "Saving...",
    "action.search": "Search",
    "action.filter": "Filter",
    "action.new": "New",

    // Fields
    "field.type": "Type",
    "field.location": "Location",
    "field.photos": "Photos",
    "field.eventDate": "Event Date",
    "field.injuries": "Injuries",
    "field.date": "Date",

    // Empty states
    "empty.noObservations": "No observations yet",
    "empty.noInspections": "No inspections yet",
    "empty.createFirst": "Create the first observation to get started",
    "empty.adjustFilters": "Try adjusting your search or filters",
    "empty.noMatchingInspections": "No matching inspections",

    // List views
    "list.countOf": "{filtered} of {total} {type}",
    "list.observation": "observation",
    "list.observations": "observations",
    "list.inspection": "inspection",
    "list.inspections": "inspections",

    // Confirm dialogs
    "confirm.deleteObservation": "Delete this observation?",
    "confirm.deleteInspection": "Delete this inspection?",

    // Observation form labels
    "observation.concernedCompanyLabel": "Concerned Company/Contractor",
    "observation.concernedCompanyPlaceholder": "Company responsible for the area",
    "observation.referenceArticleLabel": "Reference Article/Standard",
    "observation.referenceArticlePlaceholder": "Relevant regulation or safety standard",
    "observation.descriptionPlaceholder": "Detailed description of the observation",

    // Time
    "time.today": "Today",
    "time.yesterday": "Yesterday",
    "time.daysAgo": "{days} days ago",

    // Sync banner
    "status.pendingChanges": "{count} changes pending",
    "status.syncNow": "Tap to sync your changes now",
    "status.localSaveInfo": "Your changes are saved locally and will sync when you reconnect",

    // Inspection (new form)
    "inspection.progress": "Inspection Progress",
    "inspection.unanswered": "Unanswered",
    "inspection.info": "Inspection Information",
    "inspection.titleLabel": "Inspection Title",
    "inspection.titlePlaceholder": "e.g., Weekly Safety Inspection - Building A",
    "inspection.typeLabel": "Inspection Type",
    "inspection.selectType": "Select type...",
    "inspection.type.safety": "Safety Inspection",
    "inspection.type.compliance": "Compliance Check",
    "inspection.type.incidentFollowUp": "Incident Follow-up",
    "inspection.type.routine": "Routine Check",
    "inspection.projectSelect": "Select project...",
    "inspection.descriptionNotes": "Description/Notes",
    "inspection.itemsChecked": "{checked}/{total} items checked",
    "inspection.commentPlaceholder": "Add corrective action or notes...",

    // Errors & alerts
    "error.titleRequired": "Title is required",
    "error.inspectionTypeRequired": "Inspection type is required",
    "error.projectRequired": "Project is required",
    "error.minimumCompletion": "At least 50% of items must be checked",
    "error.incidentTitleRequired": "Incident title is required",
    "error.locationRequired": "Location is required",
    "error.eventDateRequired": "Event date is required",
    "error.eventTimeRequired": "Event time is required",
    "error.accidentTypeRequired": "Accident type is required",
    "error.descriptionRequired": "Incident description is required",
    "error.injuryTypeRequired": "Injury type is required when medical treatment is reported",
    "error.bodyPartRequired": "Body part is required when medical treatment is reported",
    "error.dateOfDeathRequired": "Date of death is required",
    "error.returnToWorkDateRequired": "Return to work date is required when days absent > 0",
    // Generic alerts
    "alert.completeBeforeSubmit": "Please complete the form before submitting",
    "alert.saveSuccess.inspection": "Inspection saved successfully!",
    "alert.saveError.inspection": "Error saving inspection. Please try again.",
    "alert.saveSuccess.observation": "Observation saved successfully!",
    "alert.saveError.observation": "Error saving observation. Please try again.",
    "alert.requiredFields": "Please fill in all required fields",
    "alert.saveSuccess.incident": "Incident submitted successfully and saved locally",
    "alert.saveError.incident": "Failed to submit incident",
    "alert.saveDraft.error": "Failed to save draft",
    "alert.fixErrors": "Please fix the errors in the form",

    // Buttons
    "action.saveInspection": "Save Inspection ({percent}% Complete)",
    "inspection.issuesCount": "{count} issues",

    // Incident form placeholders
    "incident.titlePlaceholder": "Brief title or summary of the incident",
    "incident.selectProject": "Select project",
    "incident.locationPlaceholder": "e.g., North Building Site, Basement Level 2",
    "incident.selectAccidentType": "Select accident type",
    "incident.concernedCompanyPlaceholder": "e.g., ABC Construction Co.",
    "incident.whatHappened": "What happened?",
    "incident.whatHappenedDesc": "Provide a detailed account of the incident. Include who was involved, their roles, what they were doing, what equipment or materials were being used, weather conditions, and any other relevant circumstances.",
    "incident.descriptionPlaceholder": "Be as detailed as possible. This information is crucial for investigation and prevention of future incidents.",
    "incident.dangerDesc": "What hazard, danger, or unsafe condition allowed this incident to occur?",
    "incident.dangerPlaceholder": "e.g., Slippery floor due to spilled water, Missing guardrail, Inadequate lighting",
    "incident.contributingConditionDesc": "What environmental, equipment, or workplace conditions contributed?",
    "incident.contributingConditionPlaceholder": "e.g., Worn equipment, Poor visibility, Crowded work area, Lack of maintenance",
    "incident.contributingBehaviorDesc": "What actions, decisions, or behaviors contributed to the incident?",
    "incident.contributingBehaviorPlaceholder": "e.g., Worker not wearing PPE, Taking unsafe shortcut, Rushing due to time pressure",
    "incident.selectInjuryType": "Select injury type",
    "incident.selectBodyPart": "Select body part",
    "incident.selectInjuryTypeDesc": "Select the type of injury sustained",
    "incident.selectBodyPartDesc": "Which body part was injured?",
    "incident.critical": "Critical",
    "incident.severity": "Severity",
    "incident.unknown": "Unknown",
    "incident.medicalTreatmentDesc": "Complete this section only if medical treatment was required",
    "incident.medicalTreatmentLabel": "Medical treatment was required",
    "incident.medicalTreatmentInfo": "Check this if the injured person received any medical care or attention",
    "incident.investigationDesc": "Analyze the root causes and contributing factors to this incident",
    "incident.daysAbsentDesc": "Number of work days missed due to injury (0 = no time lost)",
    "incident.restrictedDaysDesc": "Number of days on restricted/modified duty",
    "incident.returnDateDesc": "When did the worker return to full duty?",
    "incident.hospitalizedDesc": "Admitted to hospital overnight or longer",
    "incident.treatmentProviderDesc": "Name of the healthcare provider",
    "incident.treatmentCenterDesc": "Healthcare facility name and address",
    "incident.dateOfDeathDesc": "Date when the worker passed away",
    "incident.attachmentsDesc": "Add photos, documents, or other supporting evidence (optional)",

    // Authentication
    "login": "Login",
    "loginTitle": "Sign in to your account",
    "loginError": "Login failed. Please try again.",
    "invalidCredentials": "Invalid email or password",
    "enterEmailPassword": "Enter your email and password to continue",
    "email": "Email",
    "emailPlaceholder": "your@email.com",
    "password": "Password",
    "passwordPlaceholder": "••••••••",
    "loggingIn": "Logging in...",
    "logout": "Logout",
    "demoCredentials": "Demo Credentials",
    "demoCredentialsDescription": "Try these accounts to explore the application",
    "currentUser": "Logged in as {name}",

    // User Management
    "userManagement": "User Management",
    "manageUsersDescription": "Add, edit, and manage application users",
    "addUser": "Add User",
    "addNewUser": "Add New User",
    "createUserForAccess": "Create a new user account to grant application access",
    "name": "Name",
    "userNamePlaceholder": "John Doe",
    "role": "Role",
    "admin": "Admin",
    "supervisor": "Supervisor",
    "worker": "Worker",
    "createdAt": "Created",
    "actions": "Actions",
    "allUsers": "All Users",
    "totalUsers": "{count} users total",
    "noUsersYet": "No users created yet",
    "createUser": "Create User",
    "emailAlreadyExists": "Email already exists",
    "allFieldsRequired": "All fields are required",
    "failedToAddUser": "Failed to add user",
    "supervisorsCanOnlyCreateWorkers": "Supervisors can only create worker accounts",
    "cancel": "Cancel",

    // Group Management
    "groupManagement": "Group Management",
    "manageGroupsDescription": "Create and manage user groups for form assignments",
    "addGroup": "Add Group",
    "createNewGroup": "Create New Group",
    "addMembersToGroup": "Create a group and add members",
    "groupName": "Group Name",
    "groupNamePlaceholder": "e.g., North Site Team",
    "description": "Description",
    "groupDescriptionPlaceholder": "e.g., Workers assigned to the north building site",
    "members": "Members",
    "noUsersAvailable": "No users available",
    "createGroup": "Create Group",
    "groupNameRequired": "Group name is required",
    "failedToAddGroup": "Failed to add group",
    "allGroups": "All Groups",
    "noGroupsYet": "No groups created yet",
    "noMembers": "No members in this group",
    "accessDenied": "Access denied. Admin privileges required.",
    
    // Distribution/Assignment
    "assignUsers": "Assign Users",
    "assignGroups": "Assign Groups",
    "selectUser": "Select a user...",
    "selectGroup": "Select a group...",
    "emailNotifications": "Email Notifications",
    "sendEmailNotifications": "Send email notifications to assigned users",
    "notifyUsers": "Notify assigned users",
  },
  fr: {
    // Navigation
    "nav.dashboard": "Tableau de bord",
    "nav.siteForms": "Formulaires de chantier",
    "nav.inspections": "Inspections",
    "nav.observations": "Observations",
    "nav.incidents": "Incidents",
    "nav.settings": "Paramètres",

    // Dashboard
    "dashboard.title": "INTERLAG",
    "dashboard.subtitle": "Gérer les inspections, observations et incidents",
    "dashboard.newInspection": "Nouvelle inspection",
    "dashboard.newObservation": "Nouvelle observation",
    "dashboard.newIncident": "Nouvel incident",
    "dashboard.recentDrafts": "Brouillons récents",
    "dashboard.recentSubmissions": "Soumissions récentes",
    "dashboard.viewAll": "Voir tout",
    "dashboard.noDrafts": "Aucun brouillon",
    "dashboard.noSubmissions": "Aucune soumission",

    // Status
    "status.online": "En ligne",
    "status.offline": "Hors ligne",
    "status.syncing": "Synchronisation...",
    "status.savedLocally": "Sauvegardé localement",
    "status.syncedSuccessfully": "Synchronisé avec succès",
    "status.draft": "Brouillon",
    "status.submitted": "Soumis",
    "status.open": "Ouvert",
    "status.closed": "Fermé",
    "status.inProgress": "En Progression",
    "status.archived": "Archivé",

    // Form common
    "form.save": "Enregistrer",
    "form.saving": "Enregistrement...",
    "form.saveDraft": "Enregistrer le brouillon",
    "form.submit": "Soumettre",
    "form.cancel": "Annuler",
    "form.delete": "Supprimer",
    "form.edit": "Modifier",
    "form.required": "Obligatoire",
    "form.attachments": "Pièces jointes",
    "form.addAttachment": "Ajouter une pièce jointe",
    "form.comments": "Commentaires",
    "form.description": "Description",
    "form.title": "Titre",
    "form.project": "Projet",
    "form.createdBy": "Créé par",
    "form.distribution": "Distribution",
    "form.closedBy": "Fermé par",
    "form.status": "Statut",
    "form.priority": "Priorité",
    "form.exportPdf": "Exporter PDF",
    "form.formStatus": "Statut du formulaire",
    "form.formStatusDescription": "Ce formulaire sera enregistré localement dans IndexedDB. Lorsque vous le soumettez, il sera marqué comme étant en attente de synchronisation. Une fois la connectivité en ligne restaurée, il se synchronisera automatiquement avec le serveur.",
    "section.details": "Détails",

    // Generic
    "common.updated": "Mis à jour {distance}",
    "units.days": "{count} jours",

    // Not found
    "empty.notFound.observation": "Observation introuvable",
    "empty.notFound.inspection": "Inspection introuvable",
    "empty.notFound.incident": "Incident introuvable",

    // Settings
    "settings.syncStatus": "Statut de synchronisation",
    "settings.syncStatus.desc": "Surveillez l'état de synchronisation des données",
    "settings.totalForms": "Formulaires au total",
    "settings.pendingSync": "Synchronisation en attente",
    "settings.language": "Langue",
    "settings.language.desc": "Choisissez votre langue préférée pour l'application",
    "settings.applicationLanguage": "Langue de l'application",
    "settings.notifications": "Notifications",
    "settings.notifications.desc": "Configurer la réception des mises à jour",
    "settings.pushNotifications": "Notifications push",
    "settings.pushNotifications.desc": "Recevoir des alertes pour les nouvelles tâches",
    "settings.syncAlerts": "Alertes de synchronisation",
    "settings.syncAlerts.desc": "Être notifié lorsque la synchronisation est terminée",
    "settings.appearance": "Apparence",
    "settings.appearance.desc": "Personnaliser l'apparence visuelle",
    "settings.theme": "Thème",
    "settings.theme.desc": "Choisir le mode clair ou sombre",
    "settings.theme.light": "Clair",
    "settings.theme.dark": "Sombre",
    "settings.theme.system": "Système",
    "sync.allChangesSynced": "Tous les changements sont synchronisés",
    "sync.pendingChanges": "{count} changements en attente",
    "sync.lastSynced": "Dernière synchronisation {time}",
    "sync.syncNow": "Synchroniser maintenant",
    "sync.syncing": "Synchronisation en cours...",

    // Priority levels
    "priority.low": "Faible",
    "priority.medium": "Moyen",
    "priority.high": "Élevé",
    "priority.critical": "Critique",

    // Observation form
    "observation.title": "Formulaire d'observation",
    "observation.basicInfo": "Informations de base",
    "observation.number": "Numéro d'observation",
    "observation.projectNumber": "Numéro de projet",
    "observation.type": "Type d'observation",
    "observation.assignedPerson": "Personne assignée",
    "observation.dueDate": "Date d'échéance de l'action corrective",
    "observation.completionDate": "Date de complétion de la correction",
    "observation.concernedCompany": "Entreprise concernée",
    "observation.referenceArticle": "Article de référence (CRTC)",
    "observation.safetyAnalysis": "Analyse de sécurité",
    "observation.danger": "Danger",
    "observation.contributingCondition": "Condition contributive",
    "observation.contributingBehavior": "Comportement contributif",

    // Observation types
    "observation.type.unsafe-condition": "Condition dangereuse",
    "observation.type.unsafe-behavior": "Comportement dangereux",
    "observation.type.near-miss": "Quasi-accident",
    "observation.type.good-practice": "Bonne pratique",
    "observation.type.hazard-awareness": "Sensibilisation aux dangers",
    "observation.type.ppe-non-compliance": "Non-conformité ÉPI",
    "observation.type.housekeeping": "Problème d'entretien",
    "observation.type.tool-equipment": "Problème d'outil/équipement",

    // Incident form
    "incident.title": "Formulaire d'incident",
    "incident.basicInfo": "Informations de base",
    "incident.eventDetails": "Détails de l'événement",
    "incident.number": "Numéro d'incident",
    "incident.titlePlaceholder": "Résumé de l'incident",
    "incident.location": "Emplacement",
    "incident.locationPlaceholder": "ex. Chantier de rénovation, sous-sol niveau 2",
    "incident.eventDate": "Date de l'événement",
    "incident.eventTime": "Heure de l'événement",
    "incident.accidentType": "Type d'accident",
    "incident.selectAccidentType": "Sélectionner le type d'accident",
    "incident.critical": "CRITIQUE",
    "incident.concernedCompanyPlaceholder": "Entreprise responsable",
    "incident.whatHappened": "Ce qui s'est passé",
    "incident.whatHappenedDesc": "Fournissez un compte rendu détaillé de l'incident. Inclure qui était impliqué, leurs rôles, ce qu'ils faisaient, quel équipement ou matériaux étaient utilisés, la météo, les conditions et d'autres circonstances pertinentes.",
    "incident.descriptionPlaceholder": "Soyez aussi détaillé que possible. Ces informations sont cruciales pour l'enquête et la prévention des incidents futurs.",
    "incident.investigation": "Enquête",
    "incident.investigationDescription": "Analysez les causes profondes et les facteurs contributifs de cet incident",
    "incident.dangerDesc": "Quel est le danger, la condition dangereuse ou l'événement qui a permis à cet incident de se produire?",
    "incident.dangerPlaceholder": "ex. Plancher glissant due à de l'eau renversée, Garde-fou manquant, Éclairage inadéquat",
    "incident.contributingConditionDesc": "Quelles conditions environnementales, équipements ou conditions de travail ont contribué?",
    "incident.contributingConditionPlaceholder": "ex. Équipement usé, Mauvaise visibilité, Zone de travail surpeuplée, Manque d'entretien",
    "incident.contributingBehaviorDesc": "Quel comportement a contribué?",
    "incident.contributingBehaviorPlaceholder": "ex. Non-respect des procédures, Négligence des EPI, Travail en hâte",
    "incident.medicalTreatment": "Traitement médical",
    "incident.withMedicalTreatment": "Cet incident comprend un traitement médical",
    "incident.injuryType": "Type de blessure",
    "incident.bodyPart": "Partie du corps affectée",
    "incident.emergencyTreatment": "Traité aux urgences",
    "incident.emergencyTreatmentDesc": "Premiers soins ou services d'urgence fournis",
    "incident.hospitalizedOvernight": "Hospitalisé jusqu'au lendemain",
    "incident.hospitalized": "Incident hospitalisé",
    "incident.daysAbsent": "Jours d'absence du travail",
    "incident.restrictedWorkDays": "Nombre de jours en travail restreint",
    "incident.returnToWorkDate": "Date de retour au travail",
    "incident.treatmentProvider": "Fournisseur de traitement",
    "incident.treatmentCenter": "Centre de traitement & adresse",
    "incident.fatal": "Cet incident est décédé",
    "incident.dateOfDeath": "Date de décès",
    "incident.criticalAlert": "Ceci est un type d'incident CRITIQUE. Assurez-vous que tous les champs obligatoires sont complétés avec précision. La gestion sera notifiée immédiatement.",

    // Inspection form
    "inspection.title": "Formulaire d'inspection",
    "inspection.createdLabel": "Créé le",
    "inspection.documentTitle": "Titre du document",
    "inspection.number": "Numéro d'inspection",
    "inspection.type": "Type",
    "inspection.closedBy": "Fermé par",
    "inspection.summary": "Résumé de l'inspection",
    "inspection.articlesInspected": "Articles inspectés",
    "inspection.conforming": "Conforme",
    "inspection.nonConforming": "Non-conforme",
    "inspection.notApplicable": "S.O.",
    "inspection.unanswered": "Sans réponse",
    "inspection.sections": "Sections d'inspection",
    "inspection.instruction": "Si non applicable, sélectionnez S.O. pour chaque élément",
    "inspection.progress": "Progrès de l'inspection",
    "inspection.info": "Informations d'inspection",
    "inspection.titleLabel": "Titre de l'inspection",
    "inspection.titlePlaceholder": "ex. Inspection de sécurité hebdomadaire - Bâtiment A",
    "inspection.typeLabel": "Type d'inspection",
    "inspection.selectType": "Sélectionner le type...",
    "inspection.type.safety": "Inspection de sécurité",
    "inspection.type.compliance": "Vérification de conformité",
    "inspection.type.incidentFollowUp": "Suivi d'incident",
    "inspection.type.routine": "Vérification de routine",
    "inspection.projectSelect": "Sélectionner le projet...",
    "inspection.descriptionNotes": "Description/Notes",
    "inspection.itemsChecked": "{checked}/{total} éléments vérifiés",
    "inspection.addComment": "Ajouter une action corrective ou des notes...",

    // Inspection sections
    "inspection.section.ast": "Analyse de sécurité des tâches (AST)",
    "inspection.section.ppe": "ÉPI (Équipement de Protection Individuelle)",
    "inspection.section.housekeeping": "Entretien du site",
    "inspection.section.fire": "Protection incendie",
    "inspection.section.scaffolding": "Échafaudages, Échelles, Escabeaux",
    "inspection.section.heights": "Travail en hauteur",
    "inspection.section.water": "Travail sur ou près de l'eau",
    "inspection.section.lifting": "Équipement de levage",
    "inspection.section.excavation": "Excavation et tranchées",
    "inspection.section.environment": "Environnement",
    "inspection.section.misc": "Divers (Varia)",

    // Inspection items - AST
    "inspection.item.ast-1": "AST complété avant le début des travaux",
    "inspection.item.ast-2": "Travailleurs informés des dangers identifiés",
    "inspection.item.ast-3": "Mesures de contrôle mises en œuvre",
    "inspection.item.ast-4": "AST révisé lorsque les conditions changent",

    // Inspection items - PPE
    "inspection.item.ppe-1": "Casques de sécurité portés dans les zones désignées",
    "inspection.item.ppe-2": "Lunettes de sécurité/lunettes de protection portées au besoin",
    "inspection.item.ppe-3": "Gilets de haute visibilité portés",
    "inspection.item.ppe-4": "Chaussures de sécurité portées",
    "inspection.item.ppe-5": "Protection auditive utilisée au besoin",
    "inspection.item.ppe-6": "Gants appropriés pour la tâche portés",

    // Inspection items - Housekeeping
    "inspection.item.hk-1": "Zones de travail propres et organisées",
    "inspection.item.hk-2": "Allées et sorties dégagées",
    "inspection.item.hk-3": "Matériaux correctement entreposés",
    "inspection.item.hk-4": "Déchets éliminés correctement",
    "inspection.item.hk-5": "Déversements nettoyés immédiatement",

    // Inspection items - Fire Safety
    "inspection.item.fire-1": "Extincteurs accessibles et inspectés",
    "inspection.item.fire-2": "Permis de travaux à chaud en place",
    "inspection.item.fire-3": "Matériaux inflammables entreposés correctement",
    "inspection.item.fire-4": "Surveillance incendie postée au besoin",

    // Inspection items - Scaffolding
    "inspection.item.sc-1": "Échafaudages inspectés avant utilisation",
    "inspection.item.sc-2": "Garde-corps en place",
    "inspection.item.sc-3": "Échelles sécurisées et en bon état",
    "inspection.item.sc-4": "Accès approprié fourni",
    "inspection.item.sc-5": "Système d'étiquetage en utilisation",

    // Inspection items - Heights
    "inspection.item.ht-1": "Protection contre les chutes utilisée au-dessus de 1,8 m/6 pi",
    "inspection.item.ht-2": "Points d'ancrage adéquats",
    "inspection.item.ht-3": "Harnais inspectés",
    "inspection.item.ht-4": "Ouvertures protégées",

    // Inspection items - Water Safety
    "inspection.item.wt-1": "Gilets de sauvetage disponibles au besoin",
    "inspection.item.wt-2": "Équipement de sauvetage en place",
    "inspection.item.wt-3": "Barrières en place près de l'eau",

    // Inspection items - Electrical
    "inspection.item.elec-1": "Équipement électrique correctement mis à la terre",
    "inspection.item.elec-2": "Protection DDFT en utilisation",
    "inspection.item.elec-3": "Câbles électriques en bon état",
    "inspection.item.elec-4": "Procédures de verrouillage/étiquetage suivies",

    // Common actions
    "action.yes": "Oui",
    "action.no": "Non",
    "action.back": "Retour",
    "action.next": "Suivant",
    "action.close": "Fermer",
    "action.edit": "Modifier",
    "action.view": "Voir",
    "action.download": "Télécharger",
    "action.remove": "Supprimer",
    "action.sync": "Synchroniser",
    "action.saving": "Enregistrement...",
    "action.search": "Rechercher",
    "action.filter": "Filtrer",
    "action.new": "Nouveau",

    // Fields
    "field.type": "Type",
    "field.location": "Emplacement",
    "field.photos": "Photos",
    "field.eventDate": "Date de l'événement",
    "field.injuries": "Blessures",
    "field.date": "Date",

    // Empty states
    "empty.noObservations": "Aucune observation",
    "empty.noInspections": "Aucune inspection",
    "empty.createFirst": "Créez la première observation pour commencer",
    "empty.adjustFilters": "Essayez d'ajuster votre recherche ou vos filtres",
    "empty.noMatchingInspections": "Aucune inspection correspondante",
    "empty.noIncidents": "Aucun incident enregistré",
    "empty.reportIncidents": "Signalez les incidents pour suivre et enquêter sur les événements de sécurité",

    // List views
    "list.countOf": "{filtered} sur {total} {type}",
    "list.observation": "observation",
    "list.observations": "observations",
    "list.inspection": "inspection",
    "list.inspections": "inspections",

    // Confirm dialogs
    "confirm.deleteObservation": "Supprimer cette observation ?",
    "confirm.deleteInspection": "Supprimer cette inspection ?",

    // Observation form labels
    "observation.concernedCompanyLabel": "Entreprise/Entrepreneur concerné",
    "observation.concernedCompanyPlaceholder": "Entreprise responsable de la zone",
    "observation.referenceArticleLabel": "Article de référence/Norme",
    "observation.referenceArticlePlaceholder": "Règlement ou norme de sécurité pertinent",
    "observation.descriptionPlaceholder": "Description détaillée de l'observation",

    // Time
    "time.today": "Aujourd'hui",
    "time.yesterday": "Hier",
    "time.daysAgo": "Il y a {days} jours",

    // Sync banner
    "status.pendingChanges": "{count} modifications en attente",
    "status.syncNow": "Appuyez pour synchroniser vos changements maintenant",
    "status.localSaveInfo": "Vos changements sont enregistrés localement et seront synchronisés lors de la reconnexion",

    // Inspection (new form)
    "inspection.progress": "Progression de l'inspection",
    "inspection.unanswered": "Non répondu",
    "inspection.info": "Informations d'inspection",
    "inspection.titleLabel": "Titre de l'inspection",
    "inspection.titlePlaceholder": "p. ex., Inspection hebdomadaire - Bâtiment A",
    "inspection.typeLabel": "Type d'inspection",
    "inspection.selectType": "Sélectionner un type...",
    "inspection.type.safety": "Inspection de sécurité",
    "inspection.type.compliance": "Vérification de conformité",
    "inspection.type.incidentFollowUp": "Suivi d'incident",
    "inspection.type.routine": "Contrôle routinier",
    "inspection.projectSelect": "Sélectionner un projet...",
    "inspection.descriptionNotes": "Description/Notes",
    "inspection.itemsChecked": "{checked}/{total} éléments cochés",
    "inspection.commentPlaceholder": "Ajouter une action corrective ou des notes...",

    // Errors & alerts
    "error.titleRequired": "Le titre est obligatoire",
    "error.inspectionTypeRequired": "Le type d'inspection est obligatoire",
    "error.projectRequired": "Le projet est obligatoire",
    "error.minimumCompletion": "Au moins 50% des éléments doivent être cochés",
    "error.incidentTitleRequired": "Le titre de l'incident est obligatoire",
    "error.locationRequired": "L'emplacement est obligatoire",
    "error.eventDateRequired": "La date de l'événement est obligatoire",
    "error.eventTimeRequired": "L'heure de l'événement est obligatoire",
    "error.accidentTypeRequired": "Le type d'accident est obligatoire",
    "error.descriptionRequired": "La description de l'incident est obligatoire",
    "error.injuryTypeRequired": "Le type de blessure est requis lorsque le traitement médical est signalé",
    "error.bodyPartRequired": "La partie du corps est requise lorsque le traitement médical est signalé",
    "error.dateOfDeathRequired": "La date de décès est obligatoire",
    "error.returnToWorkDateRequired": "La date de retour au travail est requise lorsque jours d'absence > 0",
    // Generic alerts
    "alert.completeBeforeSubmit": "Veuillez compléter le formulaire avant de soumettre",
    "alert.saveSuccess.inspection": "Inspection enregistrée avec succès !",
    "alert.saveError.inspection": "Erreur lors de l'enregistrement de l'inspection. Veuillez réessayer.",
    "alert.saveSuccess.observation": "Observation enregistrée avec succès !",
    "alert.saveError.observation": "Erreur lors de l'enregistrement de l'observation. Veuillez réessayer.",
    "alert.requiredFields": "Veuillez remplir tous les champs obligatoires",
    "alert.saveSuccess.incident": "Incident soumis avec succès et enregistré localement",
    "alert.saveError.incident": "Échec de la soumission de l'incident",
    "alert.saveDraft.error": "Échec de l'enregistrement du brouillon",
    "alert.fixErrors": "Veuillez corriger les erreurs dans le formulaire",

    // Buttons
    "action.saveInspection": "Enregistrer l'inspection ({percent}% complété)",
    "inspection.issuesCount": "{count} problèmes",

    // Incident form placeholders
    "incident.titlePlaceholder": "Bref titre ou résumé de l'incident",
    "incident.selectProject": "Sélectionner un projet",
    "incident.locationPlaceholder": "p. ex., Chantier du bâtiment Nord, Sous-sol niveau 2",
    "incident.selectAccidentType": "Sélectionner le type d'accident",
    "incident.concernedCompanyPlaceholder": "p. ex., ABC Construction Co.",
    "incident.whatHappened": "Que s'est-il passé ?",
    "incident.whatHappenedDesc": "Fournir un compte rendu détaillé de l'incident. Inclure qui était impliqué, leurs rôles, ce qu'ils faisaient, quel équipement ou matériaux étaient utilisés, les conditions météorologiques et toute autre circonstance pertinente.",
    "incident.descriptionPlaceholder": "Soyez aussi détaillé que possible. Cette information est cruciale pour l'enquête et la prévention d'incidents futurs.",
    "incident.dangerDesc": "Quel danger, risque ou condition dangereuse a permis à cet incident de se produire ?",
    "incident.dangerPlaceholder": "p. ex., Sol glissant dû à un déversement d'eau, Garde-corps manquant, Éclairage inadéquat",
    "incident.contributingConditionDesc": "Quelles conditions environnementales, d'équipement ou de lieu de travail ont contribué ?",
    "incident.contributingConditionPlaceholder": "p. ex., Équipement usé, Mauvaise visibilité, Zone de travail encombrée, Manque d'entretien",
    "incident.contributingBehaviorDesc": "Quelles actions, décisions ou comportements ont contribué à l'incident ?",
    "incident.contributingBehaviorPlaceholder": "p. ex., Travailleur ne portant pas d'ÉPI, Prise de raccourci dangereux, Précipitation due à la pression temporelle",
    "incident.selectInjuryType": "Sélectionner le type de blessure",
    "incident.selectBodyPart": "Sélectionner la partie du corps",
    "incident.selectInjuryTypeDesc": "Sélectionner le type de blessure subie",
    "incident.selectBodyPartDesc": "Quelle partie du corps a été blessée ?",
    "incident.critical": "Critique",
    "incident.severity": "Sévérité",
    "incident.unknown": "Inconnu",
    "incident.medicalTreatmentDesc": "Compléter cette section uniquement si un traitement médical était requis",
    "incident.medicalTreatmentLabel": "Un traitement médical était requis",
    "incident.medicalTreatmentInfo": "Cochez ceci si la personne blessée a reçu des soins ou une attention médicale",
    "incident.investigationDesc": "Analyser les causes profondes et les facteurs contributifs de cet incident",
    "incident.daysAbsentDesc": "Nombre de jours de travail manqués en raison de la blessure (0 = aucun temps perdu)",
    "incident.restrictedDaysDesc": "Nombre de jours en service restreint/modifié",
    "incident.returnDateDesc": "Quand le travailleur est-il revenu en service complet ?",
    "incident.hospitalizedDesc": "Admis à l'hôpital pendant la nuit ou plus longtemps",
    "incident.treatmentProviderDesc": "Nom du fournisseur de soins de santé",
    "incident.treatmentCenterDesc": "Nom et adresse de l'établissement de santé",
    "incident.dateOfDeathDesc": "Date du décès du travailleur",
    "incident.attachmentsDesc": "Ajouter des photos, documents ou autres preuves (optionnel)",

    // Authentication (French)
    "login": "Connexion",
    "loginTitle": "Connectez-vous à votre compte",
    "loginError": "La connexion a échoué. Veuillez réessayer.",
    "invalidCredentials": "Email ou mot de passe invalide",
    "enterEmailPassword": "Entrez votre email et mot de passe pour continuer",
    "email": "Email",
    "emailPlaceholder": "votre@email.com",
    "password": "Mot de passe",
    "passwordPlaceholder": "••••••••",
    "loggingIn": "Connexion en cours...",
    "logout": "Déconnexion",
    "demoCredentials": "Identifiants de démonstration",
    "demoCredentialsDescription": "Essayez ces comptes pour explorer l'application",
    "currentUser": "Connecté en tant que {name}",

    // User Management (French)
    "userManagement": "Gestion des utilisateurs",
    "manageUsersDescription": "Ajouter, modifier et gérer les utilisateurs de l'application",
    "addUser": "Ajouter un utilisateur",
    "addNewUser": "Ajouter un nouvel utilisateur",
    "createUserForAccess": "Créer un nouveau compte utilisateur pour accorder l'accès à l'application",
    "name": "Nom",
    "userNamePlaceholder": "Jean Dupont",
    "role": "Rôle",
    "admin": "Administrateur",
    "supervisor": "Superviseur",
    "worker": "Ouvrier",
    "createdAt": "Créé",
    "actions": "Actions",
    "allUsers": "Tous les utilisateurs",
    "totalUsers": "{count} utilisateurs au total",
    "noUsersYet": "Aucun utilisateur créé",
    "createUser": "Créer un utilisateur",
    "emailAlreadyExists": "Email existe déjà",
    "allFieldsRequired": "Tous les champs sont obligatoires",
    "failedToAddUser": "Impossible d'ajouter l'utilisateur",
    "supervisorsCanOnlyCreateWorkers": "Les superviseurs ne peuvent créer que des comptes ouvriers",
    "cancel": "Annuler",

    // Group Management (French)
    "groupManagement": "Gestion des groupes",
    "manageGroupsDescription": "Créer et gérer les groupes d'utilisateurs pour l'assignation de formulaires",
    "addGroup": "Ajouter un groupe",
    "createNewGroup": "Créer un nouveau groupe",
    "addMembersToGroup": "Créer un groupe et ajouter des membres",
    "groupName": "Nom du groupe",
    "groupNamePlaceholder": "p. ex., Équipe du site nord",
    "description": "Description",
    "groupDescriptionPlaceholder": "p. ex., Ouvriers assignés au chantier du bâtiment nord",
    "members": "Membres",
    "noUsersAvailable": "Aucun utilisateur disponible",
    "createGroup": "Créer un groupe",
    "groupNameRequired": "Le nom du groupe est obligatoire",
    "failedToAddGroup": "Impossible d'ajouter le groupe",
    "allGroups": "Tous les groupes",
    "noGroupsYet": "Aucun groupe créé",
    "noMembers": "Aucun membre dans ce groupe",
    "accessDenied": "Accès refusé. Privilèges administrateur requis.",
    
    // Distribution/Assignment (French)
    "assignUsers": "Assigner des utilisateurs",
    "assignGroups": "Assigner des groupes",
    "selectUser": "Sélectionner un utilisateur...",
    "selectGroup": "Sélectionner un groupe...",
    "emailNotifications": "Notifications par courriel",
    "sendEmailNotifications": "Envoyer des notifications par courriel aux utilisateurs assignés",
    "notifyUsers": "Notifier les utilisateurs assignés",
  },
} as const

type Locale = "en" | "fr"
type TranslationKey = keyof typeof translations.en

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("locale")
      if (stored === "en" || stored === "fr") return stored
    }
    return "fr"
  })

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      let text: string = translations[locale][key] || translations.en[key] || key

      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          text = text.replace(`{${paramKey}}`, String(value))
        })
      }

      return text
    },
    [locale],
  )

  // Persist locale and set document language
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("locale", locale)
        document.documentElement.lang = locale
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [locale])

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider")
  }
  return context
}
