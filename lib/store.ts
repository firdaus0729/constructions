"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { 
  Observation, 
  Incident, 
  Inspection, 
  Livrable,
  FormListItem, 
  Project, 
  User, 
  InspectionSection,
  AuthUser,
  UserGroup,
  FormAssignment,
  AzureADGroupConfig,
  UserRole
} from "./types"

// Default Type d'accident options (restricted list from reference screenshot)
const DEFAULT_ACCIDENT_TYPES: { id: string; label: string }[] = [
  { id: "rapport-seulement", label: "Rapport seulement" },
  { id: "premiers-soins", label: "Premier soins" },
  { id: "traitement-medical", label: "Traitement médical" },
  { id: "soins-refuses", label: "Soins refusés" },
  { id: "travail-restreint", label: "Travail restreint" },
  { id: "temps-perdu", label: "Temps perdu" },
  { id: "mort", label: "Mort" },
]

// Default Danger options (restricted list from reference screenshot)
const DEFAULT_DANGER_OPTIONS: { id: string; label: string }[] = [
  { id: "pris-dans-entre", label: "Pris dans/entre" },
  { id: "produit-chimique", label: "Produit chimique" },
  { id: "electrique", label: "Électrique" },
  { id: "environnemental", label: "Environnemental" },
  { id: "ergonomique-mouvement-repetitifs", label: "Ergonomique (mouvement répétitifs)" },
  { id: "explosion-chute", label: "Explosion Chute" },
  { id: "chaleur-feu-explosion-empalement", label: "Chaleur/feu/explosion Empalement" },
  { id: "surmenage", label: "Surmenage" },
  { id: "rayonnement", label: "Rayonnement" },
  { id: "appareil-respiratoire", label: "Appareil respiratoire" },
  { id: "glissade", label: "Glissade" },
  { id: "frappe-par", label: "Frappé par" },
  { id: "trebuchement-violence", label: "Trébuchement: Violence" },
]

// Default Condition contributive options (restricted list from reference screenshot)
const DEFAULT_CONTRIBUTING_CONDITION_OPTIONS: { id: string; label: string }[] = [
  { id: "affectation-personnel", label: "Affectation/Personnel" },
  { id: "autorisation", label: "Autorisation" },
  { id: "communication", label: "Communication" },
  { id: "distraction", label: "Distraction" },
  { id: "chahut", label: "Chahut" },
  { id: "verrouiller-taguer", label: "Verrouiller/taguer" },
  { id: "methodes-procedures-regles", label: "Méthodes/Procédures/Règles" },
  { id: "inconduite", label: "Inconduite" },
  { id: "planification", label: "Planification" },
  { id: "position-posture", label: "Position/Posture" },
  { id: "epi", label: "ÉPI" },
  { id: "vitesse-distance", label: "Vitesse/Distance" },
  { id: "stress", label: "Stress" },
  { id: "supervision", label: "Supervision" },
  { id: "formation", label: "Formation" },
  { id: "utiliser", label: "Utiliser" },
]

// Default Comportement contributif options (observation new page: only these 21, remain editable)
const DEFAULT_CONTRIBUTING_BEHAVIOR_OPTIONS: { id: string; label: string }[] = [
  { id: "acces-sortie", label: "Accès/Sortie" },
  { id: "vetements", label: "Vêtements" },
  { id: "environnement", label: "Environnement" },
  { id: "equippement", label: "Équippement" },
  { id: "ergonomie", label: "Ergonomie" },
  { id: "conditions-sol", label: "Conditions du sol" },
  { id: "garde-barriere", label: "Garde/Barrière" },
  { id: "entretien-menager", label: "Entretien ménager" },
  { id: "information-signilisation", label: "Information/Signilisation" },
  { id: "eclairage", label: "Éclairage" },
  { id: "selection-materiaux", label: "Sélection de matériaux" },
  { id: "bruit", label: "Bruit" },
  { id: "epi", label: "ÉPI" },
  { id: "securite", label: "Sécurité" },
  { id: "etaiement-contreventement", label: "Étaiement/Contreventement" },
  { id: "energie-emmagasinee", label: "Énergie emmagasinée" },
  { id: "outil", label: "Outil" },
  { id: "controles-circulation", label: "Contrôles de circulation" },
  { id: "ventilation", label: "Ventilation" },
  { id: "meteo", label: "Météo" },
  { id: "disposition-poste-travail", label: "Disposition de poste de travail" },
]

