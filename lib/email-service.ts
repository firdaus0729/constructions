/**
 * Email Service for Automated Email Notifications
 *
 * This service handles sending automated emails when forms are submitted.
 * It uses a single backend API route (`/api/email/send`) that sends via SMTP.
 *
 * Configuration (local .env / Vercel):
 * - SMTP_HOST
 * - SMTP_PORT
 * - SMTP_USER
 * - SMTP_PASSWORD
 * - EMAIL_FROM
 */

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  cc?: string | string[]
  bcc?: string | string[]
}

export interface FormEmailData {
  formType: "observation" | "incident" | "inspection" | "livrable"
  formNumber: string
  formTitle: string
  projectName?: string
  creatorName: string
  creatorEmail: string
  priority?: string
  status: string
  description?: string
  url?: string
  assignedTo?: Array<{ name: string; email: string }>
}

/**
 * Send email by calling the backend API route.
 * The API route is responsible for talking to SMTP via nodemailer.
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      return {
        success: false,
        error: (data && (data.error as string)) || `Email API returned status ${response.status}`,
      }
    }

    const data = await response.json().catch(() => null)
    return {
      success: data && typeof data.success === "boolean" ? data.success : true,
    }
  } catch (error) {
    console.error("Email sending error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Generate HTML email template for form notifications
 */
export function generateFormEmailTemplate(data: FormEmailData): string {
  const formTypeLabels = {
    observation: "Observation",
    incident: "Incident",
    inspection: "Inspection",
    livrable: "Livrable",
  }

  const priorityBadge = data.priority
    ? `<span style="display: inline-block; padding: 4px 12px; background-color: ${
        data.priority === "critical" || data.priority === "high"
          ? "#ef4444"
          : data.priority === "medium"
            ? "#f59e0b"
            : "#10b981"
      }; color: white; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${data.priority}</span>`
    : ""

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${formTypeLabels[data.formType]} Notification</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
        <h1 style="margin: 0 0 8px 0; color: #1f2937; font-size: 24px;">
          ${formTypeLabels[data.formType]} #${data.formNumber}
        </h1>
        <h2 style="margin: 0 0 16px 0; color: #4b5563; font-size: 18px; font-weight: 500;">
          ${data.formTitle}
        </h2>
        ${priorityBadge ? `<div style="margin-bottom: 16px;">${priorityBadge}</div>` : ""}
      </div>

      <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6b7280; width: 140px;">Type:</td>
            <td style="padding: 8px 0; color: #1f2937;">${formTypeLabels[data.formType]}</td>
          </tr>
          ${data.projectName ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Project:</td>
            <td style="padding: 8px 0; color: #1f2937;">${data.projectName}</td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Status:</td>
            <td style="padding: 8px 0; color: #1f2937;">${data.status}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Created by:</td>
            <td style="padding: 8px 0; color: #1f2937;">${data.creatorName} (${data.creatorEmail})</td>
          </tr>
          ${data.assignedTo && data.assignedTo.length > 0 ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6b7280; vertical-align: top;">Assigned to:</td>
            <td style="padding: 8px 0; color: #1f2937;">
              ${data.assignedTo.map((user) => `${user.name} (${user.email})`).join("<br>")}
            </td>
          </tr>
          ` : ""}
        </table>

        ${data.description ? `
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px;">Description:</h3>
          <p style="margin: 0; color: #4b5563; white-space: pre-wrap;">${data.description}</p>
        </div>
        ` : ""}

        ${data.url ? `
        <div style="margin-top: 24px; text-align: center;">
          <a href="${data.url}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View ${formTypeLabels[data.formType]}
          </a>
        </div>
        ` : ""}
      </div>

      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">This is an automated notification from Construction Forms App.</p>
        <p style="margin: 8px 0 0 0;">Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Send form notification emails to assigned users and groups
 */
export async function sendFormNotificationEmails(
  data: FormEmailData,
  recipientEmails: string[],
  sendNotifications: boolean = true
): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
  if (!sendNotifications || recipientEmails.length === 0) {
    return { success: true, sent: 0, failed: 0, errors: [] }
  }

  const errors: string[] = []
  let sent = 0
  let failed = 0

  const formTypeLabels = {
    observation: "Observation",
    incident: "Incident",
    inspection: "Inspection",
    livrable: "Livrable",
  }

  const subject = `${formTypeLabels[data.formType]} #${data.formNumber}: ${data.formTitle}`

  // Remove duplicates
  const uniqueEmails = [...new Set(recipientEmails)]

  // Send emails to all recipients
  for (const email of uniqueEmails) {
    try {
      const html = generateFormEmailTemplate(data)
      const result = await sendEmail({
        to: email,
        subject,
        html,
        from: process.env.EMAIL_FROM || "noreply@construction.app",
      })

      if (result.success) {
        sent++
      } else {
        failed++
        errors.push(`${email}: ${result.error || "Unknown error"}`)
      }
    } catch (error) {
      failed++
      errors.push(`${email}: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return {
    success: failed === 0,
    sent,
    failed,
    errors,
  }
}

/**
 * Collect email addresses from user IDs and group IDs
 */
export function collectEmailAddresses(
  userIds: string[],
  groupIds: string[],
  users: Array<{ id: string; email: string }>,
  groups: Array<{ id: string; memberIds: string[] }>
): string[] {
  const emails: string[] = []

  // Collect emails from user IDs
  userIds.forEach((userId) => {
    const user = users.find((u) => u.id === userId)
    if (user && user.email) {
      emails.push(user.email)
    }
  })

  // Collect emails from group member IDs
  groupIds.forEach((groupId) => {
    const group = groups.find((g) => g.id === groupId)
    if (group) {
      group.memberIds.forEach((memberId) => {
        const user = users.find((u) => u.id === memberId)
        if (user && user.email) {
          emails.push(user.email)
        }
      })
    }
  })

  return [...new Set(emails)] // Remove duplicates
}
