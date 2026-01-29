"use client"

import { useState } from "react"
import Link from "next/link"
import { useAppStore } from "@/lib/store"
import { exportObservationAsPdf } from "@/lib/pdf"

export const dynamic = 'force-dynamic'
import { useLocale } from "@/lib/locale-context"
import { Eye, Plus, Edit2, Trash2, Search, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AppShell } from "@/components/app-shell"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const STATUS_BADGE: Record<string, string> = {
  submitted: "bg-[#1865E6] text-white",
  draft: "bg-[#F28705] text-white",
  "in-progress": "bg-[#F28705] text-white",
  open: "bg-[#051DF7] text-white",
  closed: "bg-[#05F719] text-white",
}

const PRIORITY_BADGE: Record<string, string> = {
  low: "bg-[#05F719] text-white",
  medium: "bg-[#F28705] text-white",
  high: "bg-[#F70505] text-white",
}

const getStatusTranslationKey = (status: string): string => {
  const statusMap: Record<string, string> = {
    draft: "status.draft",
    "in-progress": "status.inProgress",
    submitted: "status.submitted",
    open: "status.open",
    closed: "status.closed",
  }
  return statusMap[status] || `status.${status}`
}

export default function ObservationsPage() {
  const { observations, deleteObservation, projects } = useAppStore()
  const { t } = useLocale()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)

  const filtered = observations.filter((obs) => {
    const matchesSearch =
      obs.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obs.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obs.number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !filterStatus || obs.status === filterStatus
    const matchesPriority = !filterPriority || obs.priority === filterPriority

    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleExportPDF = async (observation: (typeof observations)[0]) => {
    try {
      await exportObservationAsPdf(observation, "Exemple Procore Observation.pdf")
      toast.success(t("toast.pdfExportSuccess.observation" as any))
    } catch (error) {
      console.error("PDF export error:", error)
      toast.error(t("toast.pdfExportError.observation" as any))
    }
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{t("nav.observations")}</h1>
              <p className="text-muted-foreground mt-2">
                {t("list.countOf", { 
                  filtered: filtered.length, 
                  total: observations.length,
                  type: observations.length !== 1 ? t("list.observations") : t("list.observation")
                })}
              </p>
            </div>
            <Link href="/observations/new">
              <Button className="gap-2 h-12">
                <Plus className="h-5 w-5" />
                {t("action.new")}
              </Button>
            </Link>
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
                { key: "draft", label: "status.draft" },
                { key: "in-progress", label: "status.inProgress" },
                { key: "open", label: "status.open" },
                { key: "closed", label: "status.closed" },
              ].map((s) => (
                <Button
                  key={s.key}
                  variant={filterStatus === s.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(filterStatus === s.key ? null : s.key)}
                  className={cn("text-xs text-white", filterStatus === s.key && STATUS_BADGE[s.key])}
                  style={filterStatus === s.key ? { backgroundColor: s.key === "draft" || s.key === "in-progress" ? "#F28705" : s.key === "open" ? "#051DF7" : s.key === "closed" ? "#05F719" : undefined } : undefined}
                >
                  {t(s.label as any)}
                </Button>
              ))}
              {["low", "medium", "high"].map((priority) => (
                <Button
                  key={priority}
                  variant={filterPriority === priority ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterPriority(filterPriority === priority ? null : priority)}
                  className={cn("capitalize text-xs text-white", filterPriority === priority && PRIORITY_BADGE[priority])}
                  style={filterPriority === priority ? { backgroundColor: priority === "low" ? "#05F719" : priority === "medium" ? "#F28705" : "#F70505" } : undefined}
                >
                  {t(`priority.${priority}` as any)}
                </Button>
              ))}
            </div>
          </div>

          {/* Empty State */}
          {filtered.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-20 px-6">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-8">
                  <Eye className="h-10 w-10 text-muted-foreground/70" />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-center text-foreground">
                  {observations.length === 0 ? t("empty.noObservations") : t("empty.noMatchingObservations")}
                </h3>
                <p className="text-muted-foreground text-center mb-10 max-w-sm leading-relaxed">
                  {observations.length === 0
                    ? t("empty.createFirstObservation")
                    : t("empty.adjustFilters")}
                </p>
                {observations.length === 0 && (
                  <Link href="/observations/new">
                    <Button size="lg" className="gap-2">
                      <Plus className="h-5 w-5" />
                      {t("action.new")}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* List */}
          {filtered.length > 0 && (
            <div className="space-y-4">
              {filtered.map((observation) => {
                const project = projects.find((p) => p.id === observation.projectId)
                return (
                  <Card key={observation.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#051DF7] shrink-0">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base">{observation.title}</h3>
                          <p className="text-xs text-muted-foreground font-mono">{observation.number}</p>
                          <p className="text-xs text-muted-foreground mt-1">{project?.name || observation.projectId || "-"}</p>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{observation.description}</p>

                      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">{t("observation.projectNumber")}</span>
                          <p className="font-medium font-mono text-muted-foreground">{observation.projectNumber || project?.code || "-"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("form.project")}</span>
                          <p className="font-medium">{project?.name || "-"}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary" className={cn("text-xs", STATUS_BADGE[observation.status] || "bg-[#F28705] text-white")}>
                          {t(getStatusTranslationKey(observation.status) as any)}
                        </Badge>
                        <Badge variant="secondary" className={cn("text-xs", PRIORITY_BADGE[observation.priority] || "bg-[#05F719] text-white")}>
                          {t(`priority.${observation.priority}` as any)}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 flex-wrap">
                        <Link href={`/observations/${observation.id}`} className="flex-1 min-w-30">
                          <Button variant="outline" size="sm" className="w-full gap-2">
                            <Edit2 className="h-4 w-4" />
                            {t("action.view")}
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportPDF(observation)}
                          className="gap-2"
                          title="Export as PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(t("confirm.deleteObservation"))) {
                              deleteObservation(observation.id)
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
