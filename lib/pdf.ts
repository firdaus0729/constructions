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

// Export observation with proper formatting and embedded images - Pixel perfect match to reference images
export async function exportObservationAsPdf(observation: any, filename: string) {
  if (typeof window === "undefined") return

  const jsPDF = (await import("jspdf")).default
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  const contentWidth = pageWidth - margin * 2

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - margin - 15) {
      doc.addPage()
      y = margin
      // Redraw header on new page
      try {
        doc.addImage("/logo.png", "PNG", margin, y, 26, 26)
      } catch {}
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text("Construction Interlag", margin + 30, y + 5)
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text("926 av Simard, #201", margin + 30, y + 10)
      doc.text("Chambly, Quebec J3L 4X2", margin + 30, y + 14)
      doc.text("Téléphone : 514-323-6710", margin + 30, y + 18)
      doc.text("Télécopieur : 514-323-3682", margin + 30, y + 22)
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

  // Header: logo left + company info, project info right
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

  // Get project info from store
  let projectName = observation.projectName || ""
  let projectLocation = observation.projectLocation || ""
  if (typeof window !== "undefined" && observation.projectId) {
    try {
      const storeData = localStorage.getItem("app-store")
      if (storeData) {
        const parsed = JSON.parse(storeData)
        const state = parsed.state
        if (state?.projects) {
          const project = state.projects.find((p: any) => p.id === observation.projectId)
          if (project) {
            projectName = project.name || projectName
            projectLocation = project.location || projectLocation
          }
        }
      }
    } catch {}
  }

  // Project info right - format: "Projet : [number]" then project name and location
  const projectParts: string[] = []
  if (observation.projectNumber) projectParts.push(`Projet : ${observation.projectNumber}`)
  if (projectName) projectParts.push(projectName)
  if (projectLocation) projectParts.push(projectLocation)
  if (projectParts.length) {
    doc.setFontSize(8)
    const rightX = pageWidth - margin
    let ry = y + 5
    projectParts.forEach((part) => {
      const lines = doc.splitTextToSize(part, 80)
      lines.forEach((ln: string) => {
        doc.text(ln, rightX, ry, { align: "right" })
        ry += 4
      })
    })
  }

  y += 30
  doc.setDrawColor(150, 150, 150)
  doc.setLineWidth(0.2)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  // Title - centered below header line
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  const title = `Observation Risque de sécurité N°${observation.number || ""} : ${observation.type || "MES-COR"}: ${observation.title || ""}`
  const titleLines = doc.splitTextToSize(title, contentWidth)
  titleLines.forEach((ln: string, idx: number) => {
    doc.text(ln, pageWidth / 2, y + idx * 6, { align: "center" })
  })
  y += titleLines.length * 6 + 4

  // Details two-column layout - exact order from image
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")

  // Get user names from store if available
  const getCreatorName = () => {
    if (observation.creatorName) return observation.creatorName
    if (observation.creatorId && typeof window !== "undefined") {
      try {
        // Access Zustand store from localStorage
        const storeData = localStorage.getItem("app-store")
        if (storeData) {
          const parsed = JSON.parse(storeData)
          const state = parsed.state
          if (state?.authUsers) {
            const user = state.authUsers.find((u: any) => u.id === observation.creatorId)
            if (user) return user.name
          }
          if (state?.users) {
            const user = state.users.find((u: any) => u.id === observation.creatorId)
            if (user) return user.name
          }
        }
      } catch {}
    }
    return observation.creatorId || "-"
  }

  const getAssignedPersonName = () => {
    if (observation.assignedPersonName) return observation.assignedPersonName
    if (observation.assignedPersonId && typeof window !== "undefined") {
      try {
        const storeData = localStorage.getItem("app-store")
        if (storeData) {
          const parsed = JSON.parse(storeData)
          const state = parsed.state
          if (state?.authUsers) {
            const user = state.authUsers.find((u: any) => u.id === observation.assignedPersonId)
            if (user) return user.name
          }
          if (state?.users) {
            const user = state.users.find((u: any) => u.id === observation.assignedPersonId)
            if (user) return user.name
          }
        }
      } catch {}
    }
    return observation.assignedPersonId || "-"
  }

  // Format distribution - each name with "(Construction Interlag)"
  const formatDistribution = (): string => {
    if (!observation.distribution || observation.distribution.length === 0) return "-"
    if (typeof window !== "undefined") {
      try {
        const storeData = localStorage.getItem("app-store")
        if (storeData) {
          const parsed = JSON.parse(storeData)
          const state = parsed.state
          const users = state?.authUsers || state?.users || []
          if (Array.isArray(observation.distribution) && users.length > 0) {
            return observation.distribution.map((userId: string) => {
              const user = users.find((u: any) => u.id === userId)
              return user ? `${user.name} (Construction Interlag)` : userId
            }).join("\n")
          }
        }
      } catch {}
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
    ["Date de notification", observation.notificationDate ? formatDate(observation.notificationDate) : (observation.createdAt ? formatDate(observation.createdAt) : "-")],
    ["Lieu", observation.location || observation.projectLocation || "-"],
    ["Date d'échéance", observation.dueDate ? formatDate(observation.dueDate) : "-"],
    ["Condition contributive", observation.safetyAnalysis?.contributingCondition || "-"],
    ["Danger", observation.safetyAnalysis?.danger || "-"],
    ["Section du devis", observation.cnsstSection || "SSE - SANTÉ SÉCURITÉ ENVIRONNEMENT"],
  ]

  // Right column fields
  const rightFields: Array<[string, string]> = [
    ["Statut", statusText],
    ["Date de création", observation.createdAt ? formatDate(observation.createdAt) : "-"],
    ["Distribution", formatDistribution()],
    ["Priorité", priorityText],
    ["Métier", observation.trade || "Charge de projet"],
    ["Privé(e)", observation.private ? "Oui" : "Non"],
    ["Comportement contributif", observation.safetyAnalysis?.contributingBehavior || "-"],
    ["Plans liés", observation.plansLies || "-"],
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

  // Corrective measures (Mesures correctives)
  if (observation.correctiveMeasures) {
    checkPageBreak(15)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Mesures correctives", margin, y)
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

  // Attachments section (Pièces jointes) - 2x2 grid
  const images = observation.attachments?.filter((a: any) => a.type?.startsWith("image/")) || []
  if (images.length > 0) {
    checkPageBreak(60)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Pièces jointes", margin, y)
    y += 6
    
    const imgGap = 6
    const imgW = (contentWidth - imgGap) / 2
    const imgH = 45
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = margin + col * (imgW + imgGap)
      const imgY = y + row * (imgH + 12)
      
      checkPageBreak(imgH + 15)
      
      try {
        doc.addImage(img.url, 'JPEG', x, imgY, imgW, imgH)
      } catch (e) {
        doc.setDrawColor(200)
        doc.rect(x, imgY, imgW, imgH)
      }
      
      // Caption as blue link text
      doc.setFontSize(7)
      doc.setTextColor(0, 0, 255)
      const name = img.name || `GetAttachmentThumbnail.jpg`
      doc.text(name, x, imgY + imgH + 3)
      doc.setTextColor(0, 0, 0)
      
      if (i === images.length - 1 || (i % 2 === 1)) {
        y = imgY + imgH + 12
      }
    }
    y += 6
  }

  // Activity section with status box
  checkPageBreak(25)
  doc.setDrawColor(150, 150, 150)
  doc.setLineWidth(0.2)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6
  
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("Activité (1)", margin, y)
  y += 6
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  const activityName = getCreatorName()
  const activityDate = observation.updatedAt || observation.createdAt
  const activityDateStr = activityDate ? formatDateTime(activityDate) : ""
  
  doc.text(activityName, margin, y)
  if (activityDateStr) {
    doc.text(activityDateStr, margin, y + 4)
  }
  
  // Status box - gray background, right aligned
  const boxX = pageWidth - margin - 60
  const boxW = 55
  const boxY = y - 1
  const boxH = 12
  doc.setFillColor(220, 220, 220)
  doc.setDrawColor(180, 180, 180)
  doc.roundedRect(boxX, boxY, boxW, boxH, 1, 1, "FD")
  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)
  doc.text(`Statut modifié: ${statusText}`, boxX + 3, boxY + 7)
  y += 18

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages()
  const footerY = pageHeight - 8
  const printDate = new Date()
  const printDateStr = formatDateTime(printDate)

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text("Construction Interlag", margin, footerY)
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, footerY, { align: "center" })
    doc.text(`Imprimé le : ${printDateStr}`, pageWidth - margin, footerY, { align: "right" })
    doc.setTextColor(0, 0, 0)
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
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  let y = margin

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - margin - 15) {
      doc.addPage()
      y = margin
      // Redraw header on new page
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
      y += 26
    }
  }

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
  const projectInfo = []
  if (inspection.projectNumber) projectInfo.push(`Projet : ${inspection.projectNumber}`)
  if (inspection.projectName) projectInfo.push(inspection.projectName)
  if (inspection.projectLocation) projectInfo.push(inspection.projectLocation)
  if (projectInfo.length > 0) {
    doc.setFontSize(8)
    const projText = projectInfo.join(" - ")
    const projLines = doc.splitTextToSize(projText, 80)
    let projY = y + 5
    projLines.forEach((line: string) => {
      doc.text(line, pageWidth - margin, projY, { align: "right" })
      projY += 4
    })
  }

  y += 26
  doc.setDrawColor(150, 150, 150)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  // Title
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  const inspectionNumber = inspection.number || inspection.id.slice(-6)
  doc.text(`Inspection N°${inspectionNumber} - Inspection journalière`, margin, y)
  y += 6
  if (projectInfo.length > 0) {
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    const fullProjectText = projectInfo.join(" - ")
    const projectLines = doc.splitTextToSize(fullProjectText, pageWidth - 2 * margin)
    projectLines.forEach((line: string) => {
      doc.text(line, margin, y)
      y += 4
    })
  }
  y += 4

  // Summary statistics
  const allItems = inspectionSections.flatMap((s: any) => s?.items || [])
  const totalItems = allItems.length
  const allResponses = inspection.responses || []
  const conforming = allResponses.filter((r: any) => r.response === "conforming").length
  const nonConforming = allResponses.filter((r: any) => r.response === "non-conforming").length
  const notApplicable = allResponses.filter((r: any) => r.response === "not-applicable" || r.response === "na").length
  const unanswered = totalItems - allResponses.filter((r: any) => r.response !== null && r.response !== undefined).length

  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text(`${totalItems}/${totalItems} Articles inspectés`, margin, y)
  y += 5
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text(`${conforming} Conforme`, margin, y)
  doc.text(`${nonConforming} Déficient`, margin + 30, y)
  doc.text(`${notApplicable} S.O.`, margin + 60, y)
  doc.text(`${unanswered} Neutre`, margin + 85, y)
  y += 6

  // Details section
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("Détails de l'inspection", margin, y)
  y += 5
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  const details = [
    ["Type", inspection.type || "-"],
    ["Métier", inspection.metier || "-"],
    ["Statut", inspection.status || "-"],
    ["Lieu", inspection.lieu || "-"],
    ["Section du devis", inspection.sectionDevis || "-"],
    ["Créé par", inspection.createdBy || inspection.creatorId || "-"],
    ["Plans liés", inspection.plansLies || "-"],
    ["Description", inspection.description || "-"],
    ["Pièces jointes", inspection.attachments?.length > 0 ? `${inspection.attachments.length} fichier(s)` : "-"],
  ]
  details.forEach(([label, value]) => {
    doc.text(`${label} : ${value}`, margin, y)
    y += 4
  })
  y += 2

  // Date section
  doc.text("Date de l'inspection :", margin, y)
  doc.text(inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleDateString("fr-FR") : new Date().toLocaleDateString("fr-FR"), margin + 50, y)
  y += 4
  doc.text("Date d'échéance :", margin, y)
  doc.text(inspection.dueDate ? new Date(inspection.dueDate).toLocaleDateString("fr-FR") : "-", margin + 50, y)
  y += 4
  doc.text("Point de contact :", margin, y)
  doc.text(inspection.contactPoint || "-", margin + 50, y)
  y += 4
  doc.text("Entrepreneur responsable :", margin, y)
  doc.text(inspection.contractor || "-", margin + 50, y)
  y += 4
  doc.text("Personne(s) assignée(s) :", margin, y)
  const assigned = Array.isArray(inspection.distribution) 
    ? inspection.distribution.map((d: any) => d.email || d.userId || "").filter(Boolean).join(", ") || "-"
    : "-"
  doc.text(assigned, margin + 50, y)
  y += 6

  // Inspection sections
  inspectionSections.forEach((section: any) => {
    checkPageBreak(20)
    
    // Section title
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    // Use titleKey directly (it's already in French for French sections)
    const sectionTitle = section.titleKey || section.title || ""
    doc.text(sectionTitle, margin, y)
    y += 5

    // Calculate section statistics
    const sectionItems = section.items || []
    const sectionResponses = sectionItems.map((item: any) => 
      allResponses.find((r: any) => r.itemId === item.id)
    )
    const sectionConforming = sectionResponses.filter((r: any) => r?.response === "conforming").length
    const sectionNonConforming = sectionResponses.filter((r: any) => r?.response === "non-conforming").length
    const sectionNotApplicable = sectionResponses.filter((r: any) => r?.response === "not-applicable" || r?.response === "na").length
    const sectionNeutral = sectionResponses.filter((r: any) => !r || r.response === null || r.response === undefined).length

    // Section summary
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(`0 Neutre, ${sectionConforming} Conforme, ${sectionNonConforming} Déficient, ${sectionNotApplicable} S.O.`, margin, y)
    y += 5

    // Section items
    doc.setFontSize(8)
    sectionItems.forEach((item: any) => {
      checkPageBreak(25)
      
      const response = allResponses.find((r: any) => r.itemId === item.id)
      const hasResponse = response && response.response !== null && response.response !== undefined
      const responseCount = hasResponse ? 1 : 0
      const attachmentsCount = response?.attachments?.length || 0
      const photosCount = response?.attachments?.filter((a: any) => a.type?.startsWith("image/")).length || 0
      const commentsCount = response?.comment ? 1 : 0
      const observationsCount = 0 // Not currently tracked

      // Item number and description
      doc.setFont("helvetica", "bold")
      doc.text(`${item.number} ${item.label}`, margin, y)
      y += 4

      // Activity line
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      const activityText = `Activité: ${responseCount} Changement${responseCount > 1 ? "s" : ""} de réponse, ${attachmentsCount} Pièces jointes, ${photosCount} Photo${photosCount > 1 ? "s" : ""}, ${commentsCount} Commentaire${commentsCount > 1 ? "s" : ""}, ${observationsCount} Observation${observationsCount > 1 ? "s" : ""}`
      doc.text(activityText, margin, y)
      y += 4

      // Response record
      if (hasResponse && response) {
        const responseDate = response.updatedAt || response.createdAt || inspection.updatedAt || inspection.createdAt || new Date()
        const dateStr = new Date(responseDate).toLocaleDateString("fr-FR", { 
          day: "numeric", 
          month: "short", 
          year: "numeric" 
        })
        const timeStr = new Date(responseDate).toLocaleTimeString("fr-FR", { 
          hour: "2-digit", 
          minute: "2-digit" 
        })
        const responderName = inspection.createdBy || inspection.creatorId || "Utilisateur"
        const companyName = "Construction Interlag"
        
        let responseStatus = ""
        if (response.response === "conforming") responseStatus = "Conforme"
        else if (response.response === "non-conforming") responseStatus = "Échec"
        else if (response.response === "not-applicable" || response.response === "na") responseStatus = "N/A"
        
        doc.text(`${responderName} (${companyName}) a répondu ${responseStatus} le ${dateStr} à ${timeStr} EDT`, margin, y)
        y += 4
      }

      // Checkboxes
      const boxSize = 3
      const boxY = y - 2
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
      y += 5

      // Comment if present
      if (response && response.comment) {
        checkPageBreak(10)
        doc.setFontSize(7)
        const commentDate = response.updatedAt || response.createdAt || new Date()
        const commentDateStr = new Date(commentDate).toLocaleDateString("fr-FR", { 
          day: "numeric", 
          month: "short", 
          year: "numeric" 
        })
        const commentTimeStr = new Date(commentDate).toLocaleTimeString("fr-FR", { 
          hour: "2-digit", 
          minute: "2-digit" 
        })
        doc.text(`${responderName} (${companyName}) a laissé un commentaire le ${commentDateStr} à ${commentTimeStr} EDT:`, margin + 5, y)
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
          checkPageBreak(50)
          const photoDate = response.updatedAt || response.createdAt || new Date()
          const photoDateStr = new Date(photoDate).toLocaleDateString("fr-FR", { 
            day: "numeric", 
            month: "short", 
            year: "numeric" 
          })
          const photoTimeStr = new Date(photoDate).toLocaleTimeString("fr-FR", { 
            hour: "2-digit", 
            minute: "2-digit" 
          })
          doc.setFontSize(7)
          doc.text(`${responderName} (${companyName}) a ajouté ${photos.length} photo${photos.length > 1 ? "s" : ""} via mobile le ${photoDateStr} à ${photoTimeStr} EDT`, margin + 5, y)
          y += 4
          
          // Display photos in grid
          photos.forEach((photo: any, idx: number) => {
            if (idx % 2 === 0 && idx > 0) {
              y += 35 // Move to next row
            }
            try {
              const photoX = idx % 2 === 0 ? margin + 5 : margin + 5 + 60
              if (idx % 2 === 0 && idx > 0) {
                checkPageBreak(40)
              } else {
                checkPageBreak(40)
              }
              doc.addImage(photo.url, "JPEG", photoX, y, 50, 35)
              if (idx % 2 === 1 || idx === photos.length - 1) {
                y += 37
              }
            } catch (e) {
              doc.text(`[Image: ${photo.name || "?"}]`, margin + 5, y)
              y += 4
            }
          })
          if (photos.length % 2 === 1) {
            y += 35
          }
          y += 2
        }
      }

      y += 3
    })
    y += 3
  })

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages()
  const footerY = pageHeight - 8
  const printDate = new Date()
  const printDateStr = printDate.toLocaleDateString("fr-FR", { 
    day: "numeric", 
    month: "short", 
    year: "numeric" 
  })
  const printTimeStr = printDate.toLocaleTimeString("fr-FR", { 
    hour: "2-digit", 
    minute: "2-digit" 
  })
  const printedStr = `Imprimé le : ${printDateStr} ${printTimeStr} EDT`

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(6)
    doc.setTextColor(100, 100, 100)
    doc.text("Construction Interlag", margin, footerY)
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, footerY, { align: "center" })
    doc.text(printedStr, pageWidth - margin, footerY, { align: "right" })
    doc.setTextColor(0, 0, 0)
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
