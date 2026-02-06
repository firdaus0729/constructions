"use client"

import jsPDF from "jspdf"

// Shared PDF styling constants
const SEP_GRAY: [number, number, number] = [180, 180, 180] // separator line color
const LINK_BLUE: [number, number, number] = [0, 0, 255]   // link text color

function getJsPdfImageFormat(url: string, mimeType?: string): "PNG" | "JPEG" {
  const t = (mimeType || "").toLowerCase()
  if (t.includes("png")) return "PNG"
  if (t.includes("jpg") || t.includes("jpeg")) return "JPEG"
  // Infer from data URL prefix if present
  if (url.startsWith("data:image/png")) return "PNG"
  if (url.startsWith("data:image/jpg") || url.startsWith("data:image/jpeg")) return "JPEG"
  // Default to JPEG (most common)
  return "JPEG"
}

// Professional PDF generator for all forms with logo and header matching the template
export async function generateProfessionalPDF(data: {
  title: string
  type: "observation" | "inspection" | "incident" | "livrable"
  number: string
  projectInfo?: string
  details: Record<string, string | undefined>
  statistics?: Record<string, number>
  sections: Array<{
    title: string
    content: string
  }>
  images?: Array<{
    url: string
    name: string
  }>
  filename: string
}) {
  if (typeof window === "undefined") return

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin

  let yPosition = margin + 5

  // Helper to check page break
  const checkPageBreak = (spaceNeeded: number) => {
    if (yPosition + spaceNeeded > pageHeight - margin) {
      doc.addPage()
      yPosition = margin + 5
    }
  }

  // Try to load logo as image - non-blocking
  try {
    if (typeof window !== "undefined" && window.location) {
      const logoUrl = "/logo.png"
      doc.addImage(logoUrl, "PNG", margin, yPosition - 3, 20, 20)
    }
  } catch (error) {
    console.log("Logo not available")
  }

  // Company information (top left, right of logo space)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Construction Interlag", margin + 25, yPosition)
  
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("926 av Simard, #201", margin + 25, yPosition + 4)
  doc.text("Chambly, Quebec J3L 4X2", margin + 25, yPosition + 7)
  doc.text("Téléphone : 514-323-6710", margin + 25, yPosition + 10)
  doc.text("Télécopieur : 514-323-3882", margin + 25, yPosition + 13)

  // Project info on the right side
  if (data.projectInfo) {
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    const projectLines = doc.splitTextToSize(data.projectInfo, 70)
    let rightY = yPosition
    projectLines.forEach((line: string) => {
      doc.text(line, pageWidth - margin - 70, rightY, { align: "left" })
      rightY += 3.5
    })
  }

  yPosition += 25

  // Divider line
  doc.setDrawColor(150, 150, 150)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 5

  // Title section - centered
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  const titleText = `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} : ${data.title}`
  const titleLines = doc.splitTextToSize(titleText, contentWidth)
  titleLines.forEach((line: string, index: number) => {
    doc.text(line, pageWidth / 2, yPosition + (index * 5), { align: "center" })
  })
  yPosition += titleLines.length * 5 + 3

  // Statistics boxes (if provided) - for inspections
  if (data.statistics && Object.keys(data.statistics).length > 0) {
    const statsEntries = Object.entries(data.statistics)
    const boxWidth = (contentWidth - 2) / statsEntries.length
    const boxHeight = 14
    let boxX = margin + 1

    doc.setFontSize(7)
    statsEntries.forEach(([label, value]) => {
      // Draw box with border
      doc.setFillColor(240, 240, 240)
      doc.setDrawColor(200, 200, 200)
      doc.rect(boxX, yPosition, boxWidth, boxHeight, "FD")

      // Add value (large)
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text(String(value), boxX + boxWidth / 2, yPosition + 7.5, { align: "center" })

      // Add label (small)
      doc.setFontSize(6)
      doc.setFont("helvetica", "normal")
      const labelLines = doc.splitTextToSize(label, boxWidth - 2)
      labelLines.slice(0, 2).forEach((labelLine: string, idx: number) => {
        doc.text(labelLine, boxX + boxWidth / 2, yPosition + 9.5 + (idx * 2.5), { align: "center" })
      })

      boxX += boxWidth
    })
    yPosition += boxHeight + 5
  }

  // Details section - two columns
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Détails", margin, yPosition)
  yPosition += 6

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  
  const detailKeys = Object.keys(data.details).filter(k => data.details[k])
  const midPoint = Math.ceil(detailKeys.length / 2)
  const leftColX = margin
  const rightColX = pageWidth / 2 + 5

  let leftY = yPosition
  let rightY = yPosition
  
  detailKeys.forEach((key, index) => {
    const value = data.details[key]
    if (value) {
      if (index < midPoint) {
        doc.setFont("helvetica", "bold")
        doc.text(`${key}`, leftColX, leftY)
        doc.setFont("helvetica", "normal")
        const valueLines = doc.splitTextToSize(String(value), 40)
        doc.text(valueLines, leftColX + 45, leftY)
        leftY += 4.5
      } else {
        doc.setFont("helvetica", "bold")
        doc.text(`${key}`, rightColX, rightY)
        doc.setFont("helvetica", "normal")
        const valueLines = doc.splitTextToSize(String(value), 40)
        doc.text(valueLines, rightColX + 45, rightY)
        rightY += 4.5
      }
    }
  })

  yPosition = Math.max(leftY, rightY) + 3

  // Content sections
  data.sections.forEach((section) => {
    if (section.content && section.content.trim()) {
      checkPageBreak(12)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.text(section.title, margin, yPosition)
      yPosition += 5

      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.5)
      const lines = doc.splitTextToSize(section.content, contentWidth)
      lines.forEach((line: string) => {
        checkPageBreak(3)
        doc.text(line, margin, yPosition)
        yPosition += 3
      })
      yPosition += 2
    }
  })

  // Images section (Pièces jointes)
  if (data.images && data.images.length > 0) {
    checkPageBreak(15)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Pièces jointes", margin, yPosition)
    yPosition += 5

    doc.setFontSize(7.5)
    doc.setFont("helvetica", "normal")
    doc.text("Photos", margin, yPosition)
    yPosition += 4

    for (const image of data.images) {
      try {
        checkPageBreak(70)
        const imgWidth = contentWidth * 0.5
        const imgHeight = imgWidth * 0.75
        doc.addImage(image.url, getJsPdfImageFormat(image.url), margin, yPosition, imgWidth, imgHeight)
        yPosition += imgHeight + 2

        doc.setFontSize(6)
        doc.text(image.name, margin, yPosition)
        yPosition += 4
      } catch (error) {
        console.error("Failed to add image:", error)
        doc.setFontSize(7)
        doc.text(`[Image: ${image.name}]`, margin, yPosition)
        yPosition += 3
      }
    }
  }

  // Footer with generation date
  doc.setFontSize(6)
  doc.setTextColor(120, 120, 120)
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(
      `Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`,
      margin,
      pageHeight - 5
    )
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth - margin - 20, pageHeight - 5)
  }

  doc.save(data.filename)
}

