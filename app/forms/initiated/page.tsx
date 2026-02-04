"use client"

import { AppShell } from "@/components/app-shell"
import { FormList } from "@/components/dashboard/form-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocale } from "@/lib/locale-context"
import { useAppStore } from "@/lib/store"

export default function InitiatedPage() {
  const { t } = useLocale()
  const { observations, incidents, inspections, livrables, projects } = useAppStore()

  // Get all initiated forms (non-closed: open, draft, in-progress, submitted)
  const allInitiated = [
    ...observations
      .filter((o) => o.status !== "closed")
      .map((o) => ({
        id: o.id,
        type: "observation" as const,
        number: o.number,
        title: o.title,
        projectName: projects.find((p) => p.id === o.projectId)?.name || "",
        status: o.status,
        updatedAt: new Date(o.updatedAt),
        syncStatus: o.syncStatus,
      })),
    ...incidents
      .filter((i) => i.status !== "closed")
      .map((i) => ({
        id: i.id,
        type: "incident" as const,
        number: i.number,
        title: i.title,
        projectName: projects.find((p) => p.id === i.projectId)?.name || "",
        status: i.status,
        updatedAt: new Date(i.updatedAt),
        syncStatus: i.syncStatus,
      })),
    ...inspections
      .filter((i) => i.status !== "closed")
      .map((i) => ({
        id: i.id,
        type: "inspection" as const,
        number: i.id.slice(-6).toUpperCase(),
        title: i.documentTitle,
        projectName: projects.find((p) => p.id === i.projectId)?.name || "",
        status: i.status,
        updatedAt: new Date(i.updatedAt),
        syncStatus: i.syncStatus,
      })),
    ...livrables
      .filter((s) => s.status !== "closed")
      .map((s) => ({
        id: s.id,
        type: "livrable" as const,
        number: s.number,
        title: s.title,
        projectName: projects.find((p) => p.id === s.projectId)?.name || "",
        status: s.status,
        updatedAt: new Date(s.updatedAt),
        syncStatus: s.syncStatus,
      })),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{t("dashboard.initiated")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <FormList
              items={allInitiated}
              emptyMessage={t("dashboard.noInitiated")}
              statusOverride={{ labelKey: "status.initiated", className: "bg-[#27F54D] text-white" }}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

