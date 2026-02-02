"use client"

import { useState } from "react"
import Link from "next/link"
import { useAppStore } from "@/lib/store"
import { exportIncidentAsPdf } from "@/lib/pdf"
import { format } from "date-fns"

export const dynamic = 'force-dynamic'
import { useLocale } from "@/lib/locale-context"
import { AlertTriangle, Plus, Edit2, Trash2, Search, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AppShell } from "@/components/app-shell"
import { toast } from "sonner"

// Initié (any non-closed) and Fermé only — requested colors
const INITIATED_BADGE = "bg-[#27F54D] text-white"
const CLOSED_BADGE = "bg-[#999999] text-white"

const PRIORITY_BADGE: Record<string, string> = {
  low: "bg-[#05F719] text-white",
  medium: "bg-[#F28705] text-white",
  high: "bg-[#F28705] text-white",
  critical: "bg-[#F70505] text-white",
}

// Display "Initié" for any non-closed status, "Fermé" for closed
const isClosed = (status: string) => status === "closed"
const getDisplayStatusKey = (status: string): string =>
  isClosed(status) ? "status.closed" : "status.initiated"

export default function IncidentsPage() {
  const { incidents, deleteIncident, projects, users, authUsers = [], incidentOptionLists } = useAppStore()
  const { t } = useLocale()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const getCreatorName = (creatorId: string) =>
    (authUsers as { id: string; name: string }[]).find((u) => u.id === creatorId)?.name ||
    users.find((u) => u.id === creatorId)?.name ||
    "-"
  const getAccidentTypeLabel = (accidentTypeId: string) =>
    incidentOptionLists?.accidentTypes?.find((t) => t.id === accidentTypeId)?.label || accidentTypeId

  const filtered = incidents.filter((incident) => {
    const matchesSearch =
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.number.toLowerCase().includes(searchTerm.toLowerCase())

    const incidentClosed = incident.status === "closed"
    const matchesStatus =
      !filterStatus ||
      (filterStatus === "closed" && incidentClosed) ||
      (filterStatus === "initiated" && !incidentClosed)

    return matchesSearch && matchesStatus
  })

  const handleExportPDF = async (incident: (typeof incidents)[0]) => {
    try {
      await exportIncidentAsPdf(incident, undefined, { projects, users })
      toast.success("Incident exported as PDF successfully")
    } catch (error) {
      console.error("PDF export error:", error)
      toast.error("Failed to export incident as PDF")
    }
  }

  const formatIncidentEventDate = (incident: any) => {
    const raw = incident?.eventDate ?? incident?.date ?? incident?.createdAt
    if (!raw) return "-"
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return "-"
    return format(d, "MMM d")
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("nav.incidents")}</h1>
            <p className="text-muted-foreground mt-2">
              {t("list.countOf", {
                filtered: filtered.length,
                total: incidents.length,
                type: incidents.length !== 1 ? "Incidents" : "Incident"
              })}
            </p>
          </div>
          <Button asChild size="lg" className="h-12 gap-2">
            <Link href="/incidents/new">
              <Plus className="h-5 w-5" />
              {t("action.new")}
            </Link>
          </Button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("action.search")}
              className="pl-10 h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "initiated", label: "status.initiated" },
              { key: "closed", label: "status.closed" },
            ].map((s) => (
              <Button
                key={s.key}
                variant={filterStatus === s.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(filterStatus === s.key ? null : s.key)}
                className={cn(
                  "capitalize text-xs",
                  filterStatus === s.key && "text-[#3FAEFC]"
                )}
                style={
                  filterStatus === s.key
                    ? { backgroundColor: "var(--background)", color: "#3FAEFC", borderColor: "#3FAEFC" }
                    : undefined
                }
              >
                {t(s.label as any)}
              </Button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 px-6">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-8">
                <AlertTriangle className="h-10 w-10 text-muted-foreground/70" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-center text-foreground">
                {incidents.length === 0 ? t("empty.noIncidents") : t("empty.noMatchingIncidents")}
              </h3>
              <p className="text-muted-foreground text-center mb-10 max-w-sm leading-relaxed">
                {incidents.length === 0
                  ? t("empty.createFirstIncident")
                  : t("empty.adjustFilters")}
              </p>
              {incidents.length === 0 && (
                <Button asChild size="lg" className="gap-2">
                  <Link href="/incidents/new">
                    <Plus className="h-5 w-5" />
                    {t("action.new")}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* List */}
        {filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((incident) => {
              const project = projects.find((p) => p.id === incident.projectId)
              // Auto-generate project number from project code
              const projectNumber = project?.code || (incident as any).projectNumber || "-"
              const projectDisplay = project?.name || "-"
              const priority = (incident as any).priority as string | undefined
              return (
                <Card key={incident.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#F70505] shrink-0">
                        <AlertTriangle className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold">{incident.title || incident.number}</span>
                          <Badge variant="secondary" className={cn("text-xs text-white", isClosed(incident.status) ? CLOSED_BADGE : INITIATED_BADGE)}>
                            {t(getDisplayStatusKey(incident.status) as any)}
                          </Badge>
                          {priority && (
                            <Badge variant="secondary" className={cn("text-xs", PRIORITY_BADGE[priority] || "bg-[#F28705] text-white")}>
                              {t(`priority.${priority}` as any)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{incident.number}</p>
                        {project && <p className="text-xs text-muted-foreground mt-1">{project.name}</p>}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{incident.description}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">{t("observation.projectNumber")}</span>
                        <p className="font-medium">{projectNumber}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("form.createdBy")}</span>
                        <p className="font-medium">{getCreatorName(incident.creatorId)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("form.status")}</span>
                        <p className="font-medium">{t(getDisplayStatusKey(incident.status) as any)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("incident.accidentType")}</span>
                        <p className="font-medium">{getAccidentTypeLabel(incident.accidentType)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("incident.eventDate")}</span>
                        <p className="font-medium">{formatIncidentEventDate(incident)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 flex-wrap">
                      <Link href={`/incidents/${incident.id}`} className="flex-1 min-w-[120px]">
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Edit2 className="h-4 w-4" />
                          {t("action.view")}
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExportPDF(incident)}
                        className="gap-2"
                        title="Export as PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this incident?")) {
                            deleteIncident(incident.id)
                          }
                        }}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
    </AppShell>
  )
}