// Default Type de blessure options (50 items)
const DEFAULT_INJURY_TYPES: { id: string; label: string }[] = [
  { id: "inj-amputation", label: "Amputation" },
  { id: "inj-amiantose", label: "Amiantose" },
  { id: "inj-asphyxie", label: "Asphyxie" },
  { id: "inj-morsure", label: "Morsure" },
  { id: "inj-ecchymose", label: "Ecchymose (contusion)" },
  { id: "inj-brulure-chimique", label: "Brûlure (chimique)" },
  { id: "inj-brulure-chaleur", label: "Brûlure (chaleur)" },
  { id: "inj-cancer", label: "Cancer" },
  { id: "inj-canal-carpien", label: "Syndrome du canal carpien" },
  { id: "inj-douleur-thoracique", label: "Douleur thoracique (angine de poitrine)" },
  { id: "inj-commotion", label: "Commotion" },
  { id: "inj-maladie-contagieuse", label: "Maladie contagieuse" },
  { id: "inj-ecrasement", label: "Écrasement" },
  { id: "inj-coupure", label: "Coupure (lacération)" },
  { id: "inj-dislocation", label: "Dislocation" },
  { id: "inj-maladie-poussiere", label: "Maladie de la poussière" },
  { id: "inj-choc-electrique", label: "Choc électrique" },
  { id: "inj-perte-oculaire", label: "Perte oculaire (énucléation)" },
  { id: "inj-corps-etranger", label: "Corps étranger" },
  { id: "inj-fracture", label: "Fracture" },
  { id: "inj-congelation", label: "Congélation" },
  { id: "inj-deficience-auditive", label: "Déficience auditive" },
  { id: "inj-perte-auditive", label: "Perte auditive" },
  { id: "inj-crise-cardiaque", label: "Crise cardiaque (infarctus du myocarde)" },
  { id: "inj-epuisement-chaleur", label: "Épuisement dû la chaleur (prostration)" },
  { id: "inj-coup-chaleur", label: "Coup de chaleur" },
  { id: "inj-hernie", label: "Hernie" },
  { id: "inj-hypothermie", label: "Hypothermie" },
  { id: "inj-infection", label: "Infection" },
  { id: "inj-inflammation", label: "Inflammation" },
  { id: "inj-perte-conscience", label: "Perte de conscience (syncope)" },
  { id: "inj-trouble-mental", label: "Trouble mental" },
  { id: "inj-stress-mental", label: "Stress mental" },
  { id: "inj-empoisonnement-chimique", label: "Empoisonnement (chimique)" },
  { id: "inj-empoisonnement-general", label: "Empoisonnement (général)" },
  { id: "inj-empoisonnement-metal", label: "Empoisonnement (métal)" },
  { id: "inj-ponction", label: "Ponction" },
  { id: "inj-radiation", label: "Radiation" },
  { id: "inj-eruption-cutanee", label: "Éruption cutanée/plaies/ampoules (dermatite)" },
  { id: "inj-troubles-respiratoires", label: "Troubles respiratoires" },
  { id: "inj-rupture", label: "Rupture" },
  { id: "inj-egratignure", label: "Égratignure (abrasion)" },
  { id: "inj-demembrement", label: "Démembrement" },
  { id: "inj-silicose", label: "Silicose" },
  { id: "inj-entorse", label: "Entorse" },
  { id: "inj-piqure", label: "Piqûre" },
  { id: "inj-foulure", label: "Foulure" },
  { id: "inj-dechirure", label: "Déchirure" },
  { id: "inj-vasculaire", label: "Vasculaire" },
  { id: "inj-perte-vision", label: "Perte de vision" },
]

// Default Partie du corps affectée options — exact order from PDF, only these choices
const DEFAULT_BODY_PARTS: { id: string; label: string }[] = [
  { id: "bp-corps-entier", label: "Corps entier (systémique)" },
  { id: "bp-tete", label: "Tête" },
  { id: "bp-oeil-droite", label: "Oeil (droite)" },
  { id: "bp-oeil-gauche", label: "Oeil (gauche)" },
  { id: "bp-nez", label: "Nez" },
  { id: "bp-bouche", label: "Bouche" },
  { id: "bp-dents", label: "Dents" },
  { id: "bp-oreille-droite", label: "Oreille (droite)" },
  { id: "bp-oreille-gauche", label: "Oreille (gauche)" },
  { id: "bp-crane", label: "Crâne" },
  { id: "bp-visage", label: "Visage" },
  { id: "bp-tete-arriere", label: "Tête (arrière)" },
  { id: "bp-cou", label: "Cou" },
  { id: "bp-gorge-devant", label: "Gorge (devant)" },
  { id: "bp-cou-droite", label: "Cou (droite)" },
  { id: "bp-cou-gauche", label: "Cou (gauche)" },
  { id: "bp-cou-dos", label: "Cou (dos)" },
  { id: "bp-torse", label: "Torse" },
  { id: "bp-poitrine", label: "Poitrine" },
  { id: "bp-pectoraux-droite", label: "Pectoraux (droite)" },
  { id: "bp-pectoraux-gauche", label: "Pectoraux (gauche)" },
  { id: "bp-abdomen", label: "Abdomen" },
  { id: "bp-cotes-droite", label: "Côtes (droite)" },
  { id: "bp-cotes-gauche", label: "Côtes (gauche)" },
  { id: "bp-dos", label: "Dos" },
  { id: "bp-haut-dos-droite", label: "Haut du dos (droite)" },
  { id: "bp-haut-dos-gauche", label: "Haut du dos (gauche)" },
  { id: "bp-bas-dos-droite", label: "Bas du dos (droite)" },
  { id: "bp-bas-dos-gauche", label: "Bas du dos (gauche)" },
  { id: "bp-colonne-vertebrale", label: "Colonne vertébrale" },
  { id: "bp-bassin-avant", label: "Bassin (avant)" },
  { id: "bp-aine", label: "Aine" },
  { id: "bp-fesses", label: "Fesses" },
  { id: "bp-coccyx", label: "Coccyx" },
  { id: "bp-epaule-droite", label: "Épaule (droite)" },
  { id: "bp-haut-bras-droite", label: "Haut du bras (droite)" },
  { id: "bp-coude-droite", label: "Coude (droite)" },
  { id: "bp-avant-bras-droite", label: "Avant-bras (droite)" },
  { id: "bp-poignet-droite", label: "Poignet (droite)" },
  { id: "bp-main-droite", label: "Main (droite)" },
  { id: "bp-index-droite", label: "Index (droite)" },
  { id: "bp-majeur-droite", label: "Majeur (droite)" },
  { id: "bp-annulaire-droite", label: "Annulaire (droite)" },
  { id: "bp-petit-doigt-droite", label: "Petit doigt (droite)" },
  { id: "bp-pouce-droite", label: "Pouce (droite)" },
  { id: "bp-paume-droite", label: "Paume (droite)" },
  { id: "bp-main-arriere-droite", label: "Main (arrière, droite)" },
  { id: "bp-bras-gauche", label: "Bras (gauche)" },
  { id: "bp-epaule-gauche", label: "Épaule (gauche)" },
  { id: "bp-haut-bras-gauche", label: "Haut du bras (gauche)" },
  { id: "bp-coude-gauche", label: "Coude (gauche)" },
  { id: "bp-avant-bras-gauche", label: "Avant-bras (gauche)" },
  { id: "bp-poignet-gauche", label: "Poignet (gauche)" },
  { id: "bp-main-gauche", label: "Main (gauche)" },
  { id: "bp-index-gauche", label: "Index (gauche)" },
  { id: "bp-majeur-gauche", label: "Majeur (gauche)" },
  { id: "bp-annulaire-gauche", label: "Annulaire (gauche)" },
  { id: "bp-pouce-gauche", label: "Pouce (gauche)" },
  { id: "bp-paume-gauche", label: "Paume (gauche)" },
  { id: "bp-main-arriere-gauche", label: "Main (arrière, gauche)" },
  { id: "bp-jambe-droite", label: "Jambe (droite)" },
  { id: "bp-hanche-droite", label: "Hanche (droite)" },
  { id: "bp-cuisse-droite", label: "Partie supérieure de la jambe (droite)" },
  { id: "bp-genou-droit", label: "Genou (droit)" },
  { id: "bp-bas-jambe-droite", label: "Bas de la jambe (droite)" },
  { id: "bp-cheville-droite", label: "Cheville (droite)" },
  { id: "bp-pied-droite", label: "Pied (droite)" },
  { id: "bp-pied-haut-droite", label: "Pied (en haut, à droite)" },
  { id: "bp-talon-droite", label: "Talon (droite)" },
  { id: "bp-gros-orteil-droite", label: "Gros orteil (droite)" },
  { id: "bp-deuxieme-orteil-droite", label: "Deuxième orteil (droite)" },
  { id: "bp-troisieme-orteil-droite", label: "Troisième orteil (droite)" },
  { id: "bp-quatrieme-orteil-droite", label: "Quatrième orteil (droite)" },
  { id: "bp-petit-orteil-droite", label: "Petit orteil (droite)" },
  { id: "bp-jambe-gauche", label: "Jambe (gauche)" },
  { id: "bp-hanche-gauche", label: "Hanche (gauche)" },
  { id: "bp-cuisse-gauche", label: "Partie supérieure de la jambe (gauche)" },
  { id: "bp-genou-gauche", label: "Genou (gauche)" },
  { id: "bp-bas-jambe-gauche", label: "Bas de la jambe (gauche)" },
  { id: "bp-cheville-gauche", label: "Cheville (gauche)" },
  { id: "bp-pied-gauche", label: "Pied (gauche)" },
  { id: "bp-pied-haut-gauche", label: "Pied (en haut, à gauche)" },
  { id: "bp-talon-gauche", label: "Talon (gauche)" },
  { id: "bp-gros-orteil-gauche", label: "Gros orteil (gauche)" },
  { id: "bp-deuxieme-orteil-gauche", label: "Deuxième orteil (gauche)" },
  { id: "bp-troisieme-orteil-gauche", label: "Troisième orteil (gauche)" },
  { id: "bp-quatrieme-orteil-gauche", label: "Quatrième orteil (gauche)" },
  { id: "bp-petit-orteil-gauche", label: "Petit orteil (gauche)" },
]

