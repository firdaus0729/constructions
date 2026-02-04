"use client"

import { ClipboardCheck, Eye, AlertTriangle, FileText } from "lucide-react"

export const dynamic = 'force-dynamic'

import { AppShell } from "@/components/app-shell"
import { QuickActionCard } from "@/components/dashboard/quick-action-card"
import { FormList } from "@/components/dashboard/form-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/lib/locale-context"
import { useAppStore } from "@/lib/store"
import Link from "next/link"

export default function DashboardPage() {
  const { t } = useLocale()
  const { getRecentClosed, getRecentInitiated } = useAppStore()

  const recentClosed = getRecentClosed()
  const recentInitiated = getRecentInitiated()

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <QuickActionCard
            title={t("dashboard.newInspection")}
            href="/inspections/new"
            icon={ClipboardCheck}
            variant="inspection"
          />
          <QuickActionCard
            title={t("dashboard.newObservation")}
            href="/observations/new"
            icon={Eye}
            variant="inspection"
          />
          <QuickActionCard
            title={t("dashboard.newIncident")}
            href="/incidents/new"
            icon={AlertTriangle}
            variant="warning"
            iconClassName="bg-[#F70505] text-white"
          />
          <QuickActionCard
            title={t("dashboard.newLivrable")}
            href="/livrables/new"
            icon={FileText}
            variant="default"
          />
        </div>

        {/* Recent Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fermé (closed) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">{t("dashboard.closed")}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/forms/closed">{t("dashboard.viewAll")}</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <FormList
                items={recentClosed}
                emptyMessage={t("dashboard.noClosed")}
                statusOverride={{ labelKey: "status.closed", className: "bg-[#999999] text-white" }}
              />
            </CardContent>
          </Card>

          {/* Initié (initiated) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">{t("dashboard.initiated")}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/forms/initiated">{t("dashboard.viewAll")}</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <FormList
                items={recentInitiated}
                emptyMessage={t("dashboard.noInitiated")}
                statusOverride={{ labelKey: "status.initiated", className: "bg-[#27F54D] text-white" }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
