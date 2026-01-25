"use client"

import jsPDF from "jspdf"

// Professional PDF generator for all forms with logo and header matching the template
export async function generateProfessionalPDF(data: {
  title: string
  type: "observation" | "inspection" | "incident"
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
  doc.text("Télécopieur : 514-323-3682", margin + 25, yPosition + 13)

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
        doc.addImage(image.url, "JPEG", margin, yPosition, imgWidth, imgHeight)
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

// Export observation with proper formatting and embedded images
export async function exportObservationAsPdf(observation: any, filename: string) {
  if (typeof window === "undefined") return

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  const contentWidth = pageWidth - margin * 2

  let y = margin

  // Header: logo left + company info, project info right
  try {
    doc.addImage("/logo.png", "PNG", margin, y, 26, 26)
  } catch (e) {
    // ignore
  }

  doc.setFontSize(10)
  doc.setFont(undefined, "bold")
  doc.text("Construction Interlag", margin + 30, y + 5)
  doc.setFontSize(8)
  doc.setFont(undefined, "normal")
  doc.text("926 av Simard, #201", margin + 30, y + 10)
  doc.text("Chambly, Quebec J3L 4X2", margin + 30, y + 14)
  doc.text("Téléphone : 514-323-6710", margin + 30, y + 18)
  doc.text("Télécopieur : 514-323-3682", margin + 30, y + 22)

  // Project info right
  const projectParts: string[] = []
  if (observation.projectNumber) projectParts.push(`${observation.projectNumber}`)
  if (observation.projectName) projectParts.push(observation.projectName)
  if (observation.projectLocation) projectParts.push(observation.projectLocation)
  if (projectParts.length) {
    doc.setFontSize(8)
    const rightX = pageWidth - margin
    const pText = projectParts.join(" - ")
    const lines = doc.splitTextToSize(pText, 80)
    let ry = y + 5
    lines.forEach((ln: string) => {
      doc.text(ln, rightX, ry, { align: "right" })
      ry += 4
    })
  }

  y += 30
  doc.setDrawColor(150, 150, 150)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  // Title centered
  doc.setFontSize(13)
  doc.setFont(undefined, "bold")
  const title = `Observation Risque de sécurité N°${observation.number || ""} : ${observation.type || "MES-COR"}: ${observation.title || ""}`
  const titleLines = doc.splitTextToSize(title, contentWidth)
  titleLines.forEach((ln: string, idx: number) => {
    doc.text(ln, pageWidth / 2, y + idx * 6, { align: "center" })
  })
  y += titleLines.length * 6 + 4

  // Details two-column (use the sample order)
  doc.setFontSize(9)
  doc.setFont(undefined, "bold")
  doc.text("", margin, y)
  y += 2
  doc.setFontSize(8)
  doc.setFont(undefined, "normal")

  const detailsOrder: Array<[string, string]> = [
    ["Origine", observation.origin || ""],
    ["Statut", observation.status || ""],
    ["Créé par", observation.creatorName || observation.creatorId || ""],
    ["Date de création", observation.createdAt ? new Date(observation.createdAt).toLocaleDateString("fr-FR") : ""],
    ["Personne assignée", observation.assignedPersonName || observation.assignedPersonId || ""],
    ["Distribution", Array.isArray(observation.distribution) ? observation.distribution.join(", ") : observation.distribution || ""],
    ["Date de notification", observation.notificationDate ? new Date(observation.notificationDate).toLocaleDateString("fr-FR") : (observation.createdAt ? new Date(observation.createdAt).toLocaleDateString("fr-FR") : "")],
    ["Priorité", observation.priority || ""],
    ["Lieu", observation.projectLocation || observation.location || ""],
    ["Métier", observation.trade || "Charge de projet"],
    ["Date d'échéance", observation.dueDate ? new Date(observation.dueDate).toLocaleDateString("fr-FR") : ""],
    ["Privé(e)", observation.private ? "Oui" : "Non"],
    ["Condition contributive", observation.safetyAnalysis?.contributingCondition || ""],
    ["Comportement contributif", observation.safetyAnalysis?.contributingBehavior || ""],
    ["Danger", observation.safetyAnalysis?.danger || ""],
    ["Section du devis", observation.cnsstSection || "SSE : SANTÉ SÉCURITÉ ENVIRONNEMENT"],
  ]

  const leftX = margin
  const rightX = pageWidth / 2 + 5
  let leftY = y
  let rightY = y
  const mid = Math.ceil(detailsOrder.length / 2)
  detailsOrder.forEach(([label, value], idx) => {
    if (idx < mid) {
      doc.setFont(undefined, "bold")
      doc.text(label, leftX, leftY)
      doc.setFont(undefined, "normal")
      const vLines = doc.splitTextToSize(String(value || "-"), pageWidth / 2 - 50)
      doc.text(vLines, leftX + 45, leftY)
      leftY += Math.max(4, vLines.length * 4)
    } else {
      doc.setFont(undefined, "bold")
      doc.text(label, rightX, rightY)
      doc.setFont(undefined, "normal")
      const vLines = doc.splitTextToSize(String(value || "-"), pageWidth / 2 - 50)
      doc.text(vLines, rightX + 45, rightY)
      rightY += Math.max(4, vLines.length * 4)
    }
  })

  y = Math.max(leftY, rightY) + 6

  // Divider before content sections
  doc.setDrawColor(220, 220, 220)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  // Description section (with date heading lines)
  if (observation.description) {
    doc.setFont(undefined, "bold")
    doc.setFontSize(9)
    doc.text("Description", margin, y)
    y += 6
    doc.setFont(undefined, "normal")
    doc.setFontSize(8)
    const descDate = observation.createdAt ? new Date(observation.createdAt).toLocaleDateString("fr-FR") : ""
    const descText = `${descDate} : ${observation.description}`
    const descLines = doc.splitTextToSize(descText, contentWidth)
    descLines.forEach((ln: string) => {
      if (y > pageHeight - margin - 40) { doc.addPage(); y = margin }
      doc.text(ln, margin, y)
      y += 4
    })
    y += 4
  }

  // Reference article
  if (observation.referenceArticle) {
    doc.setFont(undefined, "bold")
    doc.setFontSize(9)
    doc.text("Article de référence (CRTC)", margin, y)
    y += 6
    doc.setFont(undefined, "normal")
    doc.setFontSize(8)
    const artLines = doc.splitTextToSize(observation.referenceArticle, contentWidth)
    artLines.forEach((ln: string) => { if (y > pageHeight - margin - 40) { doc.addPage(); y = margin } ; doc.text(ln, margin, y); y += 4 })
    y += 4
  }

  // Corrective measures
  if (observation.correctiveMeasures) {
    doc.setFont(undefined, "bold")
    doc.setFontSize(9)
    doc.text("Mesures correctives", margin, y)
    y += 6
    doc.setFont(undefined, "normal")
    doc.setFontSize(8)
    const mLines = doc.splitTextToSize(observation.correctiveMeasures, contentWidth)
    mLines.forEach((ln: string) => { if (y > pageHeight - margin - 40) { doc.addPage(); y = margin } ; doc.text(ln, margin, y); y += 4 })
    y += 4
  }

  // Attachments grid - two columns with image and link caption
  const images = observation.attachments?.filter((a: any) => a.type?.startsWith("image/")) || []
  if (images.length > 0) {
    doc.setFont(undefined, "bold")
    doc.setFontSize(9)
    doc.text("Pièces jointes", margin, y)
    y += 6
    const imgGap = 6
    const imgW = (contentWidth - imgGap) / 2
    const imgH = 50
    let ix = 0
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      const col = ix % 2
      const x = margin + col * (imgW + imgGap)
      if (y + imgH > pageHeight - margin - 40) { doc.addPage(); y = margin }
      try {
        doc.addImage(img.url, 'JPEG', x, y, imgW, imgH)
      } catch (e) {
        // fallback: draw placeholder box
        doc.setDrawColor(200)
        doc.rect(x, y, imgW, imgH)
      }
      // caption link-like
      doc.setFontSize(7)
      doc.setTextColor(20, 90, 200)
      const name = img.name || `Image ${i+1}`
      const captionX = x
      const captionY = y + imgH + 4
      doc.text(name, captionX, captionY)
      doc.setTextColor(0,0,0)

      if (col === 1) {
        // advance to next row
        y += imgH + 12
      }
      ix++
    }
    y += 6
  }

  // Activity box (simple)
  doc.setFont(undefined, "bold")
  doc.setFontSize(9)
  doc.text(`Activité (1)`, margin, y)
  y += 6
  doc.setFont(undefined, "normal")
  doc.setFontSize(8)
  const activityName = observation.creatorName || observation.creatorId || ""
  const activityDate = observation.createdAt ? new Date(observation.createdAt).toLocaleString("fr-FR") : ""
  doc.text(`${activityName}`, margin, y)
  doc.text(`${activityDate}`, margin, y + 4)
  // status box
  const boxX = margin + 80
  const boxW = pageWidth - margin - boxX
  doc.setDrawColor(200)
  doc.rect(boxX, y - 1, boxW, 14)
  doc.setFontSize(9)
  doc.text(`Statut modifié : ${observation.status || ""}`, boxX + 4, y + 6)
  y += 20

  // Footer: company left, page center, printed date/time right
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(6)
    doc.setTextColor(120, 120, 120)
    // left
    doc.text("Construction Interlag", margin, pageHeight - 8)
    // center
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" })
    // right - printed date
    const printed = new Date().toLocaleDateString("fr-FR") + "  " + new Date().toLocaleTimeString("fr-FR")
    doc.text(printed, pageWidth - margin, pageHeight - 8, { align: "right" })
  }

  doc.save(filename)
}

