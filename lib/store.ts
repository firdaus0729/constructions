"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { 
  Observation, 
  Incident, 
  Inspection, 
  FormListItem, 
  Project, 
  User, 
  InspectionSection,
  AuthUser,
  UserGroup,
  FormAssignment
} from "./types"

// Create a custom storage that checks for window availability
const customStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null
    const value = localStorage.getItem(name)
    return value
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(name, value)
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(name)
  },
}

// Mock data for demonstration
const mockProjects: Project[] = [
  { id: "1", name: "Downtown Tower Construction", code: "DTC-2024", location: "123 Main St" },
  { id: "2", name: "Highway Bridge Renovation", code: "HBR-2024", location: "Highway 401" },
  { id: "3", name: "Industrial Complex Phase 2", code: "ICP2-2024", location: "500 Industrial Blvd" },
]

const mockUsers: User[] = [
  { id: "1", name: "John Smith", email: "john@example.com", role: "Site Manager" },
  { id: "2", name: "Marie Dupont", email: "marie@example.com", role: "Safety Inspector" },
  { id: "3", name: "Carlos Rodriguez", email: "carlos@example.com", role: "Foreman" },
]

// Inspection sections with items (data-driven)
export const inspectionSections: InspectionSection[] = [
  {
    id: "ast",
    key: "ast",
    titleKey: "inspection.section.ast",
    items: [
      { id: "ast-1", number: "1.1", label: "AST completed before work begins", sectionId: "ast" },
      { id: "ast-2", number: "1.2", label: "Workers briefed on hazards identified", sectionId: "ast" },
      { id: "ast-3", number: "1.3", label: "Control measures implemented", sectionId: "ast" },
      { id: "ast-4", number: "1.4", label: "AST reviewed when conditions change", sectionId: "ast" },
    ],
  },
  {
    id: "ppe",
    key: "ppe",
    titleKey: "inspection.section.ppe",
    items: [
      { id: "ppe-1", number: "2.1", label: "Hard hats worn in designated areas", sectionId: "ppe" },
      { id: "ppe-2", number: "2.2", label: "Safety glasses/goggles worn when required", sectionId: "ppe" },
      { id: "ppe-3", number: "2.3", label: "High visibility vests worn", sectionId: "ppe" },
      { id: "ppe-4", number: "2.4", label: "Safety footwear worn", sectionId: "ppe" },
      { id: "ppe-5", number: "2.5", label: "Hearing protection used when required", sectionId: "ppe" },
      { id: "ppe-6", number: "2.6", label: "Gloves appropriate for task worn", sectionId: "ppe" },
    ],
  },
  {
    id: "housekeeping",
    key: "housekeeping",
    titleKey: "inspection.section.housekeeping",
    items: [
      { id: "hk-1", number: "3.1", label: "Work areas clean and organized", sectionId: "housekeeping" },
      { id: "hk-2", number: "3.2", label: "Walkways and exits clear", sectionId: "housekeeping" },
      { id: "hk-3", number: "3.3", label: "Materials properly stored", sectionId: "housekeeping" },
      { id: "hk-4", number: "3.4", label: "Waste disposed of properly", sectionId: "housekeeping" },
      { id: "hk-5", number: "3.5", label: "Spills cleaned up immediately", sectionId: "housekeeping" },
    ],
  },
  {
    id: "fire",
    key: "fire",
    titleKey: "inspection.section.fire",
    items: [
      { id: "fire-1", number: "4.1", label: "Fire extinguishers accessible and inspected", sectionId: "fire" },
      { id: "fire-2", number: "4.2", label: "Hot work permits in place", sectionId: "fire" },
      { id: "fire-3", number: "4.3", label: "Flammable materials stored properly", sectionId: "fire" },
      { id: "fire-4", number: "4.4", label: "Fire watch posted when required", sectionId: "fire" },
    ],
  },
    {
      id: "ast",
      key: "ast",
      titleKey: "AST",
      items: [
        { id: "ast-1", number: "1.1", label: "Étape déterminée : Description", sectionId: "ast" },
        { id: "ast-2", number: "1.2", label: "Risques identifiés : Description", sectionId: "ast" },
        { id: "ast-3", number: "1.3", label: "Actions mises en place : Description", sectionId: "ast" },
        { id: "ast-4", number: "1.4", label: "Autre", sectionId: "ast" },
      ],
    },
    {
      id: "epi",
      key: "epi",
      titleKey: "EPI - Équipement de Protection Individuelle",
      items: [
        { id: "epi-1", number: "2.1", label: "Lunettes de sécurité", sectionId: "epi" },
        { id: "epi-2", number: "2.2", label: "Visière de sécurité", sectionId: "epi" },
        { id: "epi-3", number: "2.3", label: "Gants", sectionId: "epi" },
        { id: "epi-4", number: "2.4", label: "Bottes", sectionId: "epi" },
        { id: "epi-5", number: "2.5", label: "Casque", sectionId: "epi" },
        { id: "epi-6", number: "2.6", label: "Protection auditive", sectionId: "epi" },
        { id: "epi-7", number: "2.7", label: "Harnais et longe", sectionId: "epi" },
        { id: "epi-8", number: "2.8", label: "Autre", sectionId: "epi" },
      ],
    },
    {
      id: "tenue",
      key: "tenue",
      titleKey: "Tenue des lieux",
      items: [
        { id: "tenue-1", number: "3.1", label: "Aires de travail propres et dégagées", sectionId: "tenue" },
        { id: "tenue-2", number: "3.2", label: "Accès et voies de circulation libres en tout temps", sectionId: "tenue" },
        { id: "tenue-3", number: "3.3", label: "Ouverture de planchers protégées ou garde corps", sectionId: "tenue" },
        { id: "tenue-4", number: "3.4", label: "Présence de glace ou de sable", sectionId: "tenue" },
        { id: "tenue-5", number: "3.5", label: "Matériaux entreposés convenablement", sectionId: "tenue" },
        { id: "tenue-6", number: "3.6", label: "Éclairage adéquat", sectionId: "tenue" },
        { id: "tenue-7", number: "3.7", label: "Équipements et outillage en bon état", sectionId: "tenue" },
        { id: "tenue-8", number: "3.8", label: "Fils à souder et rallonges électriques suspendus ou protégés", sectionId: "tenue" },
        { id: "tenue-9", number: "3.9", label: "Cabinet d’aisance accessibles et propres", sectionId: "tenue" },
        { id: "tenue-10", number: "3.10", label: "Clous en saillies abattus ou retirés", sectionId: "tenue" },
        { id: "tenue-11", number: "3.11", label: "Rebuts dans une poubelle avec couver", sectionId: "tenue" },
        { id: "tenue-12", number: "3.12", label: "Local pour les repas propre et en bon état", sectionId: "tenue" },
        { id: "tenue-13", number: "3.13", label: "Équipement électrique mis à la terre", sectionId: "tenue" },
        { id: "tenue-14", number: "3.14", label: "Trousse de premier soins accessible et complète", sectionId: "tenue" },
        { id: "tenue-15", number: "3.15", label: "Bidons de carburant fermés", sectionId: "tenue" },
        { id: "tenue-16", number: "3.16", label: "Douche oculaire", sectionId: "tenue" },
        { id: "tenue-17", number: "3.17", label: "Nombre de secouriste", sectionId: "tenue" },
        { id: "tenue-18", number: "3.18", label: "Procédure d’évacuation", sectionId: "tenue" },
        { id: "tenue-19", number: "3.19", label: "Point de rassemblement", sectionId: "tenue" },
        { id: "tenue-20", number: "3.20", label: "Autre", sectionId: "tenue" },
      ],
    },
    {
      id: "incendie",
      key: "incendie",
      titleKey: "Protection incendie",
      items: [
        { id: "incendie-1", number: "4.1", label: "Permis de travail à chaud", sectionId: "incendie" },
        { id: "incendie-2", number: "4.2", label: "Extincteurs sur les lieux en quantité suffisant", sectionId: "incendie" },
        { id: "incendie-3", number: "4.3", label: "Bouteilles pour oxycoupage tenues debout et attachées", sectionId: "incendie" },
        { id: "incendie-4", number: "4.4", label: "SIMDUT vérifié", sectionId: "incendie" },
        { id: "incendie-5", number: "4.5", label: "Autre", sectionId: "incendie" },
      ],
    },
    {
      id: "echafaudage",
      key: "echafaudage",
      titleKey: "Échafaudage, échelles et escabeaux",
      items: [
        { id: "echafaudage-1", number: "5.1", label: "Échafaudage conforme tel que le plan d’ingénieur", sectionId: "echafaudage" },
        { id: "echafaudage-2", number: "5.2", label: "Échelles et escabeaux de type industriel", sectionId: "echafaudage" },
        { id: "echafaudage-3", number: "5.3", label: "Appui sur base solide", sectionId: "echafaudage" },
        { id: "echafaudage-4", number: "5.4", label: "Échelle dépassant le palier d’au moins 900mm", sectionId: "echafaudage" },
        { id: "echafaudage-5", number: "5.5", label: "Autre", sectionId: "echafaudage" },
      ],
    },
    {
      id: "hauteur",
      key: "hauteur",
      titleKey: "Travaux en hauteur",
      items: [
        { id: "hauteur-1", number: "6.1", label: "Protection contre les chutes conforme et utilisée correctement (Harnais, lignes de vie, point d’ancrage, absorbeur d’énergie)", sectionId: "hauteur" },
        { id: "hauteur-2", number: "6.2", label: "Périmètre de sécurité", sectionId: "hauteur" },
        { id: "hauteur-3", number: "6.3", label: "Aucun travaux superposés", sectionId: "hauteur" },
        { id: "hauteur-4", number: "6.4", label: "Échelles attachées et conformes (Classe 1)", sectionId: "hauteur" },
        { id: "hauteur-5", number: "6.5", label: "Respect des distances d’approche des lignes électriques", sectionId: "hauteur" },
        { id: "hauteur-6", number: "6.6", label: "Protection des ouvertures au plancher", sectionId: "hauteur" },
        { id: "hauteur-7", number: "6.7", label: "Garde corps en bon état et sans ouverture", sectionId: "hauteur" },
        { id: "hauteur-8", number: "6.8", label: "Escaliers et rampes d’accès", sectionId: "hauteur" },
        { id: "hauteur-9", number: "6.9", label: "Autre", sectionId: "hauteur" },
      ],
    },
    {
      id: "eau",
      key: "eau",
      titleKey: "Travaux sur l'eau, au dessus ou à proximité",
      items: [
        { id: "eau-1", number: "7.1", label: "Gilet de sauvetage", sectionId: "eau" },
        { id: "eau-2", number: "7.2", label: "Procédure de sauvetage connue", sectionId: "eau" },
        { id: "eau-3", number: "7.3", label: "Système de récupération", sectionId: "eau" },
        { id: "eau-4", number: "7.4", label: "Embarcation de sauvetage", sectionId: "eau" },
        { id: "eau-5", number: "7.5", label: "Moyens de communication", sectionId: "eau" },
      ],
    },
    {
      id: "levage",
      key: "levage",
      titleKey: "Levage",
      items: [
        { id: "levage-1", number: "8.1", label: "Vérification de la direction et la vitesse du vent", sectionId: "levage" },
        { id: "levage-2", number: "8.2", label: "Délimitation de l’aire de levage", sectionId: "levage" },
        { id: "levage-3", number: "8.3", label: "Câble de guidage", sectionId: "levage" },
        { id: "levage-4", number: "8.4", label: "Évaluation du poids des charges à soulever", sectionId: "levage" },
        { id: "levage-5", number: "8.5", label: "Aucun travailleur dans la zone de levage ou sous la charge", sectionId: "levage" },
        { id: "levage-6", number: "8.6", label: "Autre", sectionId: "levage" },
      ],
    },
    {
      id: "tranchees",
      key: "tranchees",
      titleKey: "Excavation et tranchées",
      items: [
        { id: "tranchees-1", number: "9.1", label: "Respect des pentes de 45deg.", sectionId: "tranchees" },
        { id: "tranchees-2", number: "9.2", label: "Parois de la tranchée", sectionId: "tranchees" },
        { id: "tranchees-3", number: "9.3", label: "Barrières à 900mm du sommet", sectionId: "tranchees" },
        { id: "tranchees-4", number: "9.4", label: "Matériaux à 1,2m de la parois", sectionId: "tranchees" },
        { id: "tranchees-5", number: "9.5", label: "Échelles dans la tranchée à tous les 15m", sectionId: "tranchees" },
        { id: "tranchees-6", number: "9.6", label: "Surveillance constante pour détecter les dangers", sectionId: "tranchees" },
        { id: "tranchees-7", number: "9.7", label: "Étançonnements sont inspectés et approuvé par un ingénieur.", sectionId: "tranchees" },
        { id: "tranchees-8", number: "9.8", label: "Autre", sectionId: "tranchees" },
      ],
    },
    {
      id: "environnement",
      key: "environnement",
      titleKey: "Environnement",
      items: [
        { id: "environnement-1", number: "10.1", label: "Respect des milieux hydrique et humide", sectionId: "environnement" },
        { id: "environnement-2", number: "10.2", label: "Prévention de la contamination des sols", sectionId: "environnement" },
        { id: "environnement-3", number: "10.3", label: "Trousses de déversement", sectionId: "environnement" },
        { id: "environnement-4", number: "10.4", label: "Respect de la distance d’un milieu aquatique pour ravitaillement et entretien de la machinerie", sectionId: "environnement" },
        { id: "environnement-5", number: "10.5", label: "Bac de récupération de capacité 110% du volume du réservoir", sectionId: "environnement" },
        { id: "environnement-6", number: "10.6", label: "Protection sonore, respect de exigences du devis", sectionId: "environnement" },
        { id: "environnement-7", number: "10.7", label: "Contrôle des poussières", sectionId: "environnement" },
      ],
    },
    {
      id: "varia",
      key: "varia",
      titleKey: "Varia",
      items: [
        { id: "varia-1", number: "10.1", label: "Sécurité du public", sectionId: "varia" },
      ],
    },
    {
      key: "scaffolding",
      titleKey: "inspection.section.scaffolding",
      items: [
      { id: "sc-1", number: "5.1", label: "Scaffolding inspected before use", sectionId: "scaffolding" },
      { id: "sc-2", number: "5.2", label: "Guard rails in place", sectionId: "scaffolding" },
      { id: "sc-3", number: "5.3", label: "Ladders secured and in good condition", sectionId: "scaffolding" },
      { id: "sc-4", number: "5.4", label: "Proper access provided", sectionId: "scaffolding" },
      { id: "sc-5", number: "5.5", label: "Tag system in use", sectionId: "scaffolding" },
    ],
  },
  {
    id: "heights",
    key: "heights",
    titleKey: "inspection.section.heights",
    items: [
      { id: "ht-1", number: "6.1", label: "Fall protection used above 1.8m/6ft", sectionId: "heights" },
      { id: "ht-2", number: "6.2", label: "Anchor points adequate", sectionId: "heights" },
      { id: "ht-3", number: "6.3", label: "Harnesses inspected", sectionId: "heights" },
      { id: "ht-4", number: "6.4", label: "Openings protected", sectionId: "heights" },
    ],
  },
  {
    id: "water",
    key: "water",
    titleKey: "inspection.section.water",
    items: [
      { id: "wt-1", number: "7.1", label: "Life jackets available when required", sectionId: "water" },
      { id: "wt-2", number: "7.2", label: "Rescue equipment in place", sectionId: "water" },
      { id: "wt-3", number: "7.3", label: "Barriers in place near water", sectionId: "water" },
    ],
  },
  {
    id: "lifting",
    key: "lifting",
    titleKey: "inspection.section.lifting",
    items: [
      { id: "lf-1", number: "8.1", label: "Cranes inspected and certified", sectionId: "lifting" },
      { id: "lf-2", number: "8.2", label: "Rigging equipment in good condition", sectionId: "lifting" },
      { id: "lf-3", number: "8.3", label: "Load limits posted and followed", sectionId: "lifting" },
      { id: "lf-4", number: "8.4", label: "Signal person designated", sectionId: "lifting" },
      { id: "lf-5", number: "8.5", label: "Exclusion zones established", sectionId: "lifting" },
    ],
  },
  {
    id: "excavation",
    key: "excavation",
    titleKey: "inspection.section.excavation",
    items: [
      { id: "ex-1", number: "9.1", label: "Excavation permit obtained", sectionId: "excavation" },
      { id: "ex-2", number: "9.2", label: "Underground utilities located", sectionId: "excavation" },
      { id: "ex-3", number: "9.3", label: "Shoring/sloping adequate", sectionId: "excavation" },
      { id: "ex-4", number: "9.4", label: "Safe access/egress provided", sectionId: "excavation" },
      { id: "ex-5", number: "9.5", label: "Spoil piles at safe distance", sectionId: "excavation" },
    ],
  },
  {
    id: "environment",
    key: "environment",
    titleKey: "inspection.section.environment",
    items: [
      { id: "env-1", number: "10.1", label: "Spill kits available", sectionId: "environment" },
      { id: "env-2", number: "10.2", label: "Hazardous waste properly contained", sectionId: "environment" },
      { id: "env-3", number: "10.3", label: "Erosion controls in place", sectionId: "environment" },
      { id: "env-4", number: "10.4", label: "Dust control measures implemented", sectionId: "environment" },
    ],
  },
  {
    id: "misc",
    key: "misc",
    titleKey: "inspection.section.misc",
    items: [
      { id: "misc-1", number: "11.1", label: "First aid kit stocked and accessible", sectionId: "misc" },
      { id: "misc-2", number: "11.2", label: "Emergency contact info posted", sectionId: "misc" },
      { id: "misc-3", number: "11.3", label: "MSDS/SDS sheets available", sectionId: "misc" },
      { id: "misc-4", number: "11.4", label: "Toolbox talks conducted", sectionId: "misc" },
    ],
  },
]

