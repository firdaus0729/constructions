"use client"

import type React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/locale-context"

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormField({ label, required, error, description, children, className }: FormFieldProps) {
  const { t } = useLocale()

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
