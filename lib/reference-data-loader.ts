/**
 * Reference Data Loader
 * Loads static reference data from JSON files for use throughout the application
 */

import accidentsData from "./reference-data/accidents.json"
import injuriesData from "./reference-data/injuries.json"
import bodyPartsData from "./reference-data/body-parts.json"
import observationTypesData from "./reference-data/observation-types.json"
import inspectionSectionsData from "./reference-data/inspection-sections.json"

export interface AccidentType {
  id: string
  label: string
  description: string
  riskLevel: "low" | "medium" | "high" | "critical"
}

export interface InjuryType {
  id: string
  label: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
}

export interface BodyPart {
  id: string
  label: string
  category: "upper" | "lower" | "torso" | "other"
}

export interface ObservationType {
  id: string
  label: string
  description: string
  category: string
}

export interface InspectionItem {
  id: string
  number: string
  label: string
  sectionId: string
  reference?: string
}

export interface InspectionSection {
  id: string
  key: string
  titleKey: string
  title?: string
  instruction?: string
  items: InspectionItem[]
}

/**
 * Get all accident types
 */
export function getAccidentTypes(): AccidentType[] {
  return (accidentsData as any).accidents || []
}

/**
 * Get accident type by ID
 */
export function getAccidentTypeById(id: string): AccidentType | undefined {
  return ((accidentsData as any).accidents || []).find((a: AccidentType) => a.id === id)
}

/**
 * Get all injury types
 */
export function getInjuryTypes(): InjuryType[] {
  return (injuriesData as any).injuries || []
}

/**
 * Get injury type by ID
 */
export function getInjuryTypeById(id: string): InjuryType | undefined {
  return ((injuriesData as any).injuries || []).find((i: InjuryType) => i.id === id)
}

/**
 * Get all body parts
 */
export function getBodyParts(): BodyPart[] {
  return (bodyPartsData as any).bodyParts || []
}

/**
 * Get body part by ID
 */
export function getBodyPartById(id: string): BodyPart | undefined {
  return ((bodyPartsData as any).bodyParts || []).find((b: BodyPart) => b.id === id)
}

/**
 * Get body parts by category
 */
export function getBodyPartsByCategory(category: string): BodyPart[] {
  return ((bodyPartsData as any).bodyParts || []).filter((b: BodyPart) => b.category === category)
}

/**
 * Get all observation types
 */
export function getObservationTypes(): ObservationType[] {
  return (observationTypesData as any).observationTypes || []
}

/**
 * Get observation type by ID
 */
export function getObservationTypeById(id: string): ObservationType | undefined {
  return ((observationTypesData as any).observationTypes || []).find((o: ObservationType) => o.id === id)
}

/**
 * Get all inspection sections
 */
export function getInspectionSections(): InspectionSection[] {
  return ((inspectionSectionsData as any).inspectionSections || []) as InspectionSection[]
}

/**
 * Get inspection section by ID
 */
export function getInspectionSectionById(id: string): InspectionSection | undefined {
  return ((inspectionSectionsData as any).inspectionSections || []).find((s: InspectionSection) => s.id === id)
}

/**
 * Get all inspection items (flattened)
 */
export function getAllInspectionItems(): InspectionItem[] {
  return (((inspectionSectionsData as any).inspectionSections || []) as InspectionSection[]).flatMap((section) => section.items)
}

/**
 * Get inspection items by section ID
 */
export function getInspectionItemsBySection(sectionId: string): InspectionItem[] {
  const section = getInspectionSectionById(sectionId)
  return section?.items || []
}
