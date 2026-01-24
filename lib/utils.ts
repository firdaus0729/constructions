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

export function distanceToNowLocalized(date: Date, locale: 'en' | 'fr') {
  return dfDistance(date, { addSuffix: true, locale: locale === 'fr' ? frLocale : enUS })
}