export async function exportLivrableAsPdf(livrable: any, filename: string = "Livrable.pdf") {
  if (typeof window === "undefined") return

  const jsPDFMod = (await import("jspdf")).default
  const doc = new jsPDFMod({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const check = (need: number) => {
    if (y + need > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  // Header (reuse same style as professional generator)
  try {
    doc.addImage("/logo.png", "PNG", margin, y, 20, 20)
  } catch {}
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Construction Interlag", margin + 25, y + 4)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("926 av Simard, #201", margin + 25, y + 8)
  doc.text("Chambly, Quebec J3L 4X2", margin + 25, y + 11.5)
  doc.text("Téléphone : 514-323-6710", margin + 25, y + 15)
  doc.text("Télécopieur : 514-323-3882", margin + 25, y + 18.5)

  y += 25
  doc.setDrawColor(150, 150, 150)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  // Title
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  const titleText = `Livrable : ${livrable.title || livrable.number || ""}`
  doc.splitTextToSize(titleText, contentWidth).forEach((ln: string, idx: number) => {
    doc.text(ln, pageWidth / 2, y + idx * 6, { align: "center" })
  })
  y += 12

  // Details
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("Détails", margin, y)
  y += 5
  doc.setFont("helvetica", "normal")

  const details: Array<[string, string]> = [
    ["Numéro", livrable.number || "-"],
    ["Statut", livrable.status || "-"],
    ["Type de livrable", livrable.submittalType || "-"],
    ["Paquet de livrable", livrable.submittalPackage || "-"],
    ["Code de coût", livrable.costCode || "-"],
    ["Emplacement", livrable.location || "-"],
    ["Tâche du calendrier", livrable.scheduleTask || "-"],
  ]

  details.forEach(([k, v]) => {
    check(6)
    doc.setFont("helvetica", "bold")
    doc.text(`${k} :`, margin, y)
    doc.setFont("helvetica", "normal")
    const lines = doc.splitTextToSize(String(v || "-"), contentWidth - 40)
    lines.forEach((ln: string, idx: number) => {
      doc.text(ln, margin + 40, y + idx * 4)
    })
    y += Math.max(5, lines.length * 4)
  })

  // Description
  if (livrable.description) {
    y += 3
    check(12)
    doc.setFont("helvetica", "bold")
    doc.text("Description", margin, y)
    y += 5
    doc.setFont("helvetica", "normal")
    const lines = doc.splitTextToSize(String(livrable.description), contentWidth)
    lines.forEach((ln: string) => {
      check(4)
      doc.text(ln, margin, y)
      y += 4
    })
  }

  // Linked drawings
  const links = String(livrable.linkedDrawings || "")
    .split("\n")
    .map((s: string) => s.trim())
    .filter(Boolean)
  if (links.length > 0) {
    y += 3
    check(12)
    doc.setFont("helvetica", "bold")
    doc.text("Dessins liés", margin, y)
    y += 5
    doc.setFont("helvetica", "normal")
    doc.setTextColor(0, 0, 255)
    links.forEach((u: string) => {
      check(4)
      doc.textWithLink(u, margin, y, { url: u })
      y += 4
    })
    doc.setTextColor(0, 0, 0)
  }

  // Attachments (names only; images are handled in other PDFs, keep simple here)
  if (Array.isArray(livrable.attachments) && livrable.attachments.length > 0) {
    y += 3
    check(12)
    doc.setFont("helvetica", "bold")
    doc.text("Pièces jointes", margin, y)
    y += 5
    doc.setFont("helvetica", "normal")
    livrable.attachments.forEach((a: any) => {
      check(4)
      doc.text(`- ${a?.name || "Fichier"}`, margin, y)
      y += 4
    })
  }

  doc.save(filename)
}

// Lightweight client-side PDF export utility with dynamic imports.
// Designed for Next.js on Vercel: runs only on the client.
export async function exportElementAsPdf(options?: {
  elementId?: string
  filename?: string
  quality?: number // 0..1
  scale?: number // canvas scale
}) {
  const {
    elementId,
    filename = `form-${new Date().toISOString().slice(0, 10)}.pdf`,
    quality = 0.98,
    scale = 2,
  } = options || {}

  if (typeof window === "undefined") return

  const target = elementId ? document.getElementById(elementId) : document.body
  if (!target) return

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ])

  const canvas = await html2canvas(target, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    windowWidth: document.documentElement.clientWidth,
  })
  const imgData = canvas.toDataURL("image/png", quality)

  // A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const pageWidth = 210
  const pageHeight = 297

  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let position = 0
  let heightLeft = imgHeight

  // Add first page
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  // Add extra pages if needed
  while (heightLeft > 0) {
    position = position - pageHeight
    pdf.addPage()
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(filename)
}

// Export observation — Excel Perfect style: clean layout, thin lines, continuation header, Plans liés section, Activité with status box.
export async function exportObservationAsPdf(
  observation: any,
  filename?: string,
  opts?: { projects?: { id: string; name?: string; code?: string; location?: string }[]; users?: { id: string; name?: string }[] }
) {
  if (typeof window === "undefined") return
  const observationNumber = observation.number ?? observation.id?.slice(-6) ?? ""
  const finalFilename = filename ?? `Formulaire Observation ${observationNumber}.pdf`

  const jsPDF = (await import("jspdf")).default
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  const contentWidth = pageWidth - margin * 2

  // Get store data for resolving labels and project info
  const getStoreData = () => {
    if (typeof window === "undefined") return null
    try {
      const raw = localStorage.getItem("construction-forms-storage")
      if (!raw) return null
      return JSON.parse(raw).state
    } catch {
      return null
    }
  }

  const state = getStoreData()
  const observationOptionLists = state?.observationOptionLists || { types: [], danger: [], contributingCondition: [], contributingBehavior: [] }
  const incidentOptionLists = state?.incidentOptionLists || { danger: [], contributingCondition: [] }

  // Resolve project info
  let projectName = observation.projectName || ""
  let projectLocation = observation.projectLocation || ""
  const project = opts?.projects?.find((p) => p.id === observation.projectId) || state?.projects?.find((p: any) => p.id === observation.projectId)
  if (project) {
    projectName = project.name || projectName
    projectLocation = project.location || projectLocation
  }

  // Project line for header: number + full name (French format like reference)
  const projectNumberPart = observation.projectNumber || (project as any)?.code || ""
  const projectHeaderLine = [projectNumberPart, projectName].filter(Boolean).join(" ").trim()

  // Resolve observation type label
  const getObservationTypeLabel = (typeId: string): string => {
    if (!typeId) return "MES-COR"
    const typeOption = observationOptionLists.types?.find((t: any) => t.id === typeId)
    return typeOption?.label || typeId
  }

  // Resolve Danger and Condition contributive from incident options (same as incident form)
  const getDangerLabel = (dangerId: string): string => {
    if (!dangerId) return ""
    const dangerOption = (incidentOptionLists.danger || []).find((d: any) => d.id === dangerId)
    return dangerOption?.label || dangerId
  }

  const getContributingConditionLabel = (conditionId: string): string => {
    if (!conditionId) return ""
    const conditionOption = (incidentOptionLists.contributingCondition || []).find((c: any) => c.id === conditionId)
    return conditionOption?.label || conditionId
  }

  const getContributingBehaviorLabel = (behaviorId: string): string => {
    if (!behaviorId) return ""
    const behaviorOption = observationOptionLists.contributingBehavior?.find((b: any) => b.id === behaviorId)
    return behaviorOption?.label || behaviorId
  }

  // Format title with date suffix (e.g., "_20250929")
  const getTitleDateSuffix = (): string => {
    const dateField = observation.date || observation.createdAt
    if (!dateField) return ""
    const d = new Date(dateField)
    if (isNaN(d.getTime())) return ""
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `_${year}${month}${day}`
  }

  const typeLabel = getObservationTypeLabel(observation.type)
  const titleDateSuffix = getTitleDateSuffix()
  const observationTitle = `Observation Risque de sécurité N°${observationNumber} : ${typeLabel}: ${observation.title || ""}${titleDateSuffix}`

  const thinLine = () => {
    // Reference PDFs use very light separators (not dark/black)
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.2)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5
    doc.setDrawColor(0, 0, 0)
  }

  const drawContinuationHeader = () => {
    // No top divider line in the reference continuation header
    // Each section occupies half the horizontal space (like flex space-between)
    const leftHalfWidth = pageWidth / 2 - margin - 5
    const rightHalfWidth = pageWidth / 2 - margin - 5
    const rightHalfEnd = pageWidth - margin
    
    // Left half: Observation title
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    const titleLines = doc.splitTextToSize(observationTitle, leftHalfWidth)
    titleLines.forEach((ln: string, idx: number) => {
      doc.text(ln, margin, y + (idx * 4))
    })
    
    // Right half: Project text (right-aligned, bold)
    doc.setFontSize(7)
    doc.setFont("helvetica", "bold") // "Projet: xxx" text should be bold
    const projText = projectHeaderLine ? `Projet : ${projectHeaderLine}` : ""
    const projLines = doc.splitTextToSize(projText, rightHalfWidth)
    let py = y
    projLines.slice(0, 2).forEach((ln: string) => {
      doc.text(ln, rightHalfEnd, py, { align: "right" })
      py += 3.5
    })
    
    y += Math.max(titleLines.length * 4, projLines.length * 3.5) + 2
  }

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - margin - 15) {
      doc.addPage()
      y = margin
      drawContinuationHeader()
    }
  }

  let y = margin

  // Parse dates as local dates to avoid timezone issues (day before problem)
  const parseLocalDate = (dateStr: string | Date | null | undefined): Date | null => {
    if (!dateStr) return null
    if (dateStr instanceof Date) {
      // If it's already a Date, create a new one with local date components to avoid timezone issues
      return new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate())
    }
    // If it's a date string like "2024-01-15" or "2024-01-15T00:00:00.000Z", parse it as local date
    if (typeof dateStr === "string") {
      // Try to extract date parts from ISO string or simple date string
      const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (dateMatch) {
        const year = parseInt(dateMatch[1], 10)
        const month = parseInt(dateMatch[2], 10) - 1 // Month is 0-indexed
        const day = parseInt(dateMatch[3], 10)
        return new Date(year, month, day)
      }
      // Try parsing as other formats
      const parts = dateStr.split(/[-/]/)
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
        const day = parseInt(parts[2], 10)
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          return new Date(year, month, day)
        }
      }
      // Fallback: try parsing as Date and extract local components
      const d = new Date(dateStr)
      if (!isNaN(d.getTime())) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate())
      }
    }
    return null
  }

  // Helper function to format date as "DD mmm. YYYY"
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return ""
    const d = parseLocalDate(date)
    if (!d) return ""
    const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }

  // Helper function to format date/time as "DD/MM/YYYY à HH h MM EDT" or "FDT"
  const formatDateTime = (date: Date | string | null | undefined, useFDT: boolean = false): string => {
    if (!date) return ""
    const d = parseLocalDate(date)
    if (!d) return ""
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, "0")
    const minutes = String(d.getMinutes()).padStart(2, "0")
    const timezone = useFDT ? "FDT" : "EDT"
    return `${day}/${month}/${year} à ${hours} h ${minutes} ${timezone}`
  }

  // Header: logo left + company info, project info right (no outer frame for observations)
  try {
    doc.addImage("/logo.png", "PNG", margin, y, 26, 26)
  } catch (e) {
    // ignore
  }

  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Construction Interlag", margin + 30, y + 5)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("926 av Simard, #201", margin + 30, y + 10)
  doc.text("Chambly, Quebec J3L 4X2", margin + 30, y + 14)
  doc.text("Téléphone : 514-323-6710", margin + 30, y + 18)
  doc.text("Télécopieur : 514-323-3882", margin + 30, y + 22)

  doc.setFontSize(8)
  let ry = y + 5
  if (projectHeaderLine) {
    // Render "Projet : {projectHeaderLine}" in bold
    doc.setFont("helvetica", "bold") // "Projet: xxx" text should be bold
    doc.splitTextToSize(`Projet : ${projectHeaderLine}`, 80).forEach((ln: string) => {
      doc.text(ln, pageWidth - margin, ry, { align: "right" })
      ry += 4
    })
    // Render location separately in normal font (if exists)
    if (projectLocation) {
      doc.setFont("helvetica", "normal") // Location should not be bold
      doc.splitTextToSize(projectLocation, 80).forEach((ln: string) => {
        doc.text(ln, pageWidth - margin, ry, { align: "right" })
        ry += 4
      })
    }
  } else if (projectLocation) {
    doc.setFont("helvetica", "normal")
    doc.splitTextToSize(projectLocation, 80).forEach((ln: string) => {
      doc.text(ln, pageWidth - margin, ry, { align: "right" })
      ry += 4
    })
  }

  y += 32
  thinLine()
  y += 1

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  const titleLines = doc.splitTextToSize(observationTitle, contentWidth)
  titleLines.forEach((ln: string, idx: number) => {
    doc.text(ln, pageWidth / 2, y + idx * 6, { align: "center" })
  })
  y += titleLines.length * 3 + 2.5
  thinLine()
  y += titleLines.length * 1

  // Details two-column layout - exact order from image
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")

  const getStoreUsers = (): any[] => {
    if (opts?.users && opts.users.length > 0) return opts.users
    if (typeof window === "undefined") return []
    try {
      const raw = localStorage.getItem("construction-forms-storage")
      if (!raw) return []
      const parsed = JSON.parse(raw)
      const state = parsed?.state
      return state?.authUsers || state?.users || []
    } catch {
      return []
    }
  }

  const getCreatorName = () => {
    if (observation.creatorName) return observation.creatorName
    const users = getStoreUsers()
    const user = users.find((u: any) => u.id === observation.creatorId)
    return user?.name ?? observation.creatorId ?? ""
  }

  const getAssignedPersonName = () => {
    if (observation.assignedPersonName) return observation.assignedPersonName
    const users = getStoreUsers()
    const user = users.find((u: any) => u.id === observation.assignedPersonId)
    return user?.name ?? observation.assignedPersonId ?? ""
  }

  const formatDistribution = (): string => {
    if (!observation.distribution || observation.distribution.length === 0) return ""
    const users = getStoreUsers()
    if (Array.isArray(observation.distribution) && users.length > 0) {
      return observation.distribution
        .map((userId: string) => {
          const user = users.find((u: any) => u.id === userId)
          return user ? `${user.name} (Construction Interlag)` : userId
        })
        .join("\n")
    }
    return Array.isArray(observation.distribution) ? observation.distribution.join(", ") : String(observation.distribution || "")
  }

  // Status translation - match what is displayed in the form
  const statusMap: Record<string, string> = {
    "draft": "Brouillon",
    "in-progress": "En Progression",
    "submitted": "Soumis",
    "open": "Initié", // Match form display: status.initiated = "Initié"
    "closed": "Fermé" // Match form display: status.closed = "Fermé"
  }
  const statusText = statusMap[observation.status] || observation.status || ""

  // Priority translation (original PDF uses "Urgent" for high priority)
  const priorityMap: Record<string, string> = {
    "low": "Faible",
    "medium": "Moyen",
    "high": "Élevé",
    "critical": "Urgent",
    "urgent": "Urgent"
  }
  const priorityText = priorityMap[observation.priority] || observation.priority || ""

  const leftX = margin
  const rightX = pageWidth / 2 + 5
  const labelWidth = 45
  const rightColW = pageWidth - margin - rightX
  let leftY = y
  let rightY = y

  // Left column fields (exact order from original PDF)
  const leftFields: Array<[string, string]> = [
    ["Origine", ""], // Origine value must be empty
    ["Créé par", `${getCreatorName()} (Construction Interlag)`],
    ["Personne assignée", `${getAssignedPersonName()} (Construction Interlag)`],
    ["Date de notification", (() => {
      const dateValue = observation.date || observation.notificationDate || observation.createdAt
      if (!dateValue) return ""
      const parsedDate = parseLocalDate(dateValue)
      return parsedDate ? formatDate(parsedDate) : ""
    })()],
    ["Lieu", observation.location || observation.projectLocation || (observation as any).lieu || ""],
    ["Date d'échéance", (() => {
      if (!observation.dueDate) return ""
      const parsedDate = parseLocalDate(observation.dueDate)
      return parsedDate ? formatDate(parsedDate) : ""
    })()],
    ["Condition contributive", getContributingConditionLabel(observation.safetyAnalysis?.contributingCondition || "")],
    ["Danger", getDangerLabel(observation.safetyAnalysis?.danger || "")],
    ["Section du devis", observation.cnsstSection || "SSE - SANTÉ SÉCURITÉ ENVIRONNEMENT"],
  ]

  // Right column fields
  const plansLiesValue = (observation as any).plansLies || observation.linkedDrawings || "" // Leave empty instead of "-"
  const rightFields: Array<[string, string]> = [
    ["Statut", statusText],
    ["Date de création", (() => {
      if (!observation.createdAt) return ""
      const parsedDate = parseLocalDate(observation.createdAt)
      return parsedDate ? formatDate(parsedDate) : ""
    })()],
    ["Distribution", formatDistribution()],
    ["Priorité", priorityText],
    ["Métier", observation.trade || "Charge de projet"],
    ["Privé(e)", (observation as any).private || (observation as any).isPrivate ? "Oui" : "Non"],
    ["Comportement contributif", getContributingBehaviorLabel(observation.safetyAnalysis?.contributingBehavior || "")],
  ]

  // Draw left column (labels bold, values normal; consistent row spacing to match original)
  const rowGap = 1
  leftFields.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, leftX, leftY)
    doc.setFont("helvetica", "normal")
    const vLines = doc.splitTextToSize(String(value || ""), pageWidth / 2 - labelWidth - 5)
    vLines.forEach((line: string, idx: number) => {
      doc.text(line, leftX + labelWidth, leftY + (idx * 4))
    })
    leftY += Math.max(5, vLines.length * 4) + rowGap
  })

  // Draw right column
  rightFields.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, rightX, rightY)
    doc.setFont("helvetica", "normal")
    const vLines = doc.splitTextToSize(String(value || ""), pageWidth / 2 - labelWidth - 5)
    vLines.forEach((line: string, idx: number) => {
      doc.text(line, rightX + labelWidth, rightY + (idx * 4))
    })
    rightY += Math.max(5, vLines.length * 4) + rowGap
  })

  y = Math.max(leftY, rightY) + 8

  // Description section - key-value layout (label left, value right)
  if (observation.description) {
    checkPageBreak(15)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("Description", leftX, y)
    doc.setFont("helvetica", "normal")
    const descValue = observation.description || ""
    const descLines = doc.splitTextToSize(descValue, pageWidth / 2 - labelWidth - 5)
    descLines.forEach((line: string, idx: number) => {
      doc.text(line, leftX + labelWidth, y + (idx * 4))
    })
    y += Math.max(5, descLines.length * 4) + rowGap
  }

  // Plans liés - key-value format (always show, leave empty - no hyphen)
  checkPageBreak(10)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("Plans liés", leftX, y)
  doc.setFont("helvetica", "normal")
  const plansValue = plansLiesValue || "" // Leave empty instead of "-"
  if (plansValue) {
    const plansLines = doc.splitTextToSize(String(plansValue), pageWidth / 2 - labelWidth - 5)
    plansLines.forEach((line: string, idx: number) => {
      doc.text(line, leftX + labelWidth, y + (idx * 4))
    })
    y += Math.max(5, plansLines.length * 4) + rowGap
  } else {
    // Empty field - just add spacing
    y += 5 + rowGap
  }

  // Mesures correctives - check if it's a separate field or embedded in description
  // If it's embedded, it's already handled in the description section above
  // If it's a separate field, display it here
  const correctiveMeasures = (observation as any).correctiveMeasures || (observation as any).mesuresCorrectives
  if (correctiveMeasures && !observation.description?.includes("Mesures correctives")) {
    checkPageBreak(15)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Mesures correctives:", margin, y)
    y += 6
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    const mLines = doc.splitTextToSize(correctiveMeasures, contentWidth)
    mLines.forEach((ln: string) => {
      checkPageBreak(4)
      doc.text(ln, margin, y)
      y += 4
    })
    y += 4
  }

  // Plans liés handled above (right side, under Article de référence)

  // Pièces jointes (on continuation page: thin line under title, 2x2 grid, thin border per image, blue underlined filename)
  const images = observation.attachments?.filter((a: any) => a.type?.startsWith("image/")) || []
  if (images.length > 0) {
    const imgGap = 6
    const imgW = (contentWidth - imgGap) / 2
    const imgH = 45
    const filenameHeight = 6 // Space for filename below image (3mm text + 3mm spacing)
    const rowSpacing = 4 // Narrow gap between rows (top filename to bottom image)
    const cellHeight = imgH + filenameHeight // Total height per cell (image + filename)
    const rowHeight = cellHeight + rowSpacing // Total height per row including spacing
    const rows = Math.ceil(images.length / 2)
    // Calculate actual height: line adjustment (2) + after line (6) + title (6) + title after (6) + images + final spacing (6)
    const estimatedHeight = 2 + 6 + 6 + 6 + rows * rowHeight + 6
    checkPageBreak(estimatedHeight)
    y -= 2
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.2)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Pièces jointes", margin, y)
    
    y += 6

    const baseY = y
    // Use consistent border color (BORDER_GRAY from inspection PDF)
    const BORDER_GRAY: [number, number, number] = [210, 210, 210]
    doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
    doc.setLineWidth(0.2)
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = margin + col * (imgW + imgGap)
      const cellY = baseY + row * rowHeight
      
      // Draw border around the image area first (wider and lighter border)
      // Use lighter gray color and thicker line width
      const LIGHT_BORDER_GRAY: [number, number, number] = [230, 230, 230] // Lighter gray for image border
      const borderPadding = 0.5 // Padding from cell edge
      const borderX = x + borderPadding
      const borderY = cellY + borderPadding
      const borderW = imgW - (borderPadding * 2)
      const borderH = imgH - (borderPadding * 2)
      
      doc.setDrawColor(LIGHT_BORDER_GRAY[0], LIGHT_BORDER_GRAY[1], LIGHT_BORDER_GRAY[2])
      doc.setLineWidth(0.5) // Wider border (0.5mm instead of 0.2mm)
      doc.rect(borderX, borderY, borderW, borderH)
      
      // Draw image inside the border with margin/padding
      const imageMargin = 2 // Margin between border and image
      const imgX = borderX + imageMargin
      const imgY = borderY + imageMargin
      const actualImgW = borderW - (imageMargin * 2)
      const actualImgH = borderH - (imageMargin * 2)
      
      try {
        doc.addImage(img.url, getJsPdfImageFormat(img.url, img.type), imgX, imgY, actualImgW, actualImgH)
      } catch (e) {
        // placeholder
      }
      
      // Draw filename below image, centered (borderless - no border around text)
      doc.setFontSize(7)
      doc.setTextColor(0, 0, 255)
      const name = img.name || "GetAttachmentThumbnail.jpg"
      const nameX = x + imgW / 2
      const nameY = cellY + imgH + 3
      doc.text(name, nameX, nameY, { align: "center" })
      
      // Draw underline for filename
      const tw = doc.getTextWidth(name)
      doc.setDrawColor(0, 0, 255)
      doc.line(nameX - tw / 2, nameY + 0.5, nameX + tw / 2, nameY + 0.5)
      
      // Reset colors
      doc.setTextColor(0, 0, 0)
      doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
      doc.setLineWidth(0.2) // Reset line width
    }
    
    doc.setDrawColor(0, 0, 0)
    y = baseY + rows * rowHeight
    y += 6
  }

  // Non-image attachments (file names only, per reference)
  const otherAttachments = observation.attachments?.filter((a: any) => !a.type?.startsWith("image/")) || []
  if (otherAttachments.length > 0) {
    checkPageBreak(8 + otherAttachments.length * 4)
    if (images.length === 0) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.text("Pièces jointes", margin, y)
      y += 6
    }
    otherAttachments.forEach((att: any) => {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(0, 0, 255)
      doc.text(att.name || "Fichier", margin, y)
      doc.setTextColor(0, 0, 0)
      y += 5
    })
    y += 4
  }

  // Activité (1): always show (per reference PDF page 2) - thin line above, name+date left, status box right
  checkPageBreak(28)
  thinLine()
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("Activité (1)", margin, y)
  y += 5
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  const activityName = getCreatorName()
  const activityDate = observation.updatedAt || observation.createdAt
  const activityDateStr = activityDate ? formatDateTime(activityDate, false) : ""
  
  // Flex layout: left section (name/date) + right section (status box with width 100%)
  const leftSectionWidth = 60 // Approximate width for name/date section
  const boxX = margin + leftSectionWidth + 5 // Start after left section with small gap
  const boxW = pageWidth - margin - boxX // Fill remaining width (100% of remaining space)
  const boxY = y - 1 // Align box top with name line
  const boxH = 10 // Box height
  
  // Left side: Name and date stacked vertically
  doc.text(activityName, margin, y)
  if (activityDateStr) doc.text(activityDateStr, margin, y + 4)
  
  // Right side: Status box - fills remaining width (like flex with width: 100%)
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.2)
  doc.rect(boxX, boxY, boxW, boxH)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(0, 0, 0)
  doc.text(`Statut modifié : ${statusText}`, boxX + 3, boxY + 6.5)
  y += Math.max(12, (activityDateStr ? 8 : 4)) // Adjust based on content height

  // Footer: thin dark line above, then company | Page X sur Y | Imprimé le
  const pageCount = (doc as any).internal.getNumberOfPages()
  const footerY = pageHeight - 8

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.2)
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2)
    doc.setDrawColor(0, 0, 0)
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text("Construction Interlag", margin, footerY + 2)
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, footerY + 2, { align: "center" })
    // Use FDT for page 2+, EDT for page 1 (matching original PDF)
    const printDateStr = formatDateTime(new Date(), i > 1)
    doc.text(`Imprimé le : ${printDateStr}`, pageWidth - margin, footerY + 2, { align: "right" })
    doc.setTextColor(0, 0, 0)
  }

  doc.save(finalFilename)
}

