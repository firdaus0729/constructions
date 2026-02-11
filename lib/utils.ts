import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format as dfFormat, formatDistanceToNow as dfDistance } from 'date-fns'
import { enUS, fr as frLocale } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple client-side PDF export using the browser's print dialog
export function exportPageAsPdf() {
  if (typeof window !== 'undefined' && window.print) {
    window.print()
  }
}

export function formatLocalized(date: Date, pattern: string, locale: 'en' | 'fr') {
  return dfFormat(date, pattern, { locale: locale === 'fr' ? frLocale : enUS })
}

/** Parse a date-only string (YYYY-MM-DD) to a Date at local noon to avoid timezone shift. */
export function parseDateOnlyToLocal(value: string): Date {
  if (!value || value.length < 10) return new Date(NaN)
  return new Date(value.slice(0, 10) + "T12:00:00")
}

/** Extract local date as YYYY-MM-DD from a Date (for form inputs). */
export function toLocalDateString(date: Date | string | null | undefined): string {
  if (!date) return ""
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ""
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Extract YYYY-MM-DD from Date/ISO string for form inputs. Uses ISO date part to avoid timezone shift. */
export function toDateOnlyString(date: Date | string | null | undefined): string {
  if (!date) return ""
  const str = typeof date === "string" ? date : date instanceof Date ? date.toISOString() : ""
  const datePart = str?.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart ?? "") ? datePart! : ""
}

/** Format a date-only value (event date, etc.) without timezone shift. Uses ISO date part to avoid UTC-midnight display bugs. */
export function formatDateOnlyLocalized(value: Date | string | null | undefined, pattern: string, locale: 'en' | 'fr'): string {
  if (!value) return ""
  let str = ""
  if (typeof value === "string") {
    str = value
  } else if (value instanceof Date) {
    // Check if date is valid before calling toISOString
    if (isNaN(value.getTime())) return ""
    try {
      str = value.toISOString()
    } catch (e) {
      return ""
    }
  } else {
    return ""
  }
  if (!str) return ""
  const datePart = str.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return ""
  const localNoon = new Date(datePart + "T12:00:00")
  // Check if the parsed date is valid
  if (isNaN(localNoon.getTime())) return ""
  return dfFormat(localNoon, pattern, { locale: locale === "fr" ? frLocale : enUS })
}

export function distanceToNowLocalized(date: Date, locale: 'en' | 'fr') {
  return dfDistance(date, { addSuffix: true, locale: locale === 'fr' ? frLocale : enUS })
}
