"use client"

import type React from "react"
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  defaultOpen?: boolean
  collapsible?: boolean
  onToggle?: (isOpen: boolean) => void
}

export function FormSection({
  title,
  description,
  children,
  defaultOpen = true,
  collapsible = true,
  onToggle,
}: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleOpenChange = (newState: boolean) => {
    setIsOpen(newState)
    onToggle?.(newState)
  }

  if (!collapsible) {
    return (
      <div className="bg-card rounded-xl border p-4 md:p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {children}
      </div>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      <div className="bg-card rounded-xl border overflow-hidden">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 md:p-6 hover:bg-muted/50 transition-colors">
          <div className="text-left">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <ChevronDown
            className={cn("h-5 w-5 text-muted-foreground transition-transform", isOpen && "transform rotate-180")}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 md:px-6 md:pb-6 pt-0">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