// Export inspection with proper formatting and embedded images

// New PDF export matching French template with checkboxes and layout
import { inspectionSections } from "./store"
export async function exportInspectionAsPdf(
  inspection: any,
  filename?: string,
  opts?: { projects?: { id: string; name?: string; code?: string; location?: string }[]; users?: { id: string; name?: string }[] }
) {
  if (typeof window === "undefined") return
  const inspectionNumber = inspection.number ?? inspection.id?.slice(-6) ?? ""
  const finalFilename = filename ?? `Formulaire Inspection ${inspectionNumber}.pdf`

  const jsPDF = (await import("jspdf")).default
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  let y = margin

  const LIGHT_GRAY: [number, number, number] = [245, 245, 245]
  const BORDER_GRAY: [number, number, number] = [210, 210, 210]

  const formatDateFR = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
  const formatTimeFR = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h ")

  const resolveProject = () => {
    const project = opts?.projects?.find((p) => p.id === inspection.projectId)
    return {
      projectNumber: inspection.projectNumber ?? project?.code ?? "",
      projectName: inspection.projectName ?? project?.name ?? (inspection.projectId || ""),
      projectLocation: inspection.projectLocation ?? project?.location ?? "",
    }
  }
  const resolveCreator = () => {
    const creator = opts?.users?.find((u) => u.id === inspection.creatorId)
    return inspection.createdBy ?? creator?.name ?? inspection.creatorName ?? inspection.creatorId ?? "Utilisateur"
  }
  const { projectNumber, projectName, projectLocation } = resolveProject()
  const responderName = resolveCreator()
  const companyName = "Construction Interlag"

  const resolveClosedBy = () => {
    if (!inspection.closedById) return ""
    const user = opts?.users?.find((u: any) => u.id === inspection.closedById)
    return user?.name ?? inspection.closedById
  }

  const thinLine = () => {
    // Light gray line color #e3e3e3 (RGB: 227, 227, 227)
    doc.setDrawColor(227, 227, 227)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5
  }

  const drawLightRow = (x: number, yPos: number, w: number, h: number) => {
    doc.setFillColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2])
    doc.rect(x, yPos, w, h, "F")
    doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
    doc.rect(x, yPos, w, h)
    doc.setDrawColor(0, 0, 0)
  }

  const drawContinuationHeader = () => {
    // Layout: "Inspection XXXX" on left, "Projet: XXXX" on right (space-between)
    const leftHalfWidth = (pageWidth - 2 * margin) / 2
    const rightHalfWidth = (pageWidth - 2 * margin) / 2
    
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text(`Inspection N°${inspectionNumber} - Inspection journalière`, margin, 12)
    doc.setFont("helvetica", "bold") // Make project text bold
    doc.setFontSize(7)
    let projRight = ""
    if (projectNumber && projectName) {
      projRight = `Projet : Numéro de projet: ${projectNumber}, Nom: ${projectName}`
    } else if (projectNumber) {
      projRight = `Projet : Numéro de projet: ${projectNumber}`
    } else if (projectName) {
      projRight = `Projet : Nom: ${projectName}`
    }
    const projLines = doc.splitTextToSize(projRight, rightHalfWidth - 2)
    let py = 12
    projLines.slice(0, 2).forEach((ln: string) => {
      doc.text(ln, pageWidth - margin, py, { align: "right" })
      py += 3.5
    })
    doc.setFont("helvetica", "normal") // Reset to normal
    // Light gray line color #e3e3e3 (RGB: 227, 227, 227)
    doc.setDrawColor(227, 227, 227)
    doc.setLineWidth(0.3)
    doc.line(margin, 14, pageWidth - margin, 14)
    y = 18
  }

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - margin - 15) {
      doc.addPage()
      y = margin
      drawContinuationHeader()
    }
  }

  // ----- First page: header (no red frame) -----
  try {
    doc.addImage("/logo.png", "PNG", margin, y, 22, 22)
  } catch {}
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Construction Interlag", margin + 26, y + 5)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("926 av Simard, #201", margin + 26, y + 10)
  doc.text("Chambly, Quebec J3L 4X2", margin + 26, y + 14)
  doc.text("Téléphone : 514-323-6710", margin + 26, y + 18)
  doc.text("Télécopieur : 514-323-3882", margin + 26, y + 22)

  doc.setFontSize(7)
  doc.setFont("helvetica", "bold") // Make project text bold
  let projY = y + 5
  let projText = ""
  if (projectNumber && projectName) {
    projText = `Projet : Numéro de projet: ${projectNumber}, Nom: ${projectName}`
  } else if (projectNumber) {
    projText = `Projet : Numéro de projet: ${projectNumber}`
  } else if (projectName) {
    projText = `Projet : Nom: ${projectName}`
  }
  if (projText) {
    doc.splitTextToSize(projText, 85).forEach((line: string) => {
      doc.text(line, pageWidth - margin, projY, { align: "right" })
      projY += 3.5
    })
  }
  doc.setFont("helvetica", "normal") // Reset to normal for location
  if (projectLocation) {
    doc.splitTextToSize(projectLocation, 85).forEach((line: string) => {
      doc.text(line, pageWidth - margin, projY, { align: "right" })
      projY += 3.5
    })
  }

  y += 26
  thinLine()

  // ----- Title: centered, bold -----
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(`Inspection : Inspection journalière N°${inspectionNumber}`, pageWidth / 2, y, { align: "center" })
  y += 2
  thinLine()

  // ----- Summary: 5 dark gray boxes with white text (match original exactly) -----
  const allItems = inspectionSections.flatMap((s: any) => s?.items || [])
  const totalItems = allItems.length
  const allResponses = inspection.responses || []
  const conforming = allResponses.filter((r: any) => r.response === "conforming").length
  const nonConforming = allResponses.filter((r: any) => r.response === "non-conforming").length
  const notApplicable = allResponses.filter((r: any) => r.response === "not-applicable" || r.response === "na").length
  const unanswered = allItems.filter((item: any) => {
    const r = allResponses.find((rr: any) => rr.itemId === item.id)
    return !r || r.response == null || r.response === undefined
  }).length

  const sumY = y + 3 // Add spacing after title line
  const boxH = 18
  const totalWidth = pageWidth - 2 * margin
  const boxCount = 5
  const gap = 3 // Gap between boxes (space-between effect)
  const totalGaps = gap * (boxCount - 1)
  const boxW = (totalWidth - totalGaps) / boxCount
  // Light gray background #f2f2f2 (RGB: 242, 242, 242)
  const SUMMARY_BOX_GRAY: [number, number, number] = [242, 242, 242]
  for (let idx = 0; idx < 5; idx++) {
    const x = margin + idx * (boxW + gap)
    // Fill with light gray (no border)
    doc.setFillColor(SUMMARY_BOX_GRAY[0], SUMMARY_BOX_GRAY[1], SUMMARY_BOX_GRAY[2])
    doc.rect(x, sumY, boxW, boxH, "F")
  }
  doc.setDrawColor(0, 0, 0)
  doc.setTextColor(0, 0, 0) // Black text
  const summaryValues = [`${totalItems}/${totalItems}`, `${conforming}`, `${nonConforming}`, `${notApplicable}`, `${unanswered}`]
  const summaryLabels = ["Articles inspectés", "Conforme", "Déficient", "S.O.", "Neutre"]
  summaryValues.forEach((val, idx) => {
    const centerX = margin + idx * (boxW + gap) + boxW / 2
    // Value: bold, larger, centered at top
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text(val, centerX, sumY + 8, { align: "center" })
    // Label: normal, smaller, centered below value
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.text(summaryLabels[idx], centerX, sumY + 14, { align: "center" })
  })
  doc.setTextColor(0, 0, 0)
  y = sumY + boxH + 6 // Add spacing after summary boxes

  // ----- Détails de l'inspection (table-like) -----
  // Removed "Détails de l'inspection" heading as requested
  const leftX = margin
  const rightX = pageWidth / 2 + 2
  const lineH = 4.2
  const formatDateShort = (d: Date) => {
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = String(d.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
  }
  // Status mapping: translate to French
  const statusLabel =
    inspection.status === "closed" && inspection.closedById
      ? `Fermé par ${resolveClosedBy()} le ${formatDateShort(inspection.updatedAt ? new Date(inspection.updatedAt) : new Date())}`
      : inspection.status === "closed"
        ? "Fermé"
        : inspection.status === "in-progress"
          ? "En Progression"
          : inspection.status === "draft"
            ? "Brouillon"
              : String(inspection.status || "open").toLowerCase() === "open"
              ? "Initié"
              : String(inspection.status || "")

  const labelWidth = 45
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  const detailsLeft: Array<[string, string]> = [
    ["Type", inspection.type || ""],
    ["Métier", inspection.metier || ""],
    ["Section du devis", inspection.sectionDevis || ""],
    ["Plans liés", inspection.plansLies || ""],
    ["Description", inspection.description || ""],
    ["Pièces jointes", inspection.attachments?.length > 0 ? `${inspection.attachments.length}` : ""],
  ]
  const detailsRight: Array<[string, string]> = [
    ["Statut", statusLabel],
    ["Lieu", inspection.lieu || ""],
    ["Créé par", responderName || ""],
  ]
  const maxLines = Math.max(detailsLeft.length, detailsRight.length)
  for (let i = 0; i < maxLines; i++) {
    const [ll, lv] = detailsLeft[i] || ["", ""]
    const [rl, rv] = detailsRight[i] || ["", ""]
    if (ll) {
      doc.setFont("helvetica", "bold")
      doc.text(ll, leftX, y)
      doc.setFont("helvetica", "normal")
      doc.text(String(lv || ""), leftX + labelWidth, y)
    }
    if (rl) {
      doc.setFont("helvetica", "bold")
      doc.text(rl, rightX, y)
      doc.setFont("helvetica", "normal")
      doc.text(String(rv || ""), rightX + labelWidth, y)
    }
    y += lineH + 3.5 // Add margin-bottom: 15px equivalent (3.5mm * 4.3 ≈ 15px)
  }
  thinLine()

  // ----- Date fields (removed "Détails de L'Inspection" heading as requested) -----
  doc.setFontSize(8)
    // Parse dates as local dates to avoid timezone issues (day before problem)
    const parseLocalDate = (dateStr: string | Date | null | undefined): Date | null => {
      if (!dateStr) return null
      if (dateStr instanceof Date) {
        // If it's already a Date, create a new one with local date components to avoid timezone issues
        return new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate())
      }
      // If it's a date string like "2024-01-15" or "2024-01-15T00:00:00.000Z", parse it as local date
      if (typeof dateStr === "string") {
        // Try to extract date parts from ISO string or simple date string
        const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (dateMatch) {
          const year = parseInt(dateMatch[1], 10)
          const month = parseInt(dateMatch[2], 10) - 1 // Month is 0-indexed
          const day = parseInt(dateMatch[3], 10)
          return new Date(year, month, day)
        }
        // Try parsing as other formats
        const parts = dateStr.split(/[-/]/)
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10)
          const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
          const day = parseInt(parts[2], 10)
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            return new Date(year, month, day)
          }
        }
        // Fallback: try parsing as Date and extract local components
        const d = new Date(dateStr)
        if (!isNaN(d.getTime())) {
          return new Date(d.getFullYear(), d.getMonth(), d.getDate())
        }
      }
      return null
    }
    const inspectionDate = inspection.inspectionDate 
      ? parseLocalDate(inspection.inspectionDate) 
      : (inspection.createdAt ? parseLocalDate(inspection.createdAt) : new Date())
    const dueDate = inspection.dueDate ? parseLocalDate(inspection.dueDate) : null
    doc.setFont("helvetica", "bold")
    doc.text("Date de l'inspection", leftX, y)
    doc.setFont("helvetica", "normal")
    doc.text(inspectionDate ? formatDateFR(inspectionDate) : "", leftX + labelWidth, y)
    doc.setFont("helvetica", "bold")
    doc.text("Date d'échéance", rightX, y)
    doc.setFont("helvetica", "normal")
    doc.text(dueDate ? formatDateFR(dueDate) : "", rightX + labelWidth, y)
    y += lineH + 3.5 // Add margin-bottom: 15px equivalent
    doc.setFont("helvetica", "bold")
    doc.text("Point de contact", leftX, y)
    doc.setFont("helvetica", "normal")
    doc.text(inspection.contactPoint || "", leftX + labelWidth, y)
    doc.setFont("helvetica", "bold")
    doc.text("Entrepreneur responsable", rightX, y)
    doc.setFont("helvetica", "normal")
    doc.text(inspection.contractor || "", rightX + labelWidth, y)
    y += lineH + 3.5 // Add margin-bottom: 15px equivalent
  doc.setFont("helvetica", "bold")
  doc.text("Personne(s) assignée(s)", leftX, y)
  doc.setFont("helvetica", "normal")
  const assigned =
    Array.isArray(inspection.distribution) && inspection.distribution.length > 0
      ? inspection.distribution
          .map((d: any) => (typeof d === "string" ? d : d?.email || d?.userId || ""))
          .filter(Boolean)
          .join(", ")
      : ""
  doc.splitTextToSize(assigned || "", pageWidth - 2 * margin - 50).forEach((ln: string) => {
    doc.text(ln, leftX + labelWidth, y)
    y += 4
  })
  y += 5
  thinLine()

  inspectionSections.forEach((section: any) => {
    checkPageBreak(30)

    // Section header: title + summary on right, no full-width grey box (match original)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    const sectionTitle = section.titleKey || section.title || ""
    doc.text(sectionTitle, margin, y + 5)

    const sectionItems = section.items || []
    const sectionResponses = sectionItems.map((item: any) => allResponses.find((r: any) => r.itemId === item.id))
    const sectionConforming = sectionResponses.filter((r: any) => r?.response === "conforming").length
    const sectionNonConforming = sectionResponses.filter((r: any) => r?.response === "non-conforming").length
    const sectionNotApplicable = sectionResponses.filter((r: any) => r?.response === "not-applicable" || r?.response === "na").length
    const sectionNeutral = sectionResponses.filter((r: any) => !r || r.response == null || r.response === undefined).length

    doc.setFontSize(8)
    // Summary on right: numbers bold, labels bold, narrower spacing
    const summaryItems = [
      { count: sectionNeutral, label: "Neutre" },
      { count: sectionConforming, label: "Conforme" },
      { count: sectionNonConforming, label: "Déficient" },
      { count: sectionNotApplicable, label: "S.O." }
    ]
    // Calculate total width needed with narrower gaps
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    const totalWidth = summaryItems.reduce((acc, item) => {
      const countW = doc.getTextWidth(`${item.count}`)
      const labelW = doc.getTextWidth(item.label)
      return acc + countW + 2 + labelW
    }, 0)
    const availableWidth = 70 // Narrower area
    const totalGaps = summaryItems.length - 1
    const gap = totalGaps > 0 ? Math.max(3, (availableWidth - totalWidth) / totalGaps) : 0 // Minimum 3mm gap, narrower spacing
    // Add margin-right: 35px equivalent (35px ≈ 9.2mm)
    let summaryX = pageWidth - margin - availableWidth - 9.2
    summaryItems.forEach((item, idx) => {
      doc.setFont("helvetica", "bold") // Numbers are bold
      doc.text(`${item.count}`, summaryX, y + 5)
      const countWidth = doc.getTextWidth(`${item.count}`)
      doc.text(item.label, summaryX + countWidth + 2, y + 5) // Labels are also bold
      const itemWidth = countWidth + 2 + doc.getTextWidth(item.label)
      summaryX += itemWidth + (idx < summaryItems.length - 1 ? gap : 0)
    })
    y += 10
    // Removed thinLine() - no line below section header

    doc.setFontSize(8)
    // Unified piece: every item = top grey block (title, italic activity, checkboxes with labels below) + thin line + bottom white block (response with name bold, comment, photo)
    const topBlockHeight = 14 // Reduced height for tighter spacing
    const boxSize = 3
    const checkboxLabels = ["Conforme", "Échec", "S.O."]
    const checkboxSpacing = 20 // Slightly wider for better alignment

    sectionItems.forEach((item: any) => {
      const response = allResponses.find((r: any) => r.itemId === item.id)
      const hasResponse = response && response.response !== null && response.response !== undefined
      const responseCount = hasResponse ? 1 : 0
      const attachmentsCount = response?.attachments?.length || 0
      const photosCount = response?.attachments?.filter((a: any) => a.type?.startsWith("image/")).length || 0
      const commentsCount = response?.comment ? 1 : 0
      const observationsCount = 0
      const hasPhotos = response?.attachments?.filter((a: any) => a.type?.startsWith("image/")).length > 0
      
      // Check if we can fit at least the header on this page
      checkPageBreak(topBlockHeight + 5)
      
      let itemStartY = y // Track the start of this item (for outer borders)
      const originalItemStartY = y // Keep original start Y for border drawing
      const itemWidth = pageWidth - 2 * margin
      
      // Track which sections have been drawn (for border drawing)
      let statsSectionDrawn = false
      let textSectionStartY = 0
      let textSectionEndY = 0
      let textSectionDrawn = false
      let imageSectionStartY = 0
      let imageSectionEndY = 0
      let imageSectionDrawn = false
      let itemStartPage = (doc as any).internal.getCurrentPageInfo().pageNumber // Track which page the item starts on
      
      // ----- Section 1: Statistics (top grey block) -----
      const statsSectionY = y
      statsSectionDrawn = true
      doc.setFillColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2])
      doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
      doc.setLineWidth(0.2)
      // Draw top border of statistics section (will be part of outer border)
      doc.rect(margin, statsSectionY, itemWidth, topBlockHeight, "FD")
      doc.setDrawColor(0, 0, 0)

      // Center title and activity text vertically in the cell (like flexbox justify-content: center)
      // Calculate total height of both text elements
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      const titleHeight = 3.5 // Approximate line height for title
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7)
      const activityHeight = 3 // Approximate line height for activity
      const totalTextHeight = titleHeight + activityHeight
      const gapBetween = 1 // Small gap between title and activity
      const totalContentHeight = totalTextHeight + gapBetween
      
      // Center the content block vertically in the cell
      const contentStartY = statsSectionY + (topBlockHeight - totalContentHeight) / 2
      const titleY = contentStartY + titleHeight
      const activityY = contentStartY + titleHeight + gapBetween + activityHeight

      // Title - vertically centered
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.text(`${item.number} ${item.label}`, margin + 2, titleY)

      // Activity text - vertically centered below title, ITALIC
      doc.setFont("helvetica", "italic") // Changed to italic
      doc.setFontSize(7)
      const activityText = `Activité : ${responseCount} Changement${responseCount > 1 ? "s" : ""} de réponse, ${attachmentsCount} Pièces jointes, ${photosCount} Photo${photosCount > 1 ? "s" : ""}, ${commentsCount} Commentaire${commentsCount > 1 ? "s" : ""}, ${observationsCount} Observation${observationsCount > 1 ? "s" : ""}`
      doc.text(activityText, margin + 2, activityY)

      // Checkboxes on right: boxes aligned with labels directly below, ticks centered in boxes
      const boxY = statsSectionY + 3.5 // Slightly lower for better alignment
      const labelY = statsSectionY + 9.5 // Labels directly below boxes
      let boxX = pageWidth - margin - 58 // Adjusted position
      
      // Check response value - handle multiple possible formats
      const responseValue = response?.response
      const isChecked = (idx: number) => {
        if (!response || responseValue == null || responseValue === undefined || responseValue === "") return false
        // Convert to string and normalize
        const val = String(responseValue).toLowerCase().trim()
        // Check for conforming
        if (idx === 0) {
          return val === "conforming" || val === "conforme"
        }
        // Check for non-conforming
        if (idx === 1) {
          return val === "non-conforming" || val === "nonconforming" || val === "échec" || val === "echec" || val === "non-conforme"
        }
        // Check for not-applicable
        if (idx === 2) {
          return val === "not-applicable" || val === "notapplicable" || val === "na" || val === "n/a" || val === "s.o." || val === "so" || val === "sans objet"
        }
        return false
      }
      checkboxLabels.forEach((label, idx) => {
        // Draw checkbox
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.2)
        doc.rect(boxX, boxY, boxSize, boxSize)
        // Draw tick if checked - draw manually with lines for better compatibility
        if (isChecked(idx)) {
          doc.setDrawColor(0, 0, 0)
          doc.setLineWidth(0.4)
          const centerX = boxX + boxSize / 2
          const centerY = boxY + boxSize / 2
          // Draw checkmark: two lines forming a check
          // Left part: from bottom-left to center
          doc.line(centerX - 1, centerY, centerX - 0.5, centerY + 0.8)
          // Right part: from center to top-right
          doc.line(centerX - 0.5, centerY + 0.8, centerX + 1, centerY - 0.8)
        }
        // Draw label directly below checkbox, centered
        doc.setFontSize(6)
        doc.setFont("helvetica", "normal")
        doc.text(label, boxX + boxSize / 2, labelY, { align: "center" })
        boxX += checkboxSpacing
      })

      y = statsSectionY + topBlockHeight
      
      // Draw horizontal divider between statistics and text sections
      doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
      doc.setLineWidth(0.2)
      doc.line(margin, y, pageWidth - margin, y)
      
      // ----- Section 2: Text (response + comment) - separate borders for each update -----
      textSectionStartY = y
      // Prepare updates as separate groups (each update gets its own border)
      const updates: Array<{ type: 'response' | 'comment', lines: Array<{ type: 'response' | 'comment-header' | 'comment-line', content: string, height: number, namePart?: string, restPart?: string }> }> = []
      
      if (hasResponse && response) {
        const responseDate = response.updatedAt || response.createdAt || inspection.updatedAt || inspection.createdAt || new Date()
        const dateStr = formatDateFR(new Date(responseDate))
        const timeStr = formatTimeFR(new Date(responseDate))
        let responseStatus = ""
        if (response.response === "conforming") responseStatus = "Conforme"
        else if (response.response === "non-conforming") responseStatus = "Échec"
        else if (response.response === "not-applicable" || response.response === "na") responseStatus = "N/A"
        const namePart = `${responderName} (${companyName})`
        const restPart = ` a répondu ${responseStatus} le ${dateStr} à ${timeStr} EDT`
        updates.push({
          type: 'response',
          lines: [{ type: 'response', content: `${namePart}${restPart}`, height: 4, namePart, restPart }]
        })
      }

      if (response && response.comment) {
        const commentDate = response.updatedAt || response.createdAt || new Date()
        const commentDateStr = formatDateFR(new Date(commentDate))
        const commentTimeStr = formatTimeFR(new Date(commentDate))
        const namePart = responderName + " (" + companyName + ")"
        const restPart = " a laissé un commentaire le " + commentDateStr + " à " + commentTimeStr + " EDT"
        const commentLines = doc.splitTextToSize(response.comment, pageWidth - 2 * margin - 10)
        const commentUpdateLines: Array<{ type: 'comment-header' | 'comment-line', content: string, height: number, namePart?: string, restPart?: string }> = [
          { type: 'comment-header', content: `${namePart}${restPart}`, height: 3.5, namePart, restPart },
          ...commentLines.map((line: string) => ({ type: 'comment-line' as const, content: line, height: 3.5 }))
        ]
        updates.push({
          type: 'comment',
          lines: commentUpdateLines
        })
      }
      
      // If no content, add blank space
      if (updates.length === 0) {
        updates.push({
          type: 'comment',
          lines: [{ type: 'comment-line', content: '', height: 8 }]
        })
      }
      
      // Draw each update with its own border
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      let pageBeforeText = (doc as any).internal.getCurrentPageInfo().pageNumber
      
      for (let updateIdx = 0; updateIdx < updates.length; updateIdx++) {
        const update = updates[updateIdx]
        let updateStartY = y
        const updateStartPage = (doc as any).internal.getCurrentPageInfo().pageNumber
        
        // Draw horizontal divider before this update (except for first update)
        // This divider becomes the top border for this update box
        if (updateIdx > 0) {
          doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
          doc.setLineWidth(0.2)
          doc.line(margin, y, pageWidth - margin, y)
          y += 0.5 // Small gap
          updateStartY = y
        }
        
        const updateLines = update.lines
        // Calculate total content height for vertical centering (justify-content: center with flex-direction: column)
        const totalContentHeight = updateLines.reduce((sum, line) => sum + line.height, 0)
        const padding = 3.5 // 10px total margin (3.5mm ≈ 10px at 72dpi) - applied as single padding value
        const minHeight = 8 // Minimum height for border
        const boxHeight = Math.max(totalContentHeight + padding, minHeight)
        
        // Calculate vertical center position (justify-content: center with flex-direction: column)
        // jsPDF text() uses baseline positioning - the Y coordinate is the baseline of the text
        // To center a text block vertically: position the first baseline so the text block's midpoint aligns with box center
        // For font size 7 with line height 3.5-4mm, baseline is approximately 3mm from the top of each line
        // So: firstBaseline = boxCenter - (totalContentHeight/2 - baselineOffsetFromTopOfFirstLine)
        const boxCenter = updateStartY + boxHeight / 2
        const firstLineHeight = updateLines.length > 0 ? updateLines[0].height : 4
        const baselineOffsetFromTop = firstLineHeight * 0.75 // Baseline is ~75% down from top of line for font size 7
        const contentStartY = boxCenter - (totalContentHeight / 2) + baselineOffsetFromTop
        
        let currentUpdateY = contentStartY
        let pageBreakY = null // Where page break occurred (if any)
        let firstPageEndY = null
        let firstPageContentHeight = 0 // Track content height on first page
        let originalUpdateStartY = updateStartY
        
        // Draw all lines for this update
        for (let lineIdx = 0; lineIdx < updateLines.length; lineIdx++) {
          const line = updateLines[lineIdx]
          const lineHeight = line.height
          
          checkPageBreak(lineHeight + 5)
          const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber
          
          if (currentPage > pageBeforeText) {
            // Page break occurred
            pageBeforeText = currentPage
            const currentItemPage = (doc as any).internal.getCurrentPageInfo().pageNumber
            
            // Draw borders for content on previous page (left, right - NO bottom)
            if (lineIdx > 0 && firstPageEndY === null) {
              // Calculate box height for first page content (justify-content: center)
              // Content on first page should be centered within its box
              const firstPageBoxHeight = Math.max(firstPageContentHeight + padding, minHeight)
              firstPageEndY = originalUpdateStartY + firstPageBoxHeight
              const prevPage = currentPage - 1
              doc.setPage(prevPage)
              doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
              doc.setLineWidth(0.2)
              // Draw left and right borders for the update section on previous page
              // These are inner borders for the update box, not outer item borders
              doc.line(margin, originalUpdateStartY, margin, firstPageEndY) // Left border
              doc.line(pageWidth - margin, originalUpdateStartY, pageWidth - margin, firstPageEndY) // Right border
              doc.setPage(currentItemPage) // Return to current page
              // Top border already drawn as divider
              // NO bottom border
              // Note: Outer item borders will be drawn at the end of the item
            }
            
            // Reset for new page - NO top border on continuation pages, start 15px from top
            // 15px ≈ 5.6mm (15 / 2.83465, since 1mm ≈ 2.83465px at 72dpi)
            const continuationOffset = 5.6
            y = margin + continuationOffset // Start 15px from top on continuation pages
            pageBreakY = y
            const remainingLines = updateLines.slice(lineIdx)
            const remainingContentHeight = remainingLines.reduce((sum, l) => sum + l.height, 0)
            const newBoxHeight = Math.max(remainingContentHeight + padding, minHeight)
            // Position remaining content with minimal top padding (10px total = 3.5mm)
            const remainingFirstLineHeight = remainingLines.length > 0 ? remainingLines[0].height : 4
            const remainingBaselineOffset = remainingFirstLineHeight * 0.75
            const remainingTopPadding = padding / 2 // Half of total padding for top
            currentUpdateY = y + remainingTopPadding + remainingBaselineOffset
            updateStartY = y
          } else {
            // Track content height on first page
            firstPageContentHeight += lineHeight
          }
          
          // Draw the line content
          if (line.type === 'response' && line.namePart && line.restPart) {
            doc.setFont("helvetica", "bold")
            doc.text(line.namePart, margin + 2, currentUpdateY)
            const nameW = doc.getTextWidth(line.namePart)
            doc.setFont("helvetica", "normal")
            doc.text(line.restPart, margin + 2 + nameW, currentUpdateY)
          } else if (line.type === 'comment-header' && line.namePart && line.restPart) {
            doc.setFont("helvetica", "bold")
            doc.text(line.namePart, margin + 2, currentUpdateY)
            doc.setFont("helvetica", "normal")
            doc.text(line.restPart, margin + 2 + doc.getTextWidth(line.namePart), currentUpdateY)
          } else if (line.content) {
            doc.text(line.content, margin + 2, currentUpdateY)
          }
          
          currentUpdateY += lineHeight
        }
        
        // Calculate box end Y (justify-content: center - box height = content + padding)
        let updateEndY: number
        if (pageBreakY) {
          // Content spans pages - calculate box height for content on final page
          const remainingLines = updateLines.slice(updateLines.length - (updateLines.length - Math.floor((currentUpdateY - pageBreakY) / 3.5)))
          const actualRemainingHeight = remainingLines.reduce((sum, l) => sum + l.height, 0) || (currentUpdateY - pageBreakY - padding)
          const finalBoxHeight = Math.max(actualRemainingHeight + padding, minHeight)
          updateEndY = pageBreakY + finalBoxHeight
        } else {
          // Content fits on one page - box end is start + box height
          updateEndY = updateStartY + boxHeight
        }
        
        // Draw borders for the final part of this update
        doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
        doc.setLineWidth(0.2)
        
        if (pageBreakY) {
          // Update spanned pages - draw borders for content on final page
          // Top border is the divider line (already drawn at pageBreakY), don't draw it again
          doc.line(margin, pageBreakY, margin, updateEndY) // Left border
          doc.line(pageWidth - margin, pageBreakY, pageWidth - margin, updateEndY) // Right border
          // NO bottom border
          y = updateEndY
        } else {
          // Update fits on one page - content is already centered
          doc.line(margin, updateStartY, margin, updateEndY) // Left border
          doc.line(pageWidth - margin, updateStartY, pageWidth - margin, updateEndY) // Right border
          // Top border already drawn as divider
          // NO bottom border
          y = updateEndY
        }
      }
      
      textSectionEndY = y
      textSectionDrawn = true
      
      // ----- Section 3: Images (only if photos exist) -----
      if (hasPhotos && response && response.attachments) {
        const photos = response.attachments.filter((a: any) => a.type?.startsWith("image/"))
        if (photos.length > 0) {
          // Draw horizontal divider between text and image sections
          doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
          doc.setLineWidth(0.2)
          doc.line(margin, y, pageWidth - margin, y)
          
          let imageSectionStartY = y
          imageSectionDrawn = true
          let currentImageY = imageSectionStartY + 3.5 + 1 // 3.5mm base + 3.5mm (10px) extra top margin
          
          const photoDate = response.updatedAt || response.createdAt || new Date()
          const photoDateStr = formatDateFR(new Date(photoDate))
          const photoTimeStr = formatTimeFR(new Date(photoDate))
          
          const cellW = 78
          const cellH = 44
          const imgW = 60
          const imgH = 28
          const startX = margin + 2
          const gapX = 8
          const gapY = 6
          const rowHeight = cellH + gapY
          const headerHeight = 3.5 + 4.5 // Photo header text + spacing
          
          // Draw photo header (only once, at the start)
          doc.setFont("helvetica", "bold")
          doc.text(responderName + " (" + companyName + ")", margin + 2, currentImageY)
          doc.setFont("helvetica", "normal")
          doc.text(` a ajouté ${photos.length} photo${photos.length > 1 ? "s" : ""} via mobile le ${photoDateStr} à ${photoTimeStr} EDT`, margin + 2 + doc.getTextWidth(responderName + " (" + companyName + ")"), currentImageY)
          currentImageY += 4.5
          
          // Process images row by row, filling current page as much as possible
          let currentPageStartRow = 0
          let currentPageImageY = currentImageY
          let pageBeforeImages = (doc as any).internal.getCurrentPageInfo().pageNumber
          
          for (let idx = 0; idx < photos.length; idx++) {
            const col = idx % 2
            const row = Math.floor(idx / 2)
            
            // Check if we need a new page for this row
            if (row > currentPageStartRow) {
              const availableHeight = pageHeight - margin - 15 - currentImageY
              const neededHeight = rowHeight
              
              if (neededHeight > availableHeight - 5) {
                // Need new page
                checkPageBreak(neededHeight + 10)
                const pageAfterCheck = (doc as any).internal.getCurrentPageInfo().pageNumber
                if (pageAfterCheck > pageBeforeImages) {
                  itemStartY = y
                  pageBeforeImages = pageAfterCheck
                  // NO top border on continuation pages, start 15px from top
                  // 15px ≈ 5.6mm (15 / 2.83465, since 1mm ≈ 2.83465px at 72dpi)
                  const continuationOffset = 5.6
                  y = margin + continuationOffset
                  imageSectionStartY = y
                  currentImageY = y + 3.5 + 1 // 3.5mm base + 3.5mm (10px) extra top margin
                  // Redraw photo header on new page
                  doc.setFont("helvetica", "bold")
                  doc.text(responderName + " (" + companyName + ")", margin + 2, currentImageY)
                  doc.setFont("helvetica", "normal")
                  doc.text(` a ajouté ${photos.length} photo${photos.length > 1 ? "s" : ""} via mobile le ${photoDateStr} à ${photoTimeStr} EDT`, margin + 2 + doc.getTextWidth(responderName + " (" + companyName + ")"), currentImageY)
                  currentImageY += 4.5
                }
                currentPageImageY = currentImageY
                currentPageStartRow = row
              }
            }
            
            // Calculate position relative to current page's start
            const rowOnCurrentPage = row - currentPageStartRow
            const x = startX + col * (cellW + gapX)
            const yy = currentPageImageY + rowOnCurrentPage * rowHeight
            
            doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
            doc.setLineWidth(0.2)
            doc.rect(x, yy, cellW, cellH)
            const imgX = x + (cellW - imgW) / 2
            const imgY = yy + 6
            doc.rect(imgX, imgY, imgW, imgH)
            try {
              doc.addImage(photos[idx].url, getJsPdfImageFormat(photos[idx].url, photos[idx].type), imgX + 0.5, imgY + 0.5, imgW - 1, imgH - 1)
            } catch {}
            const name = photos[idx].name || "photo.jpg"
            doc.setFontSize(7)
            doc.setTextColor(0, 0, 255)
            doc.text(name, x + cellW / 2, imgY + imgH + 6, { align: "center" })
            const textW = doc.getTextWidth(name)
            doc.setDrawColor(0, 0, 255)
            doc.setLineWidth(0.2)
            doc.line(x + cellW / 2 - textW / 2, imgY + imgH + 6.8, x + cellW / 2 + textW / 2, imgY + imgH + 6.8)
            doc.setTextColor(0, 0, 0)
            doc.setDrawColor(0, 0, 0)
            
            // Update y position after each complete row
            if (col === 1 || idx === photos.length - 1) {
              y = yy + cellH + 2
            }
          }
          
          // Calculate final image section end Y
          imageSectionEndY = y
          
          // Draw image section borders
          doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
          doc.setLineWidth(0.2)
          doc.line(margin, imageSectionStartY, margin, imageSectionEndY)
          doc.line(pageWidth - margin, imageSectionStartY, pageWidth - margin, imageSectionEndY)
          doc.line(margin, imageSectionEndY, pageWidth - margin, imageSectionEndY)
        }
      } else {
        // No images - draw bottom border for text section
        doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
        doc.setLineWidth(0.2)
        doc.line(margin, y, pageWidth - margin, y)
      }
      
      // Draw outer border (left and right) - top and bottom already drawn
      const itemEndY = y
      const itemEndPage = (doc as any).internal.getCurrentPageInfo().pageNumber
      doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
      doc.setLineWidth(0.2)
      
      // Draw borders on all pages the item spans
      // Note: Top border is already drawn as part of statistics section rect on first page only
      // Bottom border is already drawn for text/image sections
      if (itemStartPage === itemEndPage) {
        // Item fits on one page - draw left and right borders
        doc.line(margin, originalItemStartY, margin, itemEndY) // Left border
        doc.line(pageWidth - margin, originalItemStartY, pageWidth - margin, itemEndY) // Right border
      } else {
        // Item spans multiple pages - draw left and right borders on each page
        // 15px ≈ 5.6mm (15 / 2.83465, since 1mm ≈ 2.83465px at 72dpi)
        const continuationOffset = 5.6 // 15px offset from top on continuation pages
        // 30px ≈ 10.6mm (30 / 2.83465)
        const borderExtensionDown = 10.6 // 30px extension downward
        for (let pageNum = itemStartPage; pageNum <= itemEndPage; pageNum++) {
          doc.setPage(pageNum)
          doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2]) // Ensure correct border color
          doc.setLineWidth(0.2)
          // On first page, start from originalItemStartY; on continuation pages, start 15px from top (no top border)
          let pageStartY = pageNum === itemStartPage ? originalItemStartY : margin + continuationOffset
          // On last page, end at itemEndY; on other pages, end at bottom margin
          let pageEndY = pageNum === itemEndPage ? itemEndY : pageHeight - margin - 15
          
          if (pageNum === itemStartPage) {
            // First page - extend borders 30px downward from bottom
            const extendedBottomY = pageEndY + borderExtensionDown
            doc.line(margin, pageStartY, margin, extendedBottomY) // Left border extended downward
            doc.line(pageWidth - margin, pageStartY, pageWidth - margin, extendedBottomY) // Right border extended downward
          } else {
            // Continuation pages - extend borders downward from top, but remove 15px from top
            // Original extension was 30px, removing 15px leaves 15px extension
            // 15px ≈ 5.6mm (15 / 2.83465)
            const reducedExtension = 5.6 // 15px extension (30px - 15px = 15px)
            const extendedTopY = pageStartY - reducedExtension
            // Don't draw borders above the continuation header area (y = 18mm)
            // Start borders from pageStartY (where content begins) instead of extending upward
            const actualStartY = pageStartY
            doc.line(margin, actualStartY, margin, pageEndY) // Left border
            doc.line(pageWidth - margin, actualStartY, pageWidth - margin, pageEndY) // Right border
          }
        }
        // Return to the last page
        doc.setPage(itemEndPage)
      }
      
      y = itemEndY + 3 // Slightly more spacing between items
    })
    y += 2
  })

  // ----- Footer: thin light line, then company | Page X sur Y | Imprimé le -----
  const pageCount = (doc as any).internal.getNumberOfPages()
  const footerY = pageHeight - 8
  const printDate = new Date()
  const printDateStr = printDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
  const printTimeStr = printDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h ")
  const printedStr = `Imprimé le : ${printDateStr} ${printTimeStr} EDT`

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(SEP_GRAY[0], SEP_GRAY[1], SEP_GRAY[2])
    doc.setLineWidth(0.2)
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2)
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text("Construction Interlag", margin, footerY + 2)
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, footerY + 2, { align: "center" })
    doc.text(printedStr, pageWidth - margin, footerY + 2, { align: "right" })
    doc.setTextColor(0, 0, 0)
  }

  doc.save(finalFilename)
}

