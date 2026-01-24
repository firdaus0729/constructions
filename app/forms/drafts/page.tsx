"use client"

import { AppShell } from "@/components/app-shell"
import { FormList } from "@/components/dashboard/form-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocale } from "@/lib/locale-context"
import { useAppStore } from "@/lib/store"

export default function DraftsPage() {
  const { t } = useLocale()
  const { observations, incidents, inspections, projects } = useAppStore()

  // Get all drafts and in-progress forms
  const allDrafts = [
    ...observations
      .filter((o) => o.status === "draft" || o.status === "in-progress")
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
      .filter((i) => i.status === "draft" || i.status === "in-progress")
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
      .filter((i) => i.status === "draft" || i.status === "in-progress")
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
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{t("dashboard.recentDrafts")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <FormList items={allDrafts} emptyMessage={t("dashboard.noDrafts")} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