// Export inspection with proper formatting and embedded images

// New PDF export matching French template with checkboxes and layout
import { inspectionSections } from "./store"
export async function exportInspectionAsPdf(inspection: any, filename: string) {
  if (typeof window === "undefined") return

  const jsPDF = (await import("jspdf")).default
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 12
  let y = margin

  // Header: Logo and company info
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
  doc.text("Télécopieur : 514-323-3682", margin + 26, y + 22)

  // Project info (right)
  let projectInfo = []
  if (inspection.projectNumber) projectInfo.push(`Projet : ${inspection.projectNumber}`)
  if (inspection.projectName) projectInfo.push(inspection.projectName)
  if (inspection.projectLocation) projectInfo.push(inspection.projectLocation)
  if (projectInfo.length > 0) {
    doc.setFontSize(8)
    doc.text(projectInfo.join(" - "), pageWidth - margin, y + 7, { align: "right" })
  }

  y += 26
  doc.setDrawColor(150, 150, 150)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  // Title
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.text(`Inspection N°${inspection.number || inspection.id.slice(-6)}`, pageWidth / 2, y, { align: "center" })
  y += 9

  // Details (left column)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Détails de l'inspection", margin, y)
  y += 6
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  const details = [
    ["Type", inspection.type],
    ["Statut", inspection.status],
    ["Créé par", inspection.creatorId],
    ["Distribution", Array.isArray(inspection.distribution) ? inspection.distribution.join(", ") : ""],
    ["Date de création", inspection.createdAt ? new Date(inspection.createdAt).toLocaleDateString("fr-FR") : ""],
  ]
  details.forEach(([label, value]) => {
    doc.text(`${label} : ${value || "-"}`, margin, y)
    y += 5
  })

  // Statistics
  const totalItems = inspection.responses?.length || 0
  const conforming = inspection.responses?.filter((r: any) => r.response === "conforming").length || 0
  const nonConforming = inspection.responses?.filter((r: any) => r.response === "non-conforming").length || 0
  const notApplicable = inspection.responses?.filter((r: any) => r.response === "not-applicable" || r.response === "na").length || 0
  const unanswered = totalItems - conforming - nonConforming - notApplicable
  y += 2
  doc.setFont("helvetica", "bold")
  doc.text(`Articles inspectés : ${totalItems}   Conforme : ${conforming}   Déficient : ${nonConforming}   S.O. : ${notApplicable}   Non répondu : ${unanswered}`, margin, y)
  y += 7

  // Checklist table
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Liste de vérification", margin, y)
  y += 6
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  inspectionSections.forEach((section: any) => {
    doc.setFont("helvetica", "bold")
    doc.text(section.titleKey, margin, y)
    y += 5
    doc.setFont("helvetica", "normal")
    section.items.forEach((item: any) => {
      const response = inspection.responses.find((r: any) => r.itemId === item.id)
      // Draw checkboxes
      let boxX = margin
      const boxSize = 4
      const labels = ["Conforme", "Déficient", "S.O."]
      const values = ["conforming", "non-conforming", "not-applicable"]
      labels.forEach((lbl, idx) => {
        doc.rect(boxX, y - boxSize + 1, boxSize, boxSize)
        if (response && response.response === values[idx]) {
          doc.setFontSize(10)
          doc.text("✓", boxX + 1, y + 1)
          doc.setFontSize(8)
        }
        doc.text(lbl, boxX + boxSize + 2, y + 2)
        boxX += 24
      })
      // Item number and label
      doc.text(`${item.number} ${item.label}`, margin + 75, y + 2)
      y += 7
      // Comment if present
      if (response && response.comment) {
        doc.setFontSize(7)
        doc.text(`Commentaire : ${response.comment}`, margin + 10, y)
        doc.setFontSize(8)
        y += 5
      }
      // Page break if needed
      if (y > 270) {
        doc.addPage()
        y = margin
      }
    })
    y += 3
  })

  // Attachments (images)
  const images = inspection.attachments?.filter((a: any) => a.type?.startsWith("image/")) || []
  if (images.length > 0) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Pièces jointes", margin, y)
    y += 6
    images.forEach((img: any) => {
      try {
        doc.addImage(img.url, "JPEG", margin, y, 50, 38)
        y += 40
        doc.setFontSize(7)
        doc.text(img.name, margin, y)
        y += 6
      } catch {}
    })
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(6)
    doc.setTextColor(120, 120, 120)
    doc.text(
      `Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`,
      margin,
      290
    )
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth - margin - 20, 290)
  }

  doc.save(filename)
}