// Create a custom storage that checks for window availability and merges full incident option lists on rehydration
const customStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null
    const value = localStorage.getItem(name)
    if (!value) return value
    try {
      const parsed = JSON.parse(value)
      // If persisted incidentOptionLists doesn't match required default sets, restore defaults
      if (parsed?.state?.incidentOptionLists) {
        const lists = parsed.state.incidentOptionLists
        let updated = false
        const sameIds = (current: any, defaults: { id: string; label: string }[]) => {
          if (!Array.isArray(current)) return false
          if (current.length !== defaults.length) return false
          const currIds = new Set(current.map((x: any) => x?.id))
          return defaults.every((d) => currIds.has(d.id))
        }

        if (!sameIds(lists.accidentTypes, DEFAULT_ACCIDENT_TYPES)) {
          lists.accidentTypes = DEFAULT_ACCIDENT_TYPES
          updated = true
        }
        if (!sameIds(lists.danger, DEFAULT_DANGER_OPTIONS)) {
          lists.danger = DEFAULT_DANGER_OPTIONS
          updated = true
        }
        if (!sameIds(lists.contributingCondition, DEFAULT_CONTRIBUTING_CONDITION_OPTIONS)) {
          lists.contributingCondition = DEFAULT_CONTRIBUTING_CONDITION_OPTIONS
          updated = true
        }
        if (!sameIds(lists.contributingBehavior, DEFAULT_CONTRIBUTING_BEHAVIOR_OPTIONS)) {
          lists.contributingBehavior = DEFAULT_CONTRIBUTING_BEHAVIOR_OPTIONS
          updated = true
        }
        if (!lists.injuryTypes || !Array.isArray(lists.injuryTypes) || lists.injuryTypes.length < DEFAULT_INJURY_TYPES.length) {
          lists.injuryTypes = DEFAULT_INJURY_TYPES
          updated = true
        }
        // Body parts: always use exact PDF list (only these choices)
        if (!sameIds(lists.bodyParts, DEFAULT_BODY_PARTS)) {
          lists.bodyParts = DEFAULT_BODY_PARTS
          updated = true
        }
        if (updated) {
          parsed.state.incidentOptionLists = { ...lists }
        }
      }
      // Restore observation Comportement contributif (21 options) when empty or missing
      if (parsed?.state?.observationOptionLists) {
        const obs = parsed.state.observationOptionLists
        const list = obs.contributingBehavior
        const hasBehavior =
          Array.isArray(list) &&
          list.length >= DEFAULT_CONTRIBUTING_BEHAVIOR_OPTIONS.length &&
          DEFAULT_CONTRIBUTING_BEHAVIOR_OPTIONS.every((d) => list.some((x: any) => x?.id === d.id))
        if (!hasBehavior) {
          parsed.state.observationOptionLists = {
            ...obs,
            contributingBehavior: [...DEFAULT_CONTRIBUTING_BEHAVIOR_OPTIONS],
          }
        }
      }
      return JSON.stringify(parsed)
    } catch {
      return value
    }
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
  {
    id: "1",
    code: "DTC-2024",
    name: "Construction de la tour centre-ville",
    location: "123, rue Principale, Montréal",
  },
  {
    id: "2",
    code: "HBR-2024",
    name: "Réfection du pont routier",
    location: "Autoroute 401, sortie 23",
  },
  {
    id: "3",
    code: "ICP2-2024",
    name: "Complexe industriel – Phase 2",
    location: "500, boul. Industriel, Laval",
  },
]