interface AppState {
  // Auth data
  authUsers: AuthUser[]
  currentAuthUserId: string | null
  userGroups: UserGroup[]
  formAssignments: FormAssignment[]

  // Legacy form data
  observations: Observation[]
  incidents: Incident[]
  inspections: Inspection[]
  projects: Project[]
  users: User[]
  currentUser: User | null

  // UI state
  isOnline: boolean
  isSyncing: boolean

  // Auth actions
  addAuthUser: (user: AuthUser) => void
  updateAuthUser: (id: string, updates: Partial<AuthUser>) => void
  deleteAuthUser: (id: string) => void
  setCurrentAuthUserId: (id: string | null) => void
  getCurrentAuthUser: () => AuthUser | null

  // Group actions
  addUserGroup: (group: UserGroup) => void
  updateUserGroup: (id: string, updates: Partial<UserGroup>) => void
  deleteUserGroup: (id: string) => void
  addUserToGroup: (groupId: string, userId: string) => void
  removeUserFromGroup: (groupId: string, userId: string) => void

  // Assignment actions
  assignForm: (assignment: FormAssignment) => void
  updateAssignment: (formId: string, updates: Partial<FormAssignment>) => void
  deleteAssignment: (formId: string) => void
  getFormAssignment: (formId: string) => FormAssignment | null
  getMyAssignments: () => FormAssignment[]

