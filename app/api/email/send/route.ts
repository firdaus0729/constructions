/**
 * API Route for sending emails via SMTP
 * 
 * This route handles email sending when SMTP is configured.
 * For production, consider using Resend or SendGrid instead.
 */

import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, html, text, from, cc, bcc } = body

    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "SMTP not configured" },
        { status: 500 }
      )
    }

    // In a real implementation, you would use nodemailer or similar
    // For now, we'll return a success response and log
    console.log("📧 SMTP Email would be sent:", {
      from: from || process.env.EMAIL_FROM,
      to,
      subject,
      html: html.substring(0, 100) + "...",
    })

    // TODO: Implement actual SMTP sending using nodemailer
    // Example:
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: parseInt(process.env.SMTP_PORT || "587"),
    //   secure: process.env.SMTP_PORT === "465",
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASSWORD,
    //   },
    // })
    // await transporter.sendMail({ from, to, subject, html, text, cc, bcc })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Email API error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
