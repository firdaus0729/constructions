"use client"

import jsPDF from "jspdf"

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
  doc.text("Télécopieur : 514-323-3682", margin + 25, y + 18.5)

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
export async function exportObservationAsPdf(observation: any, filename?: string) {
  if (typeof window === "undefined") return
  const observationNumber = observation.number ?? observation.id?.slice(-6) ?? ""
  const finalFilename = filename ?? `Formulaire Observation ${observationNumber}.pdf`

  const jsPDF = (await import("jspdf")).default
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  const contentWidth = pageWidth - margin * 2

  let projectName = observation.projectName || ""
  let projectLocation = observation.projectLocation || ""
  if (typeof window !== "undefined" && observation.projectId) {
    try {
      const storeData = localStorage.getItem("construction-forms-storage")
      if (storeData) {
        const state = JSON.parse(storeData).state
        const project = state?.projects?.find((p: any) => p.id === observation.projectId)
        if (project) {
          projectName = project.name || projectName
          projectLocation = project.location || projectLocation
        }
      }
    } catch {}
  }
  const projectLine = [observation.projectNumber, projectName].filter(Boolean).join(" ").trim()
  const observationTitle = `Observation Risque de sécurité N°${observationNumber} : ${observation.type || "MES-COR"}: ${observation.title || ""}`

  const thinLine = () => {
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.2)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5
  }

  const drawContinuationHeader = () => {
    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.2)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text(observationTitle, margin, y)
    doc.setFontSize(7)
    const projText = projectLine ? `Projet : ${projectLine}` : ""
    const projLines = doc.splitTextToSize(projText, 95)
    let py = y - 3
    projLines.slice(0, 2).forEach((ln: string) => {
      doc.text(ln, pageWidth - margin, py, { align: "right" })
      py += 3.5
    })
    doc.setFont("helvetica", "normal")
    y += 6
  }

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - margin - 15) {
      doc.addPage()
      y = margin
      drawContinuationHeader()
    }
  }

  let y = margin

  // Helper function to format date as "DD mmm. YYYY"
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return ""
    const d = new Date(date)
    const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }

  // Helper function to format date/time as "DD/MM/YYYY à HH h MM EDT"
  const formatDateTime = (date: Date | string | null | undefined): string => {
    if (!date) return ""
    const d = new Date(date)
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, "0")
    const minutes = String(d.getMinutes()).padStart(2, "0")
    return `${day}/${month}/${year} à ${hours} h ${minutes} EDT`
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
  doc.text("Télécopieur : 514-323-3682", margin + 30, y + 22)

  doc.setFontSize(8)
  let ry = y + 5
  if (projectLine) {
    doc.splitTextToSize(`Projet : ${projectLine}`, 80).forEach((ln: string) => {
      doc.text(ln, pageWidth - margin, ry, { align: "right" })
      ry += 4
    })
  }
  if (projectLocation) {
    doc.splitTextToSize(projectLocation, 80).forEach((ln: string) => {
      doc.text(ln, pageWidth - margin, ry, { align: "right" })
      ry += 4
    })
  }

  y += 30
  thinLine()

  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  const titleLines = doc.splitTextToSize(observationTitle, contentWidth)
  titleLines.forEach((ln: string, idx: number) => {
    doc.text(ln, pageWidth / 2, y + idx * 6, { align: "center" })
  })
  y += titleLines.length * 6 + 4

  // Details two-column layout - exact order from image
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")

  const getStoreUsers = (): any[] => {
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
    return user?.name ?? observation.creatorId ?? "-"
  }

  const getAssignedPersonName = () => {
    if (observation.assignedPersonName) return observation.assignedPersonName
    const users = getStoreUsers()
    const user = users.find((u: any) => u.id === observation.assignedPersonId)
    return user?.name ?? observation.assignedPersonId ?? "-"
  }

  const formatDistribution = (): string => {
    if (!observation.distribution || observation.distribution.length === 0) return "-"
    const users = getStoreUsers()
    if (Array.isArray(observation.distribution) && users.length > 0) {
      return observation.distribution
        .map((userId: string) => {
          const user = users.find((u: any) => u.id === userId)
          return user ? `${user.name} (Construction Interlag)` : userId
        })
        .join("\n")
    }
    return Array.isArray(observation.distribution) ? observation.distribution.join(", ") : String(observation.distribution || "-")
  }

  // Status translation
  const statusMap: Record<string, string> = {
    "draft": "Brouillon",
    "in-progress": "En Progression",
    "submitted": "Soumis",
    "open": "Ouvert",
    "closed": "Fermé"
  }
  const statusText = statusMap[observation.status] || observation.status || "-"

  // Priority translation
  const priorityMap: Record<string, string> = {
    "low": "Faible",
    "medium": "Moyen",
    "high": "Élevé",
    "urgent": "Urgent"
  }
  const priorityText = priorityMap[observation.priority] || observation.priority || "-"

  const leftX = margin
  const rightX = pageWidth / 2 + 5
  const labelWidth = 45
  let leftY = y
  let rightY = y

  // Left column fields (exact order from image)
  const leftFields: Array<[string, string]> = [
    ["Origine", observation.origin || "-"],
    ["Créé par", `${getCreatorName()} (Construction Interlag)`],
    ["Personne assignée", `${getAssignedPersonName()} (Construction Interlag)`],
    ["Date de notification", (observation.date ? formatDate(observation.date) : observation.notificationDate ? formatDate(observation.notificationDate) : observation.createdAt ? formatDate(observation.createdAt) : "-")],
    ["Lieu", observation.location || observation.projectLocation || (observation as any).lieu || "-"],
    ["Date d'échéance", observation.dueDate ? formatDate(observation.dueDate) : "-"],
    ["Condition contributive", observation.safetyAnalysis?.contributingCondition || "-"],
    ["Danger", observation.safetyAnalysis?.danger || "-"],
    ["Section du devis", observation.cnsstSection || "SSE - SANTÉ SÉCURITÉ ENVIRONNEMENT"],
  ]

  // Right column fields (Plans liés is its own section later)
  const rightFields: Array<[string, string]> = [
    ["Statut", statusText],
    ["Date de création", observation.createdAt ? formatDate(observation.createdAt) : "-"],
    ["Distribution", formatDistribution()],
    ["Priorité", priorityText],
    ["Métier", observation.trade || "Charge de projet"],
    ["Privé(e)", (observation as any).private ? "Oui" : "Non"],
    ["Comportement contributif", observation.safetyAnalysis?.contributingBehavior || "-"],
  ]

  // Draw left column
  leftFields.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, leftX, leftY)
    doc.setFont("helvetica", "normal")
    const vLines = doc.splitTextToSize(String(value || "-"), pageWidth / 2 - labelWidth - 5)
    vLines.forEach((line: string, idx: number) => {
      doc.text(line, leftX + labelWidth, leftY + (idx * 4))
    })
    leftY += Math.max(5, vLines.length * 4)
  })

  // Draw right column
  rightFields.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.text(label, rightX, rightY)
    doc.setFont("helvetica", "normal")
    const vLines = doc.splitTextToSize(String(value || "-"), pageWidth / 2 - labelWidth - 5)
    vLines.forEach((line: string, idx: number) => {
      doc.text(line, rightX + labelWidth, rightY + (idx * 4))
    })
    rightY += Math.max(5, vLines.length * 4)
  })

  y = Math.max(leftY, rightY) + 6

  // Description section with date headings
  if (observation.description) {
    checkPageBreak(30)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Description", margin, y)
    y += 6
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    
    // Parse description for date headings (format: "YYYY-MM-DD : text" or "YYYY-MM-DD à HHhMM : text")
    const descLines = observation.description.split("\n")
    descLines.forEach((line: string) => {
      checkPageBreak(5)
      // Check if line starts with date pattern
      const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2})(\s+à\s+(\d{1,2})h(\d{2}))?\s*:/)
      if (dateMatch) {
        // Format date heading
        const datePart = dateMatch[1]
        const [year, month, day] = datePart.split("-")
        const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]
        const monthName = months[parseInt(month) - 1] || month
        let dateHeading = `${day} ${monthName} ${year}`
        if (dateMatch[2]) {
          dateHeading += ` à ${dateMatch[3]}h${dateMatch[4]}`
        }
        dateHeading += " :"
        doc.setFont("helvetica", "bold")
        doc.text(dateHeading, margin, y)
        y += 4
        doc.setFont("helvetica", "normal")
        // Rest of the line after the date
        const restOfLine = line.substring(dateMatch[0].length).trim()
        if (restOfLine) {
          const restLines = doc.splitTextToSize(restOfLine, contentWidth)
          restLines.forEach((ln: string) => {
            checkPageBreak(4)
            doc.text(ln, margin, y)
            y += 4
          })
        }
      } else {
        // Regular line
        const textLines = doc.splitTextToSize(line, contentWidth)
        textLines.forEach((ln: string) => {
          checkPageBreak(4)
          doc.text(ln, margin, y)
          y += 4
        })
      }
    })
    y += 4
  }

  // Reference article (Article de référence (CRTC))
  if (observation.referenceArticle) {
    checkPageBreak(15)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Article de référence (CRTC)", margin, y)
    y += 6
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    const artLines = doc.splitTextToSize(observation.referenceArticle, contentWidth)
    artLines.forEach((ln: string) => {
      checkPageBreak(4)
      doc.text(ln, margin, y)
      y += 4
    })
    y += 4
  }

  // Mesures correctives (bold; sample shows bold and underlined)
  if (observation.correctiveMeasures) {
    checkPageBreak(15)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Mesures correctives:", margin, y)
    y += 6
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    const mLines = doc.splitTextToSize(observation.correctiveMeasures, contentWidth)
    mLines.forEach((ln: string) => {
      checkPageBreak(4)
      doc.text(ln, margin, y)
      y += 4
    })
    y += 4
  }

  // Plans liés (separate section per sample)
  checkPageBreak(10)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("Plans liés", margin, y)
  y += 5
  doc.setFont("helvetica", "normal")
  const plansContent = (observation as any).plansLies || observation.linkedDrawings || ""
  if (plansContent) {
    doc.setFontSize(8)
    doc.splitTextToSize(plansContent, contentWidth).forEach((ln: string) => {
      doc.text(ln, margin, y)
      y += 4
    })
    y += 2
  } else {
    y += 2
  }

  // Pièces jointes (on continuation page: thin line under title, 2x2 grid, thin border per image, blue underlined filename)
  const images = observation.attachments?.filter((a: any) => a.type?.startsWith("image/")) || []
  if (images.length > 0) {
    const imgGap = 6
    const imgW = (contentWidth - imgGap) / 2
    const imgH = 45
    const rows = Math.ceil(images.length / 2)
    const estimatedHeight = 8 + rows * (imgH + 18)
    checkPageBreak(estimatedHeight)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Pièces jointes", margin, y)
    y += 5
    doc.setDrawColor(180, 180, 180)
    doc.setLineWidth(0.2)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6
    doc.setDrawColor(0, 0, 0)

    const baseY = y
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = margin + col * (imgW + imgGap)
      const imgY = baseY + row * (imgH + 18)
      doc.setDrawColor(100, 100, 100)
      doc.setLineWidth(0.2)
      doc.rect(x, imgY, imgW, imgH)
      doc.setDrawColor(0, 0, 0)
      try {
        doc.addImage(img.url, "JPEG", x + 0.5, imgY + 0.5, imgW - 1, imgH - 1)
      } catch (e) {
        // placeholder
      }
      doc.setFontSize(7)
      doc.setTextColor(0, 0, 255)
      const name = img.name || "GetAttachmentThumbnail.jpg"
      doc.text(name, x, imgY + imgH + 3)
      const tw = doc.getTextWidth(name)
      doc.setDrawColor(0, 0, 255)
      doc.line(x, imgY + imgH + 3.5, x + tw, imgY + imgH + 3.5)
      doc.setTextColor(0, 0, 0)
      doc.setDrawColor(0, 0, 0)
    }
    y = baseY + rows * (imgH + 18)
    y += 6
  }

  // Activité (1): thin line above, thin line under title, name+date left, status box right
  checkPageBreak(28)
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.2)
  doc.line(margin, y, pageWidth - margin, y)
  y += 5
  doc.setDrawColor(0, 0, 0)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("Activité (1)", margin, y)
  y += 5
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.2)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6
  doc.setDrawColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  const activityName = getCreatorName()
  const activityDate = observation.updatedAt || observation.createdAt
  const activityDateStr = activityDate ? formatDateTime(activityDate) : ""
  doc.text(activityName, margin, y)
  if (activityDateStr) doc.text(activityDateStr, margin, y + 4)
  const boxX = pageWidth - margin - 58
  const boxW = 56
  const boxY = y - 2
  const boxH = 12
  doc.setFillColor(245, 245, 245)
  doc.setDrawColor(200, 200, 200)
  doc.rect(boxX, boxY, boxW, boxH, "FD")
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.text(`Statut modifié : ${statusText}`, boxX + 3, boxY + 7)
  y += 18

  // Footer: thin dark line above, then company | Page X sur Y | Imprimé le
  const pageCount = (doc as any).internal.getNumberOfPages()
  const footerY = pageHeight - 8
  const printDateStr = formatDateTime(new Date())

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
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.2)
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
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.text(`Inspection N°${inspectionNumber} - Inspection journalière`, margin, 12)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    const projRight = `Projet : ${projectNumber} ${projectName}`.trim()
    const projLines = doc.splitTextToSize(projRight, 95)
    let py = 12
    projLines.slice(0, 2).forEach((ln: string) => {
      doc.text(ln, pageWidth - margin, py, { align: "right" })
      py += 3.5
    })
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.2)
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
  let projY = y + 5
  const projText = `Projet : ${projectNumber} ${projectName}`.trim()
  doc.splitTextToSize(projText, 85).forEach((line: string) => {
    doc.text(line, pageWidth - margin, projY, { align: "right" })
    projY += 3.5
  })
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
  y += 6
  thinLine()

  // ----- Summary: 5 grey boxes (no red) -----
  const allItems = inspectionSections.flatMap((s: any) => s?.items || [])
  const totalItems = allItems.length
  const allResponses = inspection.responses || []
  const conforming = allResponses.filter((r: any) => r.response === "conforming").length
  const nonConforming = allResponses.filter((r: any) => r.response === "non-conforming").length
  const notApplicable = allResponses.filter((r: any) => r.response === "not-applicable" || r.response === "na").length
  const unanswered = totalItems - allResponses.filter((r: any) => r.response != null && r.response !== undefined).length

  const sumY = y
  const colW = (pageWidth - 2 * margin) / 5
  const boxH = 16
  for (let idx = 0; idx < 5; idx++) {
    const x = margin + idx * colW
    doc.setFillColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2])
    doc.rect(x, sumY, colW, boxH, "F")
    doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
    doc.rect(x, sumY, colW, boxH)
  }
  doc.setDrawColor(0, 0, 0)
  const summaryValues = [`${totalItems}/${totalItems}`, `${conforming}`, `${nonConforming}`, `${notApplicable}`, `${unanswered}`]
  const summaryLabels = ["Articles inspectés", "Conforme", "Déficient", "S.O.", "Neutre"]
  summaryValues.forEach((val, idx) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text(val, margin + idx * colW + colW / 2, sumY + 7, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.text(summaryLabels[idx], margin + idx * colW + colW / 2, sumY + 14, { align: "center" })
  })
  y = sumY + boxH + 5

  // ----- Détails de l'inspection (table-like) -----
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Détails de l'inspection", margin, y)
  y += 5
  const leftX = margin
  const rightX = pageWidth / 2 + 2
  const lineH = 4.2
  const statusLabel =
    inspection.status === "closed" && inspection.closedById
      ? `Fermé par ${resolveClosedBy()} le ${formatDateFR(inspection.updatedAt ? new Date(inspection.updatedAt) : new Date())}`
      : inspection.status === "in-progress"
        ? "En Progression"
        : inspection.status === "draft"
          ? "Brouillon"
          : String(inspection.status || "-")

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  const detailsLeft: Array<[string, string]> = [
    ["Type", inspection.type || "-"],
    ["Métier", inspection.metier || "-"],
    ["Section du devis", inspection.sectionDevis || "-"],
    ["Plans liés", inspection.plansLies || "-"],
    ["Description", inspection.description || "-"],
    ["Pièces jointes", inspection.attachments?.length > 0 ? `${inspection.attachments.length}` : "-"],
  ]
  const detailsRight: Array<[string, string]> = [
    ["Statut", statusLabel],
    ["Lieu", inspection.lieu || "-"],
    ["Créé par", responderName || "-"],
  ]
  const maxLines = Math.max(detailsLeft.length, detailsRight.length)
  for (let i = 0; i < maxLines; i++) {
    const [ll, lv] = detailsLeft[i] || ["", ""]
    const [rl, rv] = detailsRight[i] || ["", ""]
    if (ll) {
      doc.setFont("helvetica", "bold")
      doc.text(ll, leftX, y)
      doc.setFont("helvetica", "normal")
      doc.text(String(lv || "-"), leftX + 35, y)
    }
    if (rl) {
      doc.setFont("helvetica", "bold")
      doc.text(rl, rightX, y)
      doc.setFont("helvetica", "normal")
      doc.text(String(rv || "-"), rightX + 35, y)
    }
    y += lineH
  }
  y += 4
  thinLine()

  // ----- Détails de L'Inspection (thin grey line under heading) -----
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Détails de L'Inspection", margin, y)
  y += 5
  drawLightRow(margin, y, pageWidth - 2 * margin, 3)
  y += 5
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  const inspectionDate = inspection.inspectionDate ? new Date(inspection.inspectionDate) : (inspection.createdAt ? new Date(inspection.createdAt) : new Date())
  const dueDate = inspection.dueDate ? new Date(inspection.dueDate) : null
  doc.text("Date de l'inspection", leftX, y)
  doc.text(formatDateFR(inspectionDate), leftX + 45, y)
  doc.text("Date d'échéance", rightX, y)
  doc.text(dueDate ? formatDateFR(dueDate) : "-", rightX + 45, y)
  y += 5
  doc.text("Point de contact", leftX, y)
  doc.text(inspection.contactPoint || "-", leftX + 45, y)
  doc.text("Entrepreneur responsable", rightX, y)
  doc.text(inspection.contractor || "-", rightX + 45, y)
  y += 5
  doc.text("Personne(s) assignée(s)", leftX, y)
  const assigned =
    Array.isArray(inspection.distribution) && inspection.distribution.length > 0
      ? inspection.distribution
          .map((d: any) => (typeof d === "string" ? d : d?.email || d?.userId || ""))
          .filter(Boolean)
          .join(", ")
      : "-"
  doc.splitTextToSize(assigned || "-", pageWidth - 2 * margin - 50).forEach((ln: string) => {
    doc.text(ln, leftX + 45, y)
    y += 4
  })
  y += 5
  thinLine()

  inspectionSections.forEach((section: any) => {
    checkPageBreak(30)

    const sectionStartY = y
    drawLightRow(margin, y, pageWidth - 2 * margin, 10)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    const sectionTitle = section.titleKey || section.title || ""
    doc.text(sectionTitle, margin, y + 6.5)

    const sectionItems = section.items || []
    const sectionResponses = sectionItems.map((item: any) => allResponses.find((r: any) => r.itemId === item.id))
    const sectionConforming = sectionResponses.filter((r: any) => r?.response === "conforming").length
    const sectionNonConforming = sectionResponses.filter((r: any) => r?.response === "non-conforming").length
    const sectionNotApplicable = sectionResponses.filter((r: any) => r?.response === "not-applicable" || r?.response === "na").length
    const sectionNeutral = sectionResponses.filter((r: any) => !r || r.response == null || r.response === undefined).length

    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    const summaryRight = `${sectionNeutral} Neutre     ${sectionConforming} Conforme     ${sectionNonConforming} Déficient     ${sectionNotApplicable} S.O.`
    doc.text(summaryRight, pageWidth - margin, y + 6.5, { align: "right" })
    y += 14

    doc.setFontSize(8)
    sectionItems.forEach((item: any) => {
      checkPageBreak(38)

      const response = allResponses.find((r: any) => r.itemId === item.id)
      const hasResponse = response && response.response !== null && response.response !== undefined
      const responseCount = hasResponse ? 1 : 0
      const attachmentsCount = response?.attachments?.length || 0
      const photosCount = response?.attachments?.filter((a: any) => a.type?.startsWith("image/")).length || 0
      const commentsCount = response?.comment ? 1 : 0
      const observationsCount = 0

      const rowY = y
      drawLightRow(margin, rowY, pageWidth - 2 * margin, 16)

      doc.setFont("helvetica", "bold")
      doc.text(`${item.number} ${item.label}`, margin, rowY + 6)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      const activityText = `Activité: ${responseCount} Changement${responseCount > 1 ? "s" : ""} de réponse, ${attachmentsCount} Pièces jointes, ${photosCount} Photo${photosCount > 1 ? "s" : ""}, ${commentsCount} Commentaire${commentsCount > 1 ? "s" : ""}, ${observationsCount} Observation${observationsCount > 1 ? "s" : ""}`
      doc.text(activityText, margin, rowY + 11)

      // Response record
      if (hasResponse && response) {
        const responseDate = response.updatedAt || response.createdAt || inspection.updatedAt || inspection.createdAt || new Date()
        const dateStr = formatDateFR(new Date(responseDate))
        const timeStr = formatTimeFR(new Date(responseDate))
        
        let responseStatus = ""
        if (response.response === "conforming") responseStatus = "Conforme"
        else if (response.response === "non-conforming") responseStatus = "Échec"
        else if (response.response === "not-applicable" || response.response === "na") responseStatus = "N/A"
        
        doc.setFontSize(7)
        doc.text(`${responderName} (${companyName}) a répondu ${responseStatus} le ${dateStr} à ${timeStr} EDT`, margin, rowY + 15.2)
      }

      // Checkboxes
      const boxSize = 3
      const boxY = rowY + 4
      let boxX = pageWidth - margin - 60
      const checkboxLabels = ["Conforme", "Échec", "S.O."]
      const checkboxValues = ["conforming", "non-conforming", "not-applicable"]
      
      checkboxLabels.forEach((label, idx) => {
        doc.rect(boxX, boxY, boxSize, boxSize)
        if (response && response.response === checkboxValues[idx]) {
          doc.setFontSize(8)
          doc.text("✓", boxX + 0.5, boxY + 2.2)
        }
        doc.setFontSize(7)
        doc.text(label, boxX + boxSize + 1, boxY + 2)
        boxX += 18
      })
      y = rowY + 20

      // Comment if present
      if (response && response.comment) {
        checkPageBreak(10)
        doc.setFontSize(7)
        const commentDate = response.updatedAt || response.createdAt || new Date()
        const commentDateStr = formatDateFR(new Date(commentDate))
        const commentTimeStr = formatTimeFR(new Date(commentDate))
        doc.text(`${responderName} (${companyName}) a laissé un commentaire le ${commentDateStr} à ${commentTimeStr} EDT`, margin + 5, y)
        y += 3
        const commentLines = doc.splitTextToSize(response.comment, pageWidth - 2 * margin - 10)
        commentLines.forEach((line: string) => {
          doc.text(line, margin + 5, y)
          y += 3
        })
        y += 2
      }

      // Photos if present
      if (response && response.attachments) {
        const photos = response.attachments.filter((a: any) => a.type?.startsWith("image/"))
        if (photos.length > 0) {
          checkPageBreak(60)
          const photoDate = response.updatedAt || response.createdAt || new Date()
          const photoDateStr = formatDateFR(new Date(photoDate))
          const photoTimeStr = formatTimeFR(new Date(photoDate))
          doc.setFontSize(7)
          doc.text(`${responderName} (${companyName}) a ajouté ${photos.length} photo${photos.length > 1 ? "s" : ""} via mobile le ${photoDateStr} à ${photoTimeStr} EDT`, margin + 5, y)
          y += 4
          
          const cellW = 78
          const cellH = 44
          const imgW = 60
          const imgH = 28
          const startX = margin + 5
          const gapX = 8
          const gapY = 6

          for (let idx = 0; idx < photos.length; idx++) {
            const col = idx % 2
            const row = Math.floor(idx / 2)
            const x = startX + col * (cellW + gapX)
            const yy = y + row * (cellH + gapY)
            checkPageBreak(cellH + 18)

            doc.setDrawColor(BORDER_GRAY[0], BORDER_GRAY[1], BORDER_GRAY[2])
            doc.rect(x, yy, cellW, cellH)

            const imgX = x + (cellW - imgW) / 2
            const imgY = yy + 6
            doc.rect(imgX, imgY, imgW, imgH)
            try {
              doc.addImage(photos[idx].url, "JPEG", imgX + 0.5, imgY + 0.5, imgW - 1, imgH - 1)
            } catch {}

            const name = photos[idx].name || "photo.jpg"
            doc.setFontSize(7)
            doc.setTextColor(0, 0, 255)
            const textY = imgY + imgH + 6
            doc.text(name, x + cellW / 2, textY, { align: "center" })
            const textW = doc.getTextWidth(name)
            doc.setDrawColor(0, 0, 255)
            doc.setLineWidth(0.2)
            doc.line(x + cellW / 2 - textW / 2, textY + 0.8, x + cellW / 2 + textW / 2, textY + 0.8)
            doc.setTextColor(0, 0, 0)
            doc.setDrawColor(0, 0, 0)
            doc.setLineWidth(0.2)
          }

          const rowsUsed = Math.ceil(photos.length / 2)
          y += rowsUsed * (cellH + gapY) + 2
          y += 2
        }
      }

      y += 3
    })
    y += 2
  })

  // ----- Footer: thin dark line, then company | Page X sur Y | Imprimé le -----
  const pageCount = (doc as any).internal.getNumberOfPages()
  const footerY = pageHeight - 8
  const printDate = new Date()
  const printDateStr = printDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
  const printTimeStr = printDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h ")
  const printedStr = `Imprimé le : ${printDateStr} ${printTimeStr} EDT`

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(0, 0, 0)
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
    doc.setDrawColor(0, 0, 0)
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
      projLines.forEach((ln: string) => {
        doc.text(ln, projColX, ry, { align: "right" })
        ry += 3.5
      })
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

  // ----- Title: centered, bold, larger (Excel Perfect) -----
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  const titleText = `Incident n°${incidentNumber}${incident.title ? ` : ${incident.title}` : ""}`
  const titleLines = doc.splitTextToSize(titleText, contentWidth)
  titleLines.forEach((ln: string, i: number) => {
    doc.text(ln, pageWidth / 2, y + (i * 6), { align: "center" })
  })
  y += titleLines.length * 6 + 4
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
    ["Date de l'événement", formatDate(incident.eventDate)],
    ["Privé(e)", (incident as any).isPrivate || (incident as any).private ? "Oui" : "Non"],
  ]

  const createdStr = formatDate(incident.createdAt)
  const statusMap: Record<string, string> = { open: "Ouvert", closed: "Fermé", draft: "Brouillon", "in-progress": "En cours", submitted: "Soumis" }
  const statusStr = statusMap[incident.status] ?? incident.status ?? ""
  const eventTimeStr = formatTime(incident.eventTime)
  const distLines = formatDistribution()

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
  doc.text("Heure de l'événement", rightColX, rightY)
  doc.setFont("helvetica", "normal")
  doc.text(eventTimeStr, rightColX + labelW, rightY)
  rightY += rowH

  doc.setFont("helvetica", "bold")
  doc.text("Distribution", rightColX, rightY)
  doc.setFont("helvetica", "normal")
  rightY += 3.5
  distLines.forEach((line: string) => {
    doc.text(String(line), rightColX + 2, rightY)
    rightY += 3.5
  })

  y = Math.max(leftY, rightY) + 5
  thinLine()

  // ----- À déclarer -----
  checkPageBreak(12)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("À déclarer", leftColX, y)
  doc.setFont("helvetica", "normal")
  doc.text((incident as any).aDeclarer === true ? "Oui" : "Non", leftColX + labelW, y)
  y += 6

  // ----- Description (paragraph, no box) -----
  doc.setFont("helvetica", "bold")
  doc.text("Description", leftColX, y)
  y += 5
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  const desc = incident.description || ""
  const descLines = doc.splitTextToSize(desc || " ", contentWidth - 4)
  descLines.forEach((ln: string) => {
    checkPageBreak(4)
    doc.text(ln, leftColX, y)
    y += 4
  })
  y += 4
  thinLine()

  // ----- Pièces jointes: thumbnail + blue underlined filename -----
  const attachments = incident.attachments || []
  if (attachments.length > 0) {
    checkPageBreak(20)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Pièces jointes", leftColX, y)
    y += 6
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    for (const att of attachments) {
      if (att.type?.startsWith("image/")) {
        try {
          checkPageBreak(50)
          doc.addImage(att.url, "JPEG", leftColX, y, 50, 35)
          y += 36
        } catch {
          y += 2
        }
      }
      doc.setFontSize(7)
      doc.setTextColor(0, 0, 255)
      const name = att.name || "Pièce jointe"
      doc.text(name, leftColX, y)
      const tw = doc.getTextWidth(name)
      doc.setDrawColor(0, 0, 255)
      doc.setLineWidth(0.2)
      doc.line(leftColX, y + 0.8, leftColX + tw, y + 0.8)
      doc.setTextColor(0, 0, 0)
      doc.setDrawColor(0, 0, 0)
      y += 5
    }
    y += 4
    thinLine()
  }

  // ----- Informations sur l'enquête (2x3 grid, clean) -----
  checkPageBreak(36)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("Informations sur l'enquête", leftColX, y)
  y += 6
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)

  const invW = (contentWidth - 4) / 2
  const invRowH = 9
  const invLabelW = 40
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
      const xx = leftColX + col * (invW + 2)
      doc.setFont("helvetica", "bold")
      doc.text(lbl, xx, rowY)
      doc.setFont("helvetica", "normal")
      const vLines = doc.splitTextToSize(String(val || ""), invW - invLabelW - 2)
      doc.text(vLines[0] || "", xx + invLabelW, rowY)
    }
  }
  y += invRowH * 3 + 6

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
    doc.text("Construction Interlag", margin, footerY + 2)
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, footerY + 2, { align: "center" })
    doc.text(printedStr, pageWidth - margin, footerY + 2, { align: "right" })
    doc.setTextColor(0, 0, 0)
  }

  doc.save(finalFilename)
}