  // Actions
  setOnlineStatus: (status: boolean) => void
  setSyncing: (syncing: boolean) => void

  // CRUD operations
  addObservation: (observation: Observation) => void
  updateObservation: (id: string, updates: Partial<Observation>) => void
  deleteObservation: (id: string) => void

  addIncident: (incident: Incident) => void
  updateIncident: (id: string, updates: Partial<Incident>) => void
  deleteIncident: (id: string) => void

  addInspection: (inspection: Inspection) => void
  updateInspection: (id: string, updates: Partial<Inspection>) => void
  deleteInspection: (id: string) => void

  // Computed
  getRecentDrafts: () => FormListItem[]
  getRecentSubmissions: () => FormListItem[]
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth data
      authUsers: [],
      currentAuthUserId: null,
      userGroups: [],
      formAssignments: [],

      // Legacy form data
      observations: [],
      incidents: [],
      inspections: [],
      projects: mockProjects,
      users: mockUsers,
      currentUser: mockUsers[0],

      // UI state
      isOnline: typeof window !== 'undefined',
      isSyncing: false,

      // Auth actions
      addAuthUser: (user) => set((state) => {
        // Prevent duplicate emails
        const emailExists = state.authUsers.some((u) => u.email.toLowerCase() === user.email.toLowerCase())
        if (emailExists) {
          console.warn(`User with email ${user.email} already exists`)
          return state
        }
        return { authUsers: [...state.authUsers, user] }
      }),
      updateAuthUser: (id, updates) =>
        set((state) => ({
          authUsers: state.authUsers.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        })),
      deleteAuthUser: (id) => set((state) => ({ authUsers: state.authUsers.filter((u) => u.id !== id) })),
      setCurrentAuthUserId: (id) => set({ currentAuthUserId: id }),
      getCurrentAuthUser: () => {
        const state = get()
        return state.authUsers.find((u) => u.id === state.currentAuthUserId) || null
      },

