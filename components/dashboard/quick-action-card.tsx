"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickActionCardProps {
  title: string
  description?: string
  href: string
  icon: LucideIcon
  variant?: "primary" | "secondary" | "accent" | "warning"
}

export function QuickActionCard({ title, description, href, icon: Icon, variant = "primary" }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all",
        "min-h-[140px] md:min-h-[160px]", // Large touch target
        "hover:scale-[1.02] active:scale-[0.98]",
        variant === "primary" && "border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10",
        variant === "secondary" && "border-border bg-card hover:border-primary/30 hover:bg-secondary",
        variant === "accent" && "border-accent/20 bg-accent/5 hover:border-accent/40 hover:bg-accent/10",
        variant === "warning" &&
          "border-destructive/20 bg-destructive/5 hover:border-destructive/40 hover:bg-destructive/10",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-xl mb-3 transition-colors",
          variant === "primary" &&
            "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
          variant === "secondary" &&
            "bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground",
          variant === "accent" && "bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground",
          variant === "warning" &&
            "bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground",
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <span className="text-base font-semibold text-foreground text-center">{title}</span>
      {description && <span className="text-sm text-muted-foreground text-center mt-1">{description}</span>}
    </Link>
  )
}