// Resolve project/creator for incident PDF when opts provided
function resolveIncidentContext(
  incident: any,
  opts?: { projects?: { id: string; name?: string; code?: string; location?: string }[]; users?: { id: string; name?: string }[] }
) {
  const project = opts?.projects?.find((p) => p.id === incident.projectId)
  const creator = opts?.users?.find((u) => u.id === incident.creatorId)
  return {
    projectName: incident.projectName ?? project?.name ?? "",
    projectNumber: incident.projectNumber ?? project?.code ?? "",
    projectLocation: incident.projectLocation ?? project?.location ?? "",
    creatorName: incident.creatorName ?? creator?.name ?? "",
  }
}

// Export incident as Excel Perfect PDF matching the French template (grid, dashed underlines, red border)
export async function exportIncidentAsPdf(
  incident: any,
  filename: string,
  opts?: { projects?: { id: string; name?: string; code?: string; location?: string }[]; users?: { id: string; name?: string }[] }
) {
  if (typeof window === "undefined") return
  const jsPDF = (await import("jspdf")).default
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10
  const contentWidth = pageWidth - 2 * margin
  const { projectName, projectNumber, projectLocation, creatorName } = resolveIncidentContext(incident, opts)

  let y = margin

  const setDashed = () => {
    try {
      ;(doc as any).setLineDashPattern([2, 2], 0)
    } catch {
      /* noop */
    }
  }
  const setSolid = () => {
    try {
      ;(doc as any).setLineDashPattern([], 0)
    } catch {
      /* noop */
    }
  }

  const drawDashedHLine = (x1: number, x2: number, y: number) => {
    setDashed()
    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.2)
    doc.line(x1, y, x2, y)
    setSolid()
    doc.setDrawColor(0, 0, 0)
  }

  const checkPageBreak = (need: number) => {
    if (y + need > pageHeight - margin - 14) {
      doc.addPage()
      y = margin
    }
  }

  // ----- Header: logo + company (left), project (right) -----
  try {
    doc.addImage("/logo.png", "PNG", margin, y, 22, 22)
  } catch {
    /* noop */
  }
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Construction Interlag", margin + 26, y + 5)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("916 av Simard, #201", margin + 26, y + 10)
  doc.text("Chambly, Quebec J3L 4X2", margin + 26, y + 14)
  doc.text("Téléphone: 514-323-6710", margin + 26, y + 18)
  doc.text("Télécopieur: 514-323-3002", margin + 26, y + 22)

  const projColX = pageWidth - margin
  const projColW = 75
  let ry = y + 4
  doc.setFontSize(8)
  const projLine1 = [projectNumber && `Projet : ${projectNumber}`, projectName].filter(Boolean).join(", ")
  if (projLine1) {
    const projLines = doc.splitTextToSize(projLine1, projColW)
    projLines.forEach((ln: string) => {
      doc.text(ln, projColX, ry, { align: "right" })
      ry += 4
    })
  }
  if (projectLocation) {
    const locLines = doc.splitTextToSize(projectLocation, projColW)
    locLines.forEach((ln: string) => {
      doc.text(ln, projColX, ry, { align: "right" })
      ry += 4
    })
  }

  y += 26

  // ----- Title: centered in dashed box -----
  const title = `Incident n°${incident.number} : ${incident.title || ""}`
  const titleLines = doc.splitTextToSize(title, contentWidth - 8)
  const titleH = Math.max(8, titleLines.length * 5) + 4
  const titleY0 = y
  setDashed()
  doc.setDrawColor(80, 80, 80)
  doc.setLineWidth(0.2)
  doc.rect(margin + 2, titleY0, contentWidth - 4, titleH)
  setSolid()
  doc.setDrawColor(0, 0, 0)
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  titleLines.forEach((ln: string, i: number) => {
    doc.text(ln, pageWidth / 2, titleY0 + 4 + i * 5, { align: "center" })
  })
  y = titleY0 + titleH + 4

  // ----- Two-column grid with dashed underlines -----
  const leftColX = margin + 2
  const leftColW = contentWidth / 2 - 6
  const rightColX = pageWidth / 2 + 2
  const rightColW = contentWidth / 2 - 6
  const labelW = 32
  const rowH = 5.5

  const leftRows: [string, string][] = [
    ["Créateur", creatorName],
    ["Lieu", incident.location || ""],
    ["Date de l'événement", incident.eventDate ? new Date(incident.eventDate).toLocaleDateString("fr-FR") : ""],
    ["Privé(e)", (incident as any).private ? "Oui" : "Non"],
  ]

  const createdStr = incident.createdAt ? new Date(incident.createdAt).toLocaleDateString("fr-FR") : ""
  const statusMap: Record<string, string> = { open: "Ouvert", closed: "Fermé", draft: "Brouillon", "in-progress": "En cours", submitted: "Soumis" }
  const statusStr = statusMap[incident.status] ?? incident.status ?? ""
  const eventTimeStr = incident.eventTime || ""
  const dist = incident.distribution || []
  const distLines = Array.isArray(dist) ? dist : [String(dist)]

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")

  let leftY = y
  leftRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, leftColX, leftY)
    doc.setFont("helvetica", "normal")
    const v = String(value || "")
    const vLines = doc.splitTextToSize(v, leftColW - labelW - 2)
    doc.text(vLines[0] || "", leftColX + labelW, leftY)
    drawDashedHLine(leftColX + labelW, leftColX + leftColW, leftY + 1.5)
    leftY += rowH
  })

  let rightY = y
  doc.setFont("helvetica", "bold")
  doc.text("Créé à", rightColX, rightY)
  doc.setFont("helvetica", "normal")
  doc.text(createdStr, rightColX + labelW, rightY)
  drawDashedHLine(rightColX + labelW, rightColX + rightColW, rightY + 1.5)
  rightY += rowH

  doc.setFont("helvetica", "bold")
  doc.text("Statut", rightColX, rightY)
  doc.setFont("helvetica", "normal")
  doc.text(statusStr, rightColX + labelW, rightY)
  drawDashedHLine(rightColX + labelW, rightColX + rightColW, rightY + 1.5)
  rightY += rowH

  doc.setFont("helvetica", "bold")
  doc.text("Heure de l'événement", rightColX, rightY)
  doc.setFont("helvetica", "normal")
  doc.text(eventTimeStr, rightColX + labelW, rightY)
  drawDashedHLine(rightColX + labelW, rightColX + rightColW, rightY + 1.5)
  rightY += rowH

  doc.setFont("helvetica", "bold")
  doc.text("Distribution", rightColX, rightY)
  doc.setFont("helvetica", "normal")
  rightY += 3.5
  distLines.forEach((line: string) => {
    doc.text(String(line), rightColX + 2, rightY)
    rightY += 3.5
  })
  rightY += 1.5
  drawDashedHLine(rightColX, rightColX + rightColW, rightY)

  y = Math.max(leftY, rightY) + 6

  // ----- À déclarer + Description -----
  checkPageBreak(20)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("À déclarer", leftColX, y)
  doc.setFont("helvetica", "normal")
  doc.text((incident as any).aDeclarer === true ? "Oui" : "Non", leftColX + labelW, y)
  drawDashedHLine(leftColX + labelW, leftColX + leftColW, y + 1.5)
  y += 6

  doc.setFont("helvetica", "bold")
  doc.text("Description", leftColX, y)
  y += 5
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  const desc = incident.description || ""
  const descLines = doc.splitTextToSize(desc || " ", contentWidth - 10)
  const maxDescLines = Math.floor((pageHeight - margin - 14 - y) / 4)
  const firstChunk = descLines.slice(0, Math.max(1, maxDescLines))
  const descH = Math.max(12, firstChunk.length * 4) + 4
  checkPageBreak(descH + 4)
  const descY0 = y
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.15)
  doc.rect(leftColX, descY0, contentWidth - 4, descH)
  firstChunk.forEach((ln: string, i: number) => {
    doc.text(ln, leftColX + 2, descY0 + 4 + i * 4)
  })
  y = descY0 + descH + 4
  const restChunk = descLines.slice(firstChunk.length)
  restChunk.forEach((ln: string) => {
    checkPageBreak(4)
    doc.text(ln, leftColX + 2, y)
    y += 4
  })
  if (restChunk.length) y += 2

  // ----- Pièces jointes -----
  const attachments = incident.attachments || []
  const images = attachments.filter((a: any) => a.type?.startsWith("image/"))
  if (attachments.length > 0) {
    checkPageBreak(20)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Pièces jointes", leftColX, y)
    y += 5
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    for (const att of attachments) {
      if (att.type?.startsWith("image/")) {
        try {
          checkPageBreak(50)
          doc.addImage(att.url, "JPEG", leftColX, y, 60, 40)
          y += 41
          doc.setFontSize(7)
          doc.text(att.name || "Image", leftColX, y)
          y += 5
          doc.setFontSize(8)
        } catch {
          doc.text(`[Image: ${att.name || "?"}]`, leftColX, y)
          y += 5
        }
      } else {
        doc.text(att.name || "Pièce jointe", leftColX, y)
        drawDashedHLine(leftColX, leftColX + leftColW, y + 1.5)
        y += 5
      }
    }
    y += 4
  }

  // ----- Informations sur l'enquête (2x3 grid with dashed underlines) -----
  checkPageBreak(36)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("Informations sur l'enquête", leftColX, y)
  y += 6
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)

  const invW = (contentWidth - 6) / 2
  const invRowH = 9
  const invLabelW = 38
  const invGrid: [string, string][] = [
    ["Danger", incident.investigation?.danger ?? ""],
    ["Condition contributive", incident.investigation?.contributingCondition ?? ""],
    ["Pris dans/entre", (incident.investigation as any)?.prisDansEntre ?? ""],
    ["Équipement", (incident.investigation as any)?.equipement ?? ""],
    ["Comportement contributif", incident.investigation?.contributingBehavior ?? ""],
    ["Utiliser", (incident.investigation as any)?.utiliser ?? ""],
  ]

  for (let row = 0; row < 3; row++) {
    const rowY = y + row * invRowH
    for (let col = 0; col < 2; col++) {
      const idx = row * 2 + col
      const [lbl, val] = invGrid[idx]
      const xx = leftColX + 2 + col * (invW + 2)
      doc.setFont("helvetica", "bold")
      doc.text(lbl, xx, rowY)
      doc.setFont("helvetica", "normal")
      const vLines = doc.splitTextToSize(String(val || ""), invW - invLabelW - 2)
      doc.text(vLines[0] || "", xx + invLabelW, rowY)
      drawDashedHLine(xx + invLabelW, xx + invW, rowY + 1.5)
    }
  }
  y += invRowH * 3 + 4

  // ----- Footer: thin red line + Construction Interlag | Page X sur Y | Imprimé le ... -----
  const pageCount = (doc as any).internal.getNumberOfPages()
  const footerY = pageHeight - 10
  const printedStr = (() => {
    const d = new Date()
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    const h = String(d.getHours()).padStart(2, "0")
    const m = String(d.getMinutes()).padStart(2, "0")
    return `Imprimé le ${day}/${month}/${year} à ${h} h ${m}`
  })()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(180, 50, 50)
    doc.setLineWidth(0.3)
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2)
    doc.setDrawColor(0, 0, 0)
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text("Construction Interlag", margin + 2, footerY + 4)
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, footerY + 4, { align: "center" })
    doc.text(printedStr, pageWidth - margin - 2, footerY + 4, { align: "right" })
    doc.setTextColor(0, 0, 0)
  }

  doc.save(filename)
}
