/**
 * API Route for sending emails via SMTP
 *
 * This route is called from the client-side email service.
 * It uses nodemailer and SMTP_* environment variables on the server.
 *
 * Configuration (local .env / Vercel):
 * - SMTP_HOST
 * - SMTP_PORT
 * - SMTP_USER
 * - SMTP_PASSWORD
 * - EMAIL_FROM
 */

import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, html, text, from, cc, bcc } = body

    // Basic validation
    if (!to || !subject || !html) {
      return NextResponse.json(
        { success: false, error: "Missing required email fields (to, subject, html)" },
        { status: 400 },
      )
    }

    // Ensure SMTP is configured on the server
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "SMTP is not configured on the server (missing SMTP_* env vars)" },
        { status: 500 },
      )
    }

    // Strip accidental quotes from env values
    const stripQuotes = (value: string | undefined) =>
      value ? value.replace(/^"+|"+$/g, "").replace(/^'+|'+$/g, "") : value

    const host = stripQuotes(process.env.SMTP_HOST)!
    const port = parseInt(process.env.SMTP_PORT || "587", 10)
    const user = stripQuotes(process.env.SMTP_USER)!
    const pass = stripQuotes(process.env.SMTP_PASSWORD)!
    const defaultFrom = stripQuotes(process.env.EMAIL_FROM) || "noreply@construction.app"

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for others
      auth: { user, pass },
    })

    const toArray: string[] = Array.isArray(to) ? to : [to]

    const mailOptions = {
      from: from || defaultFrom,
      to: toArray,
      subject,
      html,
      text,
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("📧 SMTP email sent:", {
      messageId: info.messageId,
      to: toArray,
      subject,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Email API error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