// Resolve project/creator for incident PDF when opts provided; fallback to store (localStorage) for creator
function resolveIncidentContext(
  incident: any,
  opts?: { projects?: { id: string; name?: string; code?: string; location?: string }[]; users?: { id: string; name?: string }[] }
) {
  const project = opts?.projects?.find((p) => p.id === incident.projectId)
  let creatorName = incident.creatorName ?? opts?.users?.find((u) => u.id === incident.creatorId)?.name ?? ""
  if (!creatorName && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("construction-forms-storage")
      if (raw) {
        const state = JSON.parse(raw)?.state
        const users = state?.authUsers || state?.users || []
        const creator = users.find((u: any) => u.id === incident.creatorId)
        if (creator?.name) creatorName = creator.name
      }
    } catch {}
  }
  return {
    projectName: incident.projectName ?? project?.name ?? "",
    projectNumber: incident.projectNumber ?? project?.code ?? "",
    projectLocation: incident.projectLocation ?? project?.location ?? "",
    creatorName,
  }
}

// Get incident option lists from store (localStorage) for resolving IDs to labels in PDF
function getIncidentOptionLists(): {
  danger: { id: string; label: string }[]
  contributingCondition: { id: string; label: string }[]
  contributingBehavior: { id: string; label: string }[]
  accidentTypes: { id: string; label: string }[]
} {
  if (typeof window === "undefined")
    return { danger: [], contributingCondition: [], contributingBehavior: [], accidentTypes: [] }
  try {
    const raw = localStorage.getItem("construction-forms-storage")
    if (!raw) return { danger: [], contributingCondition: [], contributingBehavior: [], accidentTypes: [] }
    const parsed = JSON.parse(raw)
    const lists = parsed?.state?.incidentOptionLists || {}
    return {
      danger: lists.danger || [],
      contributingCondition: lists.contributingCondition || [],
      contributingBehavior: lists.contributingBehavior || [],
      accidentTypes: lists.accidentTypes || [],
    }
  } catch {
    return { danger: [], contributingCondition: [], contributingBehavior: [], accidentTypes: [] }
  }
}