      // Group actions
      addUserGroup: (group) => set((state) => ({ userGroups: [...state.userGroups, group] })),
      updateUserGroup: (id, updates) =>
        set((state) => ({
          userGroups: state.userGroups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),
      deleteUserGroup: (id) => set((state) => ({ userGroups: state.userGroups.filter((g) => g.id !== id) })),
      addUserToGroup: (groupId, userId) =>
        set((state) => ({
          userGroups: state.userGroups.map((g) =>
            g.id === groupId && !g.memberIds.includes(userId)
              ? { ...g, memberIds: [...g.memberIds, userId] }
              : g,
          ),
        })),
      removeUserFromGroup: (groupId, userId) =>
        set((state) => ({
          userGroups: state.userGroups.map((g) =>
            g.id === groupId ? { ...g, memberIds: g.memberIds.filter((id) => id !== userId) } : g,
          ),
        })),

      // Assignment actions
      assignForm: (assignment) =>
        set((state) => {
          const existing = state.formAssignments.findIndex((a) => a.formId === assignment.formId)
          if (existing >= 0) {
            const updated = [...state.formAssignments]
            updated[existing] = assignment
            return { formAssignments: updated }
          }
          return { formAssignments: [...state.formAssignments, assignment] }
        }),
      updateAssignment: (formId, updates) =>
        set((state) => ({
          formAssignments: state.formAssignments.map((a) =>
            a.formId === formId ? { ...a, ...updates } : a,
          ),
        })),
      deleteAssignment: (formId) =>
        set((state) => ({
          formAssignments: state.formAssignments.filter((a) => a.formId !== formId),
        })),
      getFormAssignment: (formId) => {
        const state = get()
        return state.formAssignments.find((a) => a.formId === formId) || null
      },
      getMyAssignments: () => {
        const state = get()
        const userId = state.currentAuthUserId
        if (!userId) return []
        return state.formAssignments.filter(
          (a) => a.assignedToUserIds.includes(userId) || a.assignedToGroupIds.some((gid) =>
            state.userGroups.find((g) => g.id === gid && g.memberIds.includes(userId))
          ),
        )
      },

      // Actions
      setOnlineStatus: (status) => set({ isOnline: status }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),

      // Observations
      addObservation: (observation) => set((state) => ({ observations: [...state.observations, observation] })),
      updateObservation: (id, updates) =>
        set((state) => ({
          observations: state.observations.map((o) => (o.id === id ? { ...o, ...updates, updatedAt: new Date() } : o)),
        })),
      deleteObservation: (id) => set((state) => ({ observations: state.observations.filter((o) => o.id !== id) })),

      // Incidents
      addIncident: (incident) => set((state) => ({ incidents: [...state.incidents, incident] })),
      updateIncident: (id, updates) =>
        set((state) => ({
          incidents: state.incidents.map((i) => (i.id === id ? { ...i, ...updates, updatedAt: new Date() } : i)),
        })),
      deleteIncident: (id) => set((state) => ({ incidents: state.incidents.filter((i) => i.id !== id) })),

      // Inspections
      addInspection: (inspection) => set((state) => ({ inspections: [...state.inspections, inspection] })),
      updateInspection: (id, updates) =>
        set((state) => ({
          inspections: state.inspections.map((i) => (i.id === id ? { ...i, ...updates, updatedAt: new Date() } : i)),
        })),
      deleteInspection: (id) => set((state) => ({ inspections: state.inspections.filter((i) => i.id !== id) })),

      // Computed
      getRecentDrafts: () => {
        const state = get()
        const drafts: FormListItem[] = [
          ...state.observations
            .filter((o) => o.status === "draft" || o.status === "in-progress")
            .map((o) => ({
              id: o.id,
              type: "observation" as const,
              number: o.number,
              title: o.title,
              projectName: state.projects.find((p) => p.id === o.projectId)?.name || "",
              status: o.status,
              updatedAt: new Date(o.updatedAt),
              syncStatus: o.syncStatus,
            })),
          ...state.incidents
            .filter((i) => i.status === "draft" || i.status === "in-progress")
            .map((i) => ({
              id: i.id,
              type: "incident" as const,
              number: i.number,
              title: i.title,
              projectName: state.projects.find((p) => p.id === i.projectId)?.name || "",
              status: i.status,
              updatedAt: new Date(i.updatedAt),
              syncStatus: i.syncStatus,
            })),
          ...state.inspections
            .filter((i) => i.status === "draft" || i.status === "in-progress")
            .map((i) => ({
              id: i.id,
              type: "inspection" as const,
              number: i.id.slice(-6).toUpperCase(),
              title: i.documentTitle,
              projectName: state.projects.find((p) => p.id === i.projectId)?.name || "",
              status: i.status,
              updatedAt: new Date(i.updatedAt),
              syncStatus: i.syncStatus,
            })),
        ]
        return drafts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5)
      },
      getRecentSubmissions: () => {
        const state = get()
        const submissions: FormListItem[] = [
          ...state.observations
            .filter((o) => o.status === "submitted")
            .map((o) => ({
              id: o.id,
              type: "observation" as const,
              number: o.number,
              title: o.title,
              projectName: state.projects.find((p) => p.id === o.projectId)?.name || "",
              status: o.status,
              updatedAt: new Date(o.updatedAt),
              syncStatus: o.syncStatus,
            })),
          ...state.incidents
            .filter((i) => i.status === "submitted")
            .map((i) => ({
              id: i.id,
              type: "incident" as const,
              number: i.number,
              title: i.title,
              projectName: state.projects.find((p) => p.id === i.projectId)?.name || "",
              status: i.status,
              updatedAt: new Date(i.updatedAt),
              syncStatus: i.syncStatus,
            })),
          ...state.inspections
            .filter((i) => i.status === "submitted")
            .map((i) => ({
              id: i.id,
              type: "inspection" as const,
              number: i.id.slice(-6).toUpperCase(),
              title: i.documentTitle,
              projectName: state.projects.find((p) => p.id === i.projectId)?.name || "",
              status: i.status,
              updatedAt: new Date(i.updatedAt),
              syncStatus: i.syncStatus,
            })),
        ]
        return submissions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5)
      },
    }),
    {
      name: "construction-forms-storage",
      storage: createJSONStorage(() => customStorage),
      skipHydration: true,
      partialize: (state) => ({
        // Form data
        observations: state.observations,
        incidents: state.incidents,
        inspections: state.inspections,
        // Auth data - persist for offline use
        authUsers: state.authUsers,
        userGroups: state.userGroups,
        currentAuthUserId: state.currentAuthUserId,
        formAssignments: state.formAssignments,
      }),
    },
  ),
)
