"use client"

import { useState } from "react"
import Link from "next/link"
import { useAppStore } from "@/lib/store"
import { format } from "date-fns"

export const dynamic = 'force-dynamic'
import { useLocale } from "@/lib/locale-context"
import { FileText, Plus, Edit2, Trash2, Search, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AppShell } from "@/components/app-shell"
import { toast } from "sonner"

const statusVariants: Record<string, string> = {
  draft: "bg-blue-500 text-white",
  open: "bg-red-500 text-white",
  "in-progress": "bg-yellow-500 text-white",
  closed: "bg-green-600 text-white",
  submitted: "bg-purple-500 text-white",
}

// Helper function to convert status key to translation key
const getStatusTranslationKey = (status: string): string => {
  const statusMap: Record<string, string> = {
    "draft": "status.draft",
    "open": "status.open",
    "in-progress": "status.inProgress",
    "closed": "status.closed",
    "submitted": "status.submitted"
  }
  return statusMap[status] || `status.${status}`
}

export default function LivrablesPage() {
  const { livrables, deleteLivrable, projects, users } = useAppStore()
  const { t } = useLocale()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const filtered = livrables.filter((livrable) => {
    const matchesSearch =
      livrable.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      livrable.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      livrable.number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !filterStatus || livrable.status === filterStatus

    return matchesSearch && matchesStatus
  })

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("nav.livrables")}</h1>
            <p className="text-muted-foreground mt-2">
              {t("list.countOf", {
                filtered: filtered.length,
                total: livrables.length,
                type: livrables.length !== 1 ? t("list.livrables") : t("list.livrable")
              })}
            </p>
          </div>
          <Button asChild size="lg" className="h-12 gap-2">
            <Link href="/livrables/new">
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
              { key: "draft", label: "status.draft" },
              { key: "open", label: "status.open" },
              { key: "in-progress", label: "status.inProgress" },
              { key: "submitted", label: "status.submitted" },
              { key: "closed", label: "status.closed" }
            ].map((status) => (
              <Button
                key={status.key}
                variant={filterStatus === status.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(filterStatus === status.key ? null : status.key)}
                className="capitalize text-xs"
              >
                {t(status.label as any)}
              </Button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 px-6">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-8">
                <FileText className="h-10 w-10 text-muted-foreground/70" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-center text-foreground">
                {livrables.length === 0 ? t("empty.noLivrables") : t("empty.noMatchingLivrables")}
              </h3>
              <p className="text-muted-foreground text-center mb-10 max-w-sm leading-relaxed">
                {livrables.length === 0
                  ? t("empty.createFirstLivrable")
                  : t("empty.adjustFilters")}
              </p>
              {livrables.length === 0 && (
                <Button asChild size="lg" className="gap-2">
                  <Link href="/livrables/new">
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
            {filtered.map((livrable) => {
              const project = projects.find((p) => p.id === livrable.projectId)
              return (
                <Card key={livrable.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold">{livrable.title || livrable.number}</span>
                          <Badge variant="secondary" className={cn("text-xs", statusVariants[livrable.status])}>
                            {t(getStatusTranslationKey(livrable.status) as any)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{livrable.number}</p>
                        {project && <p className="text-xs text-muted-foreground mt-1">{project.name}</p>}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{livrable.description}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">{t("livrable.livrableType")}</span>
                        <p className="font-medium">{livrable.submittalType || "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("livrable.receivedDate")}</span>
                        <p className="font-medium">{livrable.receivedDate ? format(new Date(livrable.receivedDate), "MMM d") : "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("form.project")}</span>
                        <p className="font-medium">{project?.name || "-"}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 flex-wrap">
                      <Link href={`/livrables/${livrable.id}`} className="flex-1 min-w-[120px]">
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Edit2 className="h-4 w-4" />
                          {t("action.view")}
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(t("confirm.deleteLivrable"))) {
                            deleteLivrable(livrable.id)
                            toast.success("Livrable supprimé")
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
