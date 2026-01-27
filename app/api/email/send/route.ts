/**
 * API Route for sending emails via SMTP
 *
 * This route is called from the client-side email service when SMTP is the
 * selected provider. It uses nodemailer under the hood.
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

    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        { success: false, error: "SMTP not configured" },
        { status: 500 },
      )
    }

    // Some users put quotes in .env values; strip them defensively
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
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    })

    const toArray = Array.isArray(to) ? to : [to]
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