function resolveIncidentOptionLabel(
  list: { id: string; label: string }[],
  value: string | undefined
): string {
  if (!value) return ""
  const option = list?.find((o: { id: string; label: string }) => o.id === value)
  if (option) return option.label
  // Value might already be a custom label (free text from combobox)
  return String(value).trim()
}

// Export incident PDF — Excel Perfect style: clean grid, thin solid separators, centered title.
export async function exportIncidentAsPdf(
  incident: any,
  filename?: string,
  opts?: { projects?: { id: string; name?: string; code?: string; location?: string }[]; users?: { id: string; name?: string }[] }
) {
  if (typeof window === "undefined") return
  const incidentNumber = incident.number ?? incident.id?.slice(-6) ?? ""
  const finalFilename = filename ?? `Formulaire Incident ${incidentNumber}.pdf`
  const jsPDF = (await import("jspdf")).default
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  const contentWidth = pageWidth - 2 * margin
  const { projectName, projectNumber, projectLocation, creatorName } = resolveIncidentContext(incident, opts)
  const optionLists = getIncidentOptionLists()

  let y = margin

  const checkPageBreak = (need: number) => {
    if (y + need > pageHeight - margin - 15) {
      doc.addPage()
      y = margin
      try {
        doc.addImage("/logo.png", "PNG", margin, y, 20, 20)
      } catch {}
      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.text("Construction Interlag", margin + 24, y + 4)
      doc.setFontSize(7)
      doc.setFont("helvetica", "normal")
      doc.text("926 av Simard, #201", margin + 24, y + 8)
      doc.text("Chambly, Quebec J3L 4X2", margin + 24, y + 11)
      doc.text("Téléphone : 514-323-6710", margin + 24, y + 14)
      doc.text("Télécopieur : 514-323-3882", margin + 24, y + 17)
    }
  }

  const thinLine = () => {
    // Reference PDF uses light gray separators
    doc.setDrawColor(SEP_GRAY[0], SEP_GRAY[1], SEP_GRAY[2])
    doc.setLineWidth(0.2)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5
  }

  // ----- Header: logo + company (left), project (right) -----
  try {
    doc.addImage("/logo.png", "PNG", margin, y, 20, 20)
  } catch {}
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Construction Interlag", margin + 24, y + 4)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text("926 av Simard, #201", margin + 24, y + 8)
  doc.text("Chambly, Quebec J3L 4X2", margin + 24, y + 11)
  doc.text("Téléphone : 514-323-6710", margin + 24, y + 14)
  doc.text("Télécopieur : 514-323-3882", margin + 24, y + 17)

  // Project info on right side
  const projColX = pageWidth - margin
  const projColW = 75
  let ry = y + 2
  doc.setFontSize(7)
  if (projectName || projectNumber) {
    const projText = projectNumber && projectName 
      ? `Projet : ${projectNumber} ${projectName}` 
      : projectNumber 
        ? `Projet : ${projectNumber}` 
        : projectName 
          ? `Projet : ${projectName}` 
          : ""
    if (projText) {
      const projLines = doc.splitTextToSize(projText, projColW)
      doc.setFont("helvetica", "bold") // Make project text bold
      projLines.forEach((ln: string) => {
        doc.text(ln, projColX, ry, { align: "right" })
        ry += 3.5
      })
      doc.setFont("helvetica", "normal") // Reset to normal
    }
  }
  if (projectLocation) {
    const locLines = doc.splitTextToSize(projectLocation, projColW)
    locLines.forEach((ln: string) => {
      doc.text(ln, projColX, ry, { align: "right" })
      ry += 3.5
    })
  }

  y += 22
  thinLine()

  // ----- Title: centered, bold, larger (matching image format) -----
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  // Format: "Incident n°76 - F-1: Tristan Lavallée: Étirement épaule gauche"
  // Construct title from incident number and title field
  let titleText = `Incident n°${incidentNumber}`
  if (incident.title) {
    // If title already contains the format with colons, use it as-is with dash separator
    if (incident.title.includes(":")) {
      titleText = `${titleText} - ${incident.title}`
    } else {
      // Otherwise, just append with dash
      titleText = `${titleText} - ${incident.title}`
    }
  }
  const titleLines = doc.splitTextToSize(titleText, contentWidth)
  titleLines.forEach((ln: string, i: number) => {
    doc.text(ln, pageWidth / 2, y + (i * 6), { align: "center" })
  })
  y += 2
  thinLine()

  // ----- Two-column metadata (no per-field underlines) -----
  const leftColX = margin
  const leftColW = (contentWidth - 4) / 2
  const rightColX = pageWidth / 2 + 2
  const rightColW = (contentWidth - 4) / 2
  const labelW = 40
  const rowH = 5.5

  // Format distribution with names and company
  const formatDistribution = (): string[] => {
    const dist = incident.distribution || []
    if (Array.isArray(dist)) {
      const users = opts?.users || []
      // Also try to get from localStorage store
      let storeUsers: any[] = []
      if (typeof window !== "undefined") {
        try {
          const storeData = localStorage.getItem("construction-forms-storage")
          if (storeData) {
            const parsed = JSON.parse(storeData)
            const state = parsed.state
            storeUsers = state?.authUsers || state?.users || []
          }
        } catch {}
      }
      const allUsers = [...users, ...storeUsers]
      
      return dist.map((item: string) => {
        if (typeof item === 'string' && item.includes('@')) {
          // It's an email, try to find user by email
          const user = allUsers.find((u: any) => u.email === item)
          if (user) {
            return `${user.name} (Construction Interlag)`
          }
          return item
        }
        // If it's a user ID, find the user
        const user = allUsers.find((u: any) => u.id === item || u.email === item)
        if (user) {
          return `${user.name} (Construction Interlag)`
        }
        return String(item)
      })
    }
    return [String(dist)]
  }

  // Format date as DD/MM/YYYY
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return ""
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Format date-only fields (event date) without timezone shift
  const formatDateOnly = (date: Date | string | null | undefined): string => {
    if (!date) return ""
    const str = typeof date === "string" ? date : date instanceof Date ? date.toISOString() : ""
    const datePart = str?.slice(0, 10)
    if (!datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return ""
    const [y, m, d] = datePart.split("-")
    return `${d}/${m}/${y}`
  }

  // Format time as "HH h MM EDT"
  const formatTime = (time: string | null | undefined): string => {
    if (!time) return ""
    // If time is in format "HH:MM", convert to "HH h MM EDT"
    if (time.includes(":")) {
      const [hours, minutes] = time.split(":")
      return `${hours} h ${minutes} EDT`
    }
    return time.includes("EDT") ? time : `${time} EDT`
  }

  const leftRows: [string, string][] = [
    ["Créateur", creatorName || ""],
    ["Lieu", incident.location || ""],
    ["Date de l'événement", formatDateOnly(incident.eventDate)],
    ["Privé(e)", (incident as any).isPrivate || (incident as any).private ? "Oui" : "Non"],
  ]

  const createdStr = formatDate(incident.createdAt)
  // Status mapping: "open" -> "Initié", "closed" -> "Fermé" (matching form choices)
  const statusMap: Record<string, string> = { 
    open: "Initié", 
    closed: "Fermé", 
    draft: "Brouillon", 
    "in-progress": "En cours", 
    submitted: "Soumis" 
  }
  const statusStr = statusMap[incident.status] ?? incident.status ?? ""
  const eventTimeStr = formatTime(incident.eventTime)
  const distLines = formatDistribution()

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")

  let leftY = y
  let prevLabel = ""
  leftRows.forEach(([label, value]) => {
    // Add extra spacing after "Date de l'événement" for better visibility
    if (prevLabel === "Date de l'événement") {
      leftY += 3
    }
    doc.setFont("helvetica", "bold")
    // Special handling for "Date de l'événement" - split across two lines
    if (label === "Date de l'événement") {
      doc.text("Date de", leftColX, leftY)
      doc.text("l'événement", leftColX, leftY + 3.5)
    } else {
      doc.text(label, leftColX, leftY)
    }
    doc.setFont("helvetica", "normal")
    const v = String(value || "")
    const vLines = doc.splitTextToSize(v, leftColW - labelW - 2)
    // Align value with the first line of the label
    doc.text(vLines[0] || "", leftColX + labelW, leftY)
    prevLabel = label
    leftY += rowH
  })

  let rightY = y
  doc.setFont("helvetica", "bold")
  doc.text("Créé à", rightColX, rightY)
  doc.setFont("helvetica", "normal")
  doc.text(createdStr, rightColX + labelW, rightY)
  rightY += rowH

  doc.setFont("helvetica", "bold")
  doc.text("Statut", rightColX, rightY)
  doc.setFont("helvetica", "normal")
  doc.text(statusStr, rightColX + labelW, rightY)
  rightY += rowH

  doc.setFont("helvetica", "bold")
  // Split "Heure de l'événement" across two lines
  doc.text("Heure de", rightColX, rightY)
  doc.text("l'événement", rightColX, rightY + 3.5)
  doc.setFont("helvetica", "normal")
  // Align value with the first line of the label
  doc.text(eventTimeStr, rightColX + labelW, rightY)
  rightY += rowH
  // Add extra spacing after "Heure de l'événement" for better visibility
  rightY += 3

  doc.setFont("helvetica", "bold")
  doc.text("Distribution", rightColX, rightY)
  doc.setFont("helvetica", "normal")
  // Align distribution values in the value column (like reference PDF)
  const distValueX = rightColX + labelW
  const distWrapW = rightColW - labelW - 2
  let distY = rightY
  if (distLines.length === 0) {
    doc.text("-", distValueX, distY)
    distY += rowH
  } else {
    distLines.forEach((line: string) => {
      const wrapped = doc.splitTextToSize(String(line), distWrapW)
      wrapped.forEach((w: string) => {
        doc.text(w, distValueX, distY)
        distY += 3.5
      })
    })
    distY += 2
  }
  rightY = distY

  y = Math.max(leftY, rightY) + 5

  // ----- Description section: \"À déclarer\" on its own row, \"Description\" label below -----
  checkPageBreak(12)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  // À déclarer row
  const aDeclarerText = (incident as any).aDeclarer === true ? "Oui" : "Non"
  doc.text("À déclarer", leftColX, y)
  doc.setFont("helvetica", "normal")
  // Value column aligned with Description content column
  const descLabelW = 40
  const descTextX = leftColX + descLabelW
  doc.text(aDeclarerText, descTextX, y)
  y += 5

  // Description label + first line on the same row (like original PDF)
  doc.setFont("helvetica", "bold")
  doc.text("Description", leftColX, y)

  // Description content
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  const desc = incident.description || ""
  const descWrapW = contentWidth - 4 - descLabelW
  const descLines = doc.splitTextToSize(desc || " ", descWrapW)

  descLines.forEach((ln: string, idx: number) => {
    checkPageBreak(4)
    const lineY = idx === 0 ? y : y + 4 * idx
    doc.text(ln, descTextX, lineY)
  })
  y += 4 * (descLines.length || 1)
  y += 4

  // ----- Pièces jointes: 2x2 grid layout with proper framing (like observation PDF) -----
  const attachments = incident.attachments || []
  if (attachments.length > 0) {
    // Filter images and non-images separately
    const images = attachments.filter((a: any) => a.type?.startsWith("image/")) || []
    const otherAttachments = attachments.filter((a: any) => !a.type?.startsWith("image/")) || []
    
    if (images.length > 0) {
      const imgGap = 6
      const imgW = (contentWidth - imgGap) / 2
      const imgH = 45
      const filenameHeight = 6 // Space for filename below image
      const rowSpacing = 4 // Gap between rows
      const cellHeight = imgH + filenameHeight // Total height per cell (image + filename)
      const rowHeight = cellHeight + rowSpacing // Total height per row including spacing
      const rows = Math.ceil(images.length / 2)
      // Calculate actual height: title (6) + title after (6) + images + final spacing (6)
      const estimatedHeight = 6 + 6 + rows * rowHeight + 6
      checkPageBreak(estimatedHeight)
      
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.text("Pièces jointes", leftColX, y)
      y += 6
      
      const baseY = y
      // Use consistent border color
      const BORDER_GRAY: [number, number, number] = [210, 210, 210]
      const LIGHT_BORDER_GRAY: [number, number, number] = [230, 230, 230] // Lighter gray for image border
      doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
      doc.setLineWidth(0.2)
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = leftColX + col * (imgW + imgGap)
        const cellY = baseY + row * rowHeight
        
        // Draw border around the image area
        const borderPadding = 0.5 // Padding from cell edge
        const borderX = x + borderPadding
        const borderY = cellY + borderPadding
        const borderW = imgW - (borderPadding * 2)
        const borderH = imgH - (borderPadding * 2)
        
        doc.setDrawColor(LIGHT_BORDER_GRAY[0], LIGHT_BORDER_GRAY[1], LIGHT_BORDER_GRAY[2])
        doc.setLineWidth(0.5) // Wider border
        doc.rect(borderX, borderY, borderW, borderH)
        
        // Draw image inside the border with margin/padding
        const imageMargin = 2 // Margin between border and image
        const imgX = borderX + imageMargin
        const imgY = borderY + imageMargin
        const actualImgW = borderW - (imageMargin * 2)
        const actualImgH = borderH - (imageMargin * 2)
        
        try {
          doc.addImage(img.url, getJsPdfImageFormat(img.url, img.type), imgX, imgY, actualImgW, actualImgH)
        } catch (e) {
          // If image fails to load, show placeholder text centered
          doc.setFont("helvetica", "italic")
          doc.setFontSize(7)
          doc.setTextColor(150, 150, 150)
          const placeholderText = "Image non disponible"
          const textWidth = doc.getTextWidth(placeholderText)
          doc.text(placeholderText, borderX + (borderW - textWidth) / 2, borderY + borderH / 2)
          doc.setTextColor(0, 0, 0)
        }
        
        // Draw filename below image, centered (blue + underlined)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7)
        const name = img.name || "Pièce jointe"
        const nameX = x + imgW / 2
        const nameY = cellY + imgH + 3
        doc.setTextColor(LINK_BLUE[0], LINK_BLUE[1], LINK_BLUE[2])
        doc.text(name, nameX, nameY, { align: "center" })
        
        // Draw underline for filename
        const tw = doc.getTextWidth(name)
        doc.setDrawColor(LINK_BLUE[0], LINK_BLUE[1], LINK_BLUE[2])
        doc.setLineWidth(0.2)
        doc.line(nameX - tw / 2, nameY + 0.5, nameX + tw / 2, nameY + 0.5)
        
        // Reset colors
        doc.setTextColor(0, 0, 0)
        doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
        doc.setLineWidth(0.2)
      }
      
      doc.setDrawColor(0, 0, 0)
      y = baseY + rows * rowHeight
      y += 6
    }
    
    // Non-image attachments (file names only)
    if (otherAttachments.length > 0) {
      if (images.length === 0) {
        // Only show title if there were no images
        checkPageBreak(10 + otherAttachments.length * 4)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(9)
        doc.text("Pièces jointes", leftColX, y)
        y += 6
      }
      
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      otherAttachments.forEach((att: any) => {
        const name = att.name || "Document joint"
        doc.setTextColor(LINK_BLUE[0], LINK_BLUE[1], LINK_BLUE[2])
        doc.text(name, leftColX, y)
        const textW = doc.getTextWidth(name)
        doc.setDrawColor(LINK_BLUE[0], LINK_BLUE[1], LINK_BLUE[2])
        doc.setLineWidth(0.2)
        doc.line(leftColX, y + 0.8, leftColX + textW, y + 0.8)
        doc.setTextColor(0, 0, 0)
        doc.setDrawColor(0, 0, 0)
        y += 4
      })
    }
    
    if (attachments.length > 0) {
      y += 4
      thinLine()
    }
  }

  // ----- Informations sur l'enquête (2 columns: Left (Danger, Condition contributive), Right (Comportement contributif)) -----
  checkPageBreak(30)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("Informations sur l'enquête", leftColX, y)
  y += 6
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)

  const invW = (contentWidth - 4) / 2
  const invLabelW = 40
  const invRowH = 6
  
  // Resolve investigation option IDs to labels (all three are dropdowns)
  const dangerLabel = resolveIncidentOptionLabel(optionLists.danger, incident.investigation?.danger)
  const contributingConditionLabel = resolveIncidentOptionLabel(optionLists.contributingCondition, incident.investigation?.contributingCondition)
  const contributingBehaviorResolved = resolveIncidentOptionLabel(optionLists.contributingBehavior, incident.investigation?.contributingBehavior)
  const contributingBehaviorText =
    String(contributingBehaviorResolved ?? incident.investigation?.contributingBehavior ?? "").trim()

  // Left column: Danger, Condition contributive
  let leftInvY = y
  doc.setFont("helvetica", "bold")
  doc.text("Danger", leftColX, leftInvY)
  doc.setFont("helvetica", "normal")
  const dangerLines = doc.splitTextToSize(dangerLabel || "-", invW - invLabelW - 2)
  doc.text(dangerLines[0] || "-", leftColX + invLabelW, leftInvY)
  leftInvY += invRowH
  
  doc.setFont("helvetica", "bold")
  doc.text("Condition contributive", leftColX, leftInvY)
  doc.setFont("helvetica", "normal")
  const condLines = doc.splitTextToSize(contributingConditionLabel || "-", invW - invLabelW - 2)
  doc.text(condLines[0] || "-", leftColX + invLabelW, leftInvY)
  
  // Right column: Comportement contributif
  let rightInvY = y
  doc.setFont("helvetica", "bold")
  doc.text("Comportement contributif", rightColX, rightInvY)
  doc.setFont("helvetica", "normal")
  const behaviorLines = doc.splitTextToSize(contributingBehaviorText || "-", invW - invLabelW - 2)
  doc.text(behaviorLines[0] || "-", rightColX + invLabelW, rightInvY)
  
  y = Math.max(leftInvY + invRowH, rightInvY + invRowH) + 6

  // ----- Footer: thin dark line, then company | Page X sur Y | Imprimé le DD/MM/YYYY à HH h MM EDT -----
  const pageCount = (doc as any).internal.getNumberOfPages()
  const footerY = pageHeight - 8
  const printedStr = (() => {
    const d = new Date()
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    const h = String(d.getHours()).padStart(2, "0")
    const m = String(d.getMinutes()).padStart(2, "0")
    return `Imprimé le ${day}/${month}/${year} à ${h} h ${m} EDT`
  })()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.2)
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2)
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.setFont("helvetica", "normal")
    doc.text("Construction Interlag", margin, footerY + 2)
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, footerY + 2, { align: "center" })
    doc.text(printedStr, pageWidth - margin, footerY + 2, { align: "right" })
    doc.setTextColor(0, 0, 0)
  }

  doc.save(finalFilename)
}