const mockUsers: User[] = [
  { id: "1", name: "John Smith", email: "john@example.com", role: "Site Manager" },
  { id: "2", name: "Marie Dupont", email: "marie@example.com", role: "Safety Inspector" },
  { id: "3", name: "Carlos Rodriguez", email: "carlos@example.com", role: "Foreman" },
]

// Inspection sections with items (data-driven)
const rawInspectionSections: InspectionSection[] = [
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
        { id: "epi-8", number: "2.8", label: "Dossard", sectionId: "epi" },
        { id: "epi-9", number: "2.9", label: "Autre", sectionId: "epi" },
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
        { id: "tenue-9", number: "3.9", label: "Cabinet d'aisance accessibles et propres", sectionId: "tenue" },
        { id: "tenue-10", number: "3.10", label: "Clous en saillies abattus ou retirés", sectionId: "tenue" },
        { id: "tenue-11", number: "3.11", label: "Rebuts dans une poubelle avec couver", sectionId: "tenue" },
        { id: "tenue-12", number: "3.12", label: "Local pour les repas propre et en bon état", sectionId: "tenue" },
        { id: "tenue-13", number: "3.13", label: "Équipement électrique mis à la terre", sectionId: "tenue" },
        { id: "tenue-14", number: "3.14", label: "Trousse de premier soins accessible et complète", sectionId: "tenue" },
        { id: "tenue-15", number: "3.15", label: "Bidons de carburant fermés", sectionId: "tenue" },
        { id: "tenue-16", number: "3.16", label: "Douche oculaire", sectionId: "tenue" },
        { id: "tenue-17", number: "3.17", label: "Nombre de secouriste", sectionId: "tenue" },
        { id: "tenue-18", number: "3.18", label: "Procédure d'évacuation", sectionId: "tenue" },
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
        { id: "echafaudage-1", number: "5.1", label: "Échafaudage conforme tel que le plan d'ingénieur", sectionId: "echafaudage" },
        { id: "echafaudage-2", number: "5.2", label: "Échelles et escabeaux de type industriel", sectionId: "echafaudage" },
        { id: "echafaudage-3", number: "5.3", label: "Appui sur base solide", sectionId: "echafaudage" },
        { id: "echafaudage-4", number: "5.4", label: "Échelle dépassant le palier d'au moins 900mm", sectionId: "echafaudage" },
        { id: "echafaudage-5", number: "5.5", label: "Autre", sectionId: "echafaudage" },
      ],
    },
    {
      id: "hauteur",
      key: "hauteur",
      titleKey: "Travaux en hauteur",
      items: [
        { id: "hauteur-1", number: "6.1", label: "Protection contre les chutes conforme et utilisée correctement (Harnais, lignes de vie, point d'ancrage, absorbeur d'énergie)", sectionId: "hauteur" },
        { id: "hauteur-2", number: "6.2", label: "Périmètre de sécurité", sectionId: "hauteur" },
        { id: "hauteur-3", number: "6.3", label: "Aucun travaux superposés", sectionId: "hauteur" },
        { id: "hauteur-4", number: "6.4", label: "Échelles attachées et conformes (Classe 1)", sectionId: "hauteur" },
        { id: "hauteur-5", number: "6.5", label: "Respect des distances d'approche des lignes électriques", sectionId: "hauteur" },
        { id: "hauteur-6", number: "6.6", label: "Protection des ouvertures au plancher", sectionId: "hauteur" },
        { id: "hauteur-7", number: "6.7", label: "Garde corps en bon état et sans ouverture", sectionId: "hauteur" },
        { id: "hauteur-8", number: "6.8", label: "Escaliers et rampes d'accès", sectionId: "hauteur" },
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
      id: "maritime",
      key: "maritime",
      titleKey: "Maritime",
      items: [
        { id: "maritime-1", number: "7.6", label: "Aviron (Rame) (2)", sectionId: "maritime" },
        { id: "maritime-2", number: "7.7", label: "Écope", sectionId: "maritime" },
        { id: "maritime-3", number: "7.8", label: "Gaffe", sectionId: "maritime" },
        { id: "maritime-4", number: "7.8", label: "Dispositif sonore (Flûte)", sectionId: "maritime" },
        { id: "maritime-5", number: "7.9", label: "Trousse de premier soins", sectionId: "maritime" },
        { id: "maritime-6", number: "7.10", label: "Signaux pyrotechnique (3)", sectionId: "maritime" },
        { id: "maritime-7", number: "7.11", label: "Lampe de poche", sectionId: "maritime" },
        { id: "maritime-8", number: "7.12", label: "Extincteur classe B", sectionId: "maritime" },
        { id: "maritime-9", number: "7.13", label: "Ligne d'attache flottante 15 mètres", sectionId: "maritime" },
        { id: "maritime-10", number: "7.14", label: "Couverture de sauvetage (2)", sectionId: "maritime" },
        { id: "maritime-11", number: "7.15", label: "Ancre avec corde ou chaine de 15 mètres", sectionId: "maritime" },
        { id: "maritime-12", number: "7.16", label: "Radio UHF", sectionId: "maritime" },
        { id: "maritime-13", number: "7.17", label: "Extincteur classe B", sectionId: "maritime" },
        { id: "maritime-14", number: "7.18", label: "Masque respiratoire (2)", sectionId: "maritime" },
        { id: "maritime-15", number: "7.19", label: "Autre", sectionId: "maritime" },
      ],
    },
    {
      id: "levage",
      key: "levage",
      titleKey: "Équipement de levage",
      items: [
        { id: "levage-1", number: "8.1", label: "Inspection journalière completée", sectionId: "levage" },
        { id: "levage-2", number: "8.2", label: "Système de communication", sectionId: "levage" },
        { id: "levage-3", number: "8.3", label: "Signaleurs", sectionId: "levage" },
        { id: "levage-4", number: "8.4", label: "Élingues inspectées et en bon état", sectionId: "levage" },
        { id: "levage-5", number: "8.5", label: "Vérification de la direction et la vitesse du vent", sectionId: "levage" },
        { id: "levage-6", number: "8.6", label: "Délimitation de l'aire de levage", sectionId: "levage" },
        { id: "levage-7", number: "8.7", label: "Câble de guidage", sectionId: "levage" },
        { id: "levage-8", number: "8.8", label: "Évaluation du poids des charges à soulever", sectionId: "levage" },
        { id: "levage-9", number: "8.9", label: "Aucun travailleur dans la zone de levage ou sous la charge", sectionId: "levage" },
        { id: "levage-10", number: "8.10", label: "Autre", sectionId: "levage" },
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
        { id: "environnement-4", number: "10.4", label: "Respect de la distance d'un milieu aquatique pour ravitaillement et entretien de la machinerie", sectionId: "environnement" },
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
      id: "scaffolding",
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

// Keep only the French template sections (remove the old English sections that show keys like `inspection.section.*`)
export const inspectionSections: InspectionSection[] = rawInspectionSections.filter((s) => {
  const k = String(s?.key || "")
  const tk = String(s?.titleKey || "")
  if (tk.startsWith("inspection.section.")) return false
  // Extra safety: remove the old English-only blocks if they ever get reintroduced
  if (["ppe", "housekeeping", "fire", "scaffolding", "heights", "water", "lifting", "excavation", "environment", "misc"].includes(k)) return false
  return true
})

/** Default session duration: 1 hour. Can be overridden by user setting sessionDurationMinutes. */
export const DEFAULT_SESSION_DURATION_MINUTES = 60
export const SESSION_DURATION_MS = DEFAULT_SESSION_DURATION_MINUTES * 60 * 1000

/** Session duration options (minutes). 0 = until browser/tab close (use very long expiry). */
export const SESSION_DURATION_OPTIONS = [
  { value: 15, labelKey: "settings.session.15min" },
  { value: 30, labelKey: "settings.session.30min" },
  { value: 60, labelKey: "settings.session.1h" },
  { value: 120, labelKey: "settings.session.2h" },
  { value: 240, labelKey: "settings.session.4h" },
  { value: 480, labelKey: "settings.session.8h" },
  { value: 0, labelKey: "settings.session.untilClose" },
] as const

interface AppState {
  // Auth data
  authUsers: AuthUser[]
  currentAuthUserId: string | null
  /** Timestamp (ms) when the session expires. Null if not logged in. */
  sessionExpiresAt: number | null
  /** User preference: session duration in minutes. 0 = until browser close. Persisted. */
  sessionDurationMinutes: number
  /** True after persisted state has been rehydrated (avoids redirect-to-login on refresh). */
  _hasHydrated: boolean
  userGroups: UserGroup[]
  formAssignments: FormAssignment[]
  azureAdGroupConfigs: AzureADGroupConfig[] // Configuration for 3 role-based Azure AD Groups

  // Legacy form data
  observations: Observation[]
  incidents: Incident[]
  inspections: Inspection[]
  livrables: Livrable[]
  projects: Project[]
  users: User[]
  currentUser: User | null

  // Incident option lists (editable dropdown options)
  incidentOptionLists: {
    accidentTypes: { id: string; label: string }[]
    danger: { id: string; label: string }[]
    contributingCondition: { id: string; label: string }[]
    contributingBehavior: { id: string; label: string }[]
    injuryTypes: { id: string; label: string }[]
    bodyParts: { id: string; label: string }[]
  }

  // Inspection option lists (editable dropdown options)
  inspectionOptionLists: {
    types: { id: string; label: string }[]
  }

  // Observation option lists (editable dropdown options)
  observationOptionLists: {
    types: { id: string; label: string }[]
    danger: { id: string; label: string }[]
    contributingCondition: { id: string; label: string }[]
    contributingBehavior: { id: string; label: string }[]
  }

  // Livrable option lists (editable dropdown options)
  livrableOptionLists: {
    types: { id: string; label: string }[]
    packages: { id: string; label: string }[]
    costCodes: { id: string; label: string }[]
    locations: { id: string; label: string }[]
    scheduleTasks: { id: string; label: string }[]
  }

  // UI state
  isOnline: boolean
  isSyncing: boolean

  // Auth actions
  addAuthUser: (user: AuthUser) => void
  updateAuthUser: (id: string, updates: Partial<AuthUser>) => void
  deleteAuthUser: (id: string) => void
  setCurrentAuthUserId: (id: string | null) => void
  setSessionExpiresAt: (v: number | null) => void
  setSessionDurationMinutes: (minutes: number) => void
  setHasHydrated: () => void
  getCurrentAuthUser: () => AuthUser | null

  // Group actions
  addUserGroup: (group: UserGroup) => void
  updateUserGroup: (id: string, updates: Partial<UserGroup>) => void
  deleteUserGroup: (id: string) => void
  addUserToGroup: (groupId: string, userId: string) => void
  removeUserFromGroup: (groupId: string, userId: string) => void

  // Azure AD Group Configuration actions
  setAzureAdGroupConfig: (role: UserRole, config: Partial<AzureADGroupConfig>) => void
  getAzureAdGroupConfig: (role: UserRole) => AzureADGroupConfig | null
  initializeAzureAdGroupConfigs: () => void

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

  addLivrable: (livrable: Livrable) => void
  updateLivrable: (id: string, updates: Partial<Livrable>) => void
  deleteLivrable: (id: string) => void

  // Projects (Project No) CRUD
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void

  // Livrable option lists CRUD
  addLivrableOption: (
    list: keyof AppState["livrableOptionLists"],
    item: { id: string; label: string }
  ) => void
  updateLivrableOption: (
    list: keyof AppState["livrableOptionLists"],
    id: string,
    updates: Partial<{ label: string }>
  ) => void
  deleteLivrableOption: (list: keyof AppState["livrableOptionLists"], id: string) => void

  // Incident option lists CRUD (list = accidentTypes | danger | contributingCondition | injuryTypes | bodyParts)
  addIncidentOption: (list: keyof AppState["incidentOptionLists"], item: { id: string; label: string }) => void
  updateIncidentOption: (list: keyof AppState["incidentOptionLists"], id: string, updates: Partial<{ label: string }>) => void
  deleteIncidentOption: (list: keyof AppState["incidentOptionLists"], id: string) => void

  // Inspection option lists CRUD
  addInspectionTypeOption: (item: { id: string; label: string }) => void
  updateInspectionTypeOption: (id: string, updates: Partial<{ label: string }>) => void
  deleteInspectionTypeOption: (id: string) => void

  // Observation option lists CRUD
  addObservationTypeOption: (item: { id: string; label: string }) => void
  updateObservationTypeOption: (id: string, updates: Partial<{ label: string }>) => void
  deleteObservationTypeOption: (id: string) => void
  addObservationDangerOption: (item: { id: string; label: string }) => void
  updateObservationDangerOption: (id: string, updates: Partial<{ label: string }>) => void
  deleteObservationDangerOption: (id: string) => void
  addObservationContributingConditionOption: (item: { id: string; label: string }) => void
  updateObservationContributingConditionOption: (id: string, updates: Partial<{ label: string }>) => void
  deleteObservationContributingConditionOption: (id: string) => void
  addObservationContributingBehaviorOption: (item: { id: string; label: string }) => void
  updateObservationContributingBehaviorOption: (id: string, updates: Partial<{ label: string }>) => void
  deleteObservationContributingBehaviorOption: (id: string) => void

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
      sessionExpiresAt: null,
      sessionDurationMinutes: DEFAULT_SESSION_DURATION_MINUTES,
      _hasHydrated: false,
      userGroups: [],
      formAssignments: [],
      azureAdGroupConfigs: [
        { role: "admin", azureGroupId: null, azureGroupName: null, lastSyncedAt: null },
        { role: "supervisor", azureGroupId: null, azureGroupName: null, lastSyncedAt: null },
        { role: "worker", azureGroupId: null, azureGroupName: null, lastSyncedAt: null },
      ],

      // Legacy form data
      observations: [],
      incidents: [],
      inspections: [],
      livrables: [],
      projects: mockProjects,
      users: mockUsers,
      currentUser: mockUsers[0],

      incidentOptionLists: {
        accidentTypes: DEFAULT_ACCIDENT_TYPES,
        danger: DEFAULT_DANGER_OPTIONS,
        contributingCondition: DEFAULT_CONTRIBUTING_CONDITION_OPTIONS,
        contributingBehavior: DEFAULT_CONTRIBUTING_BEHAVIOR_OPTIONS,
        injuryTypes: DEFAULT_INJURY_TYPES,
        bodyParts: DEFAULT_BODY_PARTS,
      },

      inspectionOptionLists: {
        types: [
          { id: "sante-securite", label: "Santé et Sécurité" },
          { id: "safety", label: "Inspection de sécurité" },
          { id: "compliance", label: "Vérification de conformité" },
          { id: "incident-follow-up", label: "Suivi d'incident" },
          { id: "routine", label: "Contrôle routinier" },
        ],
      },

      observationOptionLists: {
        types: [
          { id: "unsafe-condition", label: "Condition dangereuse" },
          { id: "unsafe-behavior", label: "Comportement dangereux" },
          { id: "near-miss", label: "Quasi-accident" },
          { id: "good-practice", label: "Bonne pratique" },
          { id: "hazard-awareness", label: "Sensibilisation aux dangers" },
          { id: "ppe-non-compliance", label: "Non-conformité ÉPI" },
          { id: "housekeeping", label: "Problème d'entretien" },
          { id: "tool-equipment", label: "Problème d'outil/équipement" },
        ],
        danger: [
          { id: "amputation", label: "Amputation" },
          { id: "amiantose", label: "Amiantose" },
          { id: "asphyxie", label: "Asphyxie" },
          { id: "morsure", label: "Morsure" },
          { id: "ecchymose", label: "Ecchymose (contusion)" },
          { id: "brulure-chimique", label: "Brûlure (chimique)" },
          { id: "brulure-chaleur", label: "Brûlure (chaleur)" },
          { id: "cancer", label: "Cancer" },
          { id: "canal-carpien", label: "Syndrome du canal carpien" },
          { id: "douleur-thoracique", label: "Douleur thoracique (angine de poitrine)" },
          { id: "commotion", label: "Commotion" },
          { id: "maladie-contagieuse", label: "Maladie contagieuse" },
          { id: "ecrasement", label: "Écrasement" },
          { id: "coupure", label: "Coupure (lacération)" },
          { id: "dislocation", label: "Dislocation" },
          { id: "maladie-poussiere", label: "Maladie de la poussière" },
          { id: "choc-electrique", label: "Choc électrique" },
          { id: "perte-oculaire", label: "Perte oculaire (énucléation)" },
          { id: "corps-etranger", label: "Corps étranger" },
          { id: "fracture", label: "Fracture" },
          { id: "congelation", label: "Congélation" },
          { id: "deficience-auditive", label: "Déficience auditive" },
          { id: "perte-auditive", label: "Perte auditive" },
          { id: "crise-cardiaque", label: "Crise cardiaque (infarctus du myocarde)" },
          { id: "epuisement-chaleur", label: "Épuisement dû la chaleur (prostration)" },
          { id: "coup-chaleur", label: "Coup de chaleur" },
          { id: "hernie", label: "Hernie" },
          { id: "hypothermie", label: "Hypothermie" },
          { id: "infection", label: "Infection" },
          { id: "inflammation", label: "Inflammation" },
          { id: "perte-conscience", label: "Perte de conscience (syncope)" },
          { id: "trouble-mental", label: "Trouble mental" },
          { id: "stress-mental", label: "Stress mental" },
          { id: "empoisonnement-chimique", label: "Empoisonnement (chimique)" },
          { id: "empoisonnement-general", label: "Empoisonnement (général)" },
          { id: "empoisonnement-metal", label: "Empoisonnement (métal)" },
          { id: "ponction", label: "Ponction" },
          { id: "radiation", label: "Radiation" },
          { id: "eruption-cutanee", label: "Éruption cutanée/plaies/ampoules (dermatite)" },
          { id: "troubles-respiratoires", label: "Troubles respiratoires" },
          { id: "rupture", label: "Rupture" },
          { id: "egratignure", label: "Égratignure (abrasion)" },
          { id: "demembrement", label: "Démembrement" },
          { id: "silicose", label: "Silicose" },
          { id: "entorse", label: "Entorse" },
          { id: "piqure", label: "Piqûre" },
          { id: "foulure", label: "Foulure" },
          { id: "dechirure", label: "Déchirure" },
          { id: "vasculaire", label: "Vasculaire" },
          { id: "perte-vision", label: "Perte de vision" },
        ],
        contributingCondition: [
          { id: "acces-sortie", label: "Accès / Sortie" },
          { id: "vetements", label: "Vêtements" },
          { id: "environnement", label: "Environnement" },
          { id: "equipement", label: "Équipement" },
          { id: "ergonomie", label: "Ergonomie" },
          { id: "conditions-sol", label: "Conditions du sol" },
          { id: "garde-barriere", label: "Garde / barrière" },
          { id: "entretien-menager", label: "Entretien ménager" },
          { id: "information-signalisation", label: "Information signalisation" },
          { id: "eclairage", label: "Éclairage" },
          { id: "selection-materiaux", label: "Sélection de matériaux" },
          { id: "bruit", label: "Bruit" },
          { id: "epi", label: "ÉPI" },
          { id: "securite", label: "Sécurité" },
          { id: "etaiement-contreventement", label: "Étaiement / contreventement" },
          { id: "energie-emmagasinee", label: "Énergie emmagasinée" },
          { id: "outil", label: "Outil" },
          { id: "circulation", label: "Circulation" },
          { id: "controles-circulation", label: "Contrôles de circulation" },
          { id: "ventilation", label: "Ventilation" },
          { id: "meteo", label: "Météo" },
          { id: "disposition-poste-travail", label: "Disposition de poste de travail" },
        ],
        contributingBehavior: [...DEFAULT_CONTRIBUTING_BEHAVIOR_OPTIONS],
      },

      livrableOptionLists: {
        types: [
          { id: "type-product-data", label: "Données produit" },
          { id: "type-sample", label: "Échantillon" },
          { id: "type-shop-drawing", label: "Dessin d’atelier" },
          { id: "type-method", label: "Méthodologie" },
        ],
        packages: [
          { id: "pkg-1", label: "Paquet 1" },
          { id: "pkg-2", label: "Paquet 2" },
          { id: "pkg-3", label: "Paquet 3" },
        ],
        costCodes: [
          { id: "cc-01", label: "Code de coût 01" },
          { id: "cc-02", label: "Code de coût 02" },
          { id: "cc-03", label: "Code de coût 03" },
        ],
        locations: [
          { id: "loc-site", label: "Chantier" },
          { id: "loc-warehouse", label: "Entrepôt" },
          { id: "loc-office", label: "Bureau" },
          { id: "loc-other", label: "Autre" },
        ],
        scheduleTasks: [
          { id: "task-planning", label: "Planification" },
          { id: "task-procurement", label: "Approvisionnement" },
          { id: "task-installation", label: "Installation" },
          { id: "task-commissioning", label: "Mise en service" },
        ],
      },

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
      setSessionExpiresAt: (v) => set({ sessionExpiresAt: v }),
      setHasHydrated: () => set({ _hasHydrated: true }),
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

      // Azure AD Group Configuration actions
      setAzureAdGroupConfig: (role, config) =>
        set((state) => ({
          azureAdGroupConfigs: state.azureAdGroupConfigs.map((c) =>
            c.role === role ? { ...c, ...config } : c,
          ),
        })),
      getAzureAdGroupConfig: (role) => {
        const state = get()
        return state.azureAdGroupConfigs.find((c) => c.role === role) || null
      },
      initializeAzureAdGroupConfigs: () =>
        set((state) => {
          // Only initialize if configs don't exist
          if (state.azureAdGroupConfigs.length === 0) {
            return {
              azureAdGroupConfigs: [
                { role: "admin", azureGroupId: null, azureGroupName: null, lastSyncedAt: null },
                { role: "supervisor", azureGroupId: null, azureGroupName: null, lastSyncedAt: null },
                { role: "worker", azureGroupId: null, azureGroupName: null, lastSyncedAt: null },
              ],
            }
          }
          return state
        }),

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
      deleteAssignment: (formId) => set((state) => ({
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

      // Livrables
      addLivrable: (livrable) => set((state) => ({ livrables: [...state.livrables, livrable] })),
      updateLivrable: (id, updates) =>
        set((state) => ({
          livrables: state.livrables.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s)),
        })),
      deleteLivrable: (id) => set((state) => ({ livrables: state.livrables.filter((s) => s.id !== id) })),

      // Projects (Project No)
      addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
      updateProject: (id, updates) =>
        set((state) => ({ projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),
      deleteProject: (id) => set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

      // Livrable option lists
      addLivrableOption: (list, item) =>
        set((state) => ({
          livrableOptionLists: {
            ...state.livrableOptionLists,
            [list]: [...state.livrableOptionLists[list], item],
          } as AppState["livrableOptionLists"],
        })),
      updateLivrableOption: (list, id, updates) =>
        set((state) => ({
          livrableOptionLists: {
            ...state.livrableOptionLists,
            [list]: state.livrableOptionLists[list].map((it) => (it.id === id ? { ...it, ...updates } : it)),
          } as AppState["livrableOptionLists"],
        })),
      deleteLivrableOption: (list, id) =>
        set((state) => ({
          livrableOptionLists: {
            ...state.livrableOptionLists,
            [list]: state.livrableOptionLists[list].filter((it) => it.id !== id),
          } as AppState["livrableOptionLists"],
        })),

      // Incident option lists (list = accidentTypes | danger | contributingCondition | injuryTypes | bodyParts)
      // Use || [] so missing lists (e.g. after old persisted state) don't throw when adding/editing/deleting
      addIncidentOption: (list, item) =>
        set((state) => {
          const currentList = state.incidentOptionLists[list] || []
          return {
            incidentOptionLists: {
              ...state.incidentOptionLists,
              [list]: [...currentList, item],
            },
          }
        }),
      updateIncidentOption: (list, id, updates) =>
        set((state) => {
          const currentList = state.incidentOptionLists[list] || []
          return {
            incidentOptionLists: {
              ...state.incidentOptionLists,
              [list]: currentList.map((it) => (it.id === id ? { ...it, ...updates } : it)),
            },
          }
        }),
      deleteIncidentOption: (list, id) =>
        set((state) => {
          const currentList = state.incidentOptionLists[list] || []
          return {
            incidentOptionLists: {
              ...state.incidentOptionLists,
              [list]: currentList.filter((it) => it.id !== id),
            },
          }
        }),

      // Inspection option lists
      addInspectionTypeOption: (item) =>
        set((state) => ({
          inspectionOptionLists: {
            ...state.inspectionOptionLists,
            types: [...state.inspectionOptionLists.types, item],
          },
        })),
      updateInspectionTypeOption: (id, updates) =>
        set((state) => ({
          inspectionOptionLists: {
            ...state.inspectionOptionLists,
            types: state.inspectionOptionLists.types.map((it) => (it.id === id ? { ...it, ...updates } : it)),
          },
        })),
      deleteInspectionTypeOption: (id) =>
        set((state) => ({
          inspectionOptionLists: {
            ...state.inspectionOptionLists,
            types: state.inspectionOptionLists.types.filter((it) => it.id !== id),
          },
        })),

      // Observation option lists
      addObservationTypeOption: (item) =>
        set((state) => ({
          observationOptionLists: {
            ...state.observationOptionLists,
            types: [...state.observationOptionLists.types, item],
          },
        })),
      updateObservationTypeOption: (id, updates) =>
        set((state) => ({
          observationOptionLists: {
            ...state.observationOptionLists,
            types: state.observationOptionLists.types.map((it) => (it.id === id ? { ...it, ...updates } : it)),
          },
        })),
      deleteObservationTypeOption: (id) =>
        set((state) => ({
          observationOptionLists: {
            ...state.observationOptionLists,
            types: state.observationOptionLists.types.filter((it) => it.id !== id),
          },
        })),

      // Observation danger options
      addObservationDangerOption: (item) =>
        set((state) => ({
          observationOptionLists: {
            ...state.observationOptionLists,
            danger: [...state.observationOptionLists.danger, item],
          },
        })),
      updateObservationDangerOption: (id, updates) =>
        set((state) => ({
          observationOptionLists: {
            ...state.observationOptionLists,
            danger: state.observationOptionLists.danger.map((it) => (it.id === id ? { ...it, ...updates } : it)),
          },
        })),
      deleteObservationDangerOption: (id) =>
        set((state) => ({
          observationOptionLists: {
            ...state.observationOptionLists,
            danger: state.observationOptionLists.danger.filter((it) => it.id !== id),
          },
        })),

      // Observation contributing condition options
      addObservationContributingConditionOption: (item) =>
        set((state) => ({
          observationOptionLists: {
            ...state.observationOptionLists,
            contributingCondition: [...state.observationOptionLists.contributingCondition, item],
          },
        })),
      updateObservationContributingConditionOption: (id, updates) =>
        set((state) => ({
          observationOptionLists: {
            ...state.observationOptionLists,
            contributingCondition: state.observationOptionLists.contributingCondition.map((it) => (it.id === id ? { ...it, ...updates } : it)),
          },
        })),
      deleteObservationContributingConditionOption: (id) =>
        set((state) => ({
          observationOptionLists: {
            ...state.observationOptionLists,
            contributingCondition: state.observationOptionLists.contributingCondition.filter((it) => it.id !== id),
          },
        })),

      // Observation contributing behavior options
      addObservationContributingBehaviorOption: (item) =>
        set((state) => ({
          observationOptionLists: {
            ...state.observationOptionLists,
            contributingBehavior: [...state.observationOptionLists.contributingBehavior, item],
          },
        })),
      updateObservationContributingBehaviorOption: (id, updates) =>
        set((state) => ({
          observationOptionLists: {
            ...state.observationOptionLists,
            contributingBehavior: state.observationOptionLists.contributingBehavior.map((it) => (it.id === id ? { ...it, ...updates } : it)),
          },
        })),
      deleteObservationContributingBehaviorOption: (id) =>
        set((state) => ({
          observationOptionLists: {
            ...state.observationOptionLists,
            contributingBehavior: state.observationOptionLists.contributingBehavior.filter((it) => it.id !== id),
          },
        })),

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
          ...state.livrables
            .filter((s) => s.status === "draft" || s.status === "in-progress")
            .map((s) => ({
              id: s.id,
              type: "livrable" as const,
              number: s.number,
              title: s.title,
              projectName: state.projects.find((p) => p.id === s.projectId)?.name || "",
              status: s.status,
              updatedAt: new Date(s.updatedAt),
              syncStatus: s.syncStatus,
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
          ...state.livrables
            .filter((s) => s.status === "submitted")
            .map((s) => ({
              id: s.id,
              type: "livrable" as const,
              number: s.number,
              title: s.title,
              projectName: state.projects.find((p) => p.id === s.projectId)?.name || "",
              status: s.status,
              updatedAt: new Date(s.updatedAt),
              syncStatus: s.syncStatus,
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
        livrables: state.livrables,
        projects: state.projects,
        incidentOptionLists: state.incidentOptionLists,
        inspectionOptionLists: state.inspectionOptionLists,
        observationOptionLists: state.observationOptionLists,
        livrableOptionLists: state.livrableOptionLists,
        // Auth data - persist for offline use
        authUsers: state.authUsers,
        userGroups: state.userGroups,
        currentAuthUserId: state.currentAuthUserId,
        sessionExpiresAt: state.sessionExpiresAt,
        sessionDurationMinutes: state.sessionDurationMinutes,
        formAssignments: state.formAssignments,
      }),
    },
  ),
)
