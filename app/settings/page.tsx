"use client"

import { Globe, Sun, Database, Bell } from "lucide-react"
import { useTheme } from "next-themes"

export const dynamic = 'force-dynamic'
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { OfflineIndicator } from "@/components/offline-indicator"
import { useLocale } from "@/lib/locale-context"
import { useAppStore } from "@/lib/store"

export default function SettingsPage() {
  const { locale, setLocale, t } = useLocale()
  const { theme, setTheme } = useTheme()
  const { observations, incidents, inspections } = useAppStore()

  const totalForms = observations.length + incidents.length + inspections.length
  const pendingSync = [
    ...observations.filter((o) => o.syncStatus === "pending"),
    ...incidents.filter((i) => i.syncStatus === "pending"),
    ...inspections.filter((i) => i.syncStatus === "pending"),
  ].length

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">{t("nav.settings")}</h1>

        <div className="space-y-6">
          {/* Sync Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {t("settings.syncStatus")}
              </CardTitle>
              <CardDescription>{t("settings.syncStatus.desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <OfflineIndicator variant="full" />
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{totalForms}</p>
                  <p className="text-sm text-muted-foreground">{t("settings.totalForms")}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{pendingSync}</p>
                  <p className="text-sm text-muted-foreground">{t("settings.pendingSync")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t("settings.language")}
              </CardTitle>
              <CardDescription>{t("settings.language.desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="language">{t("settings.applicationLanguage")}</Label>
                <Select value={locale} onValueChange={(value) => setLocale(value as "en" | "fr")}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t("settings.notifications")}
              </CardTitle>
              <CardDescription>{t("settings.notifications.desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push">{t("settings.pushNotifications")}</Label>
                  <p className="text-sm text-muted-foreground">{t("settings.pushNotifications.desc")}</p>
                </div>
                <Switch id="push" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sync-alert">{t("settings.syncAlerts")}</Label>
                  <p className="text-sm text-muted-foreground">{t("settings.syncAlerts.desc")}</p>
                </div>
                <Switch id="sync-alert" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                {t("settings.appearance")}
              </CardTitle>
              <CardDescription>{t("settings.appearance.desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="theme">{t("settings.theme")}</Label>
                  <p className="text-sm text-muted-foreground">{t("settings.theme.desc")}</p>
                </div>
                <Select value={theme || "system"} onValueChange={setTheme}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t("settings.theme.light")}</SelectItem>
                    <SelectItem value="dark">{t("settings.theme.dark")}</SelectItem>
                    <SelectItem value="system">{t("settings.theme.system")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
