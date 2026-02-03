"use client"

import * as React from "react"
import { Globe, Sun, Database, Bell, Hash, ListChecks, Plus, Pencil, Trash2, Search, Lock, RefreshCw } from "lucide-react"
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
import { useOffline } from "@/lib/offline-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LivrableOptionsDialog } from "@/components/livrable-options-dialog"
import { SESSION_DURATION_OPTIONS } from "@/lib/store"

// Project number section: always French (no dependency on app locale)
const PROJECT_NO_FR = {
  title: "Numéro de projet",
  desc: "Gérer les numéros de projet (Project No) utilisés par les formulaires.",
  count: (n: number) => `${n} projet(s)`,
  add: "Ajouter un numéro de projet",
  addTitle: "Ajouter un numéro de projet",
  editTitle: "Modifier le numéro de projet",
  confirmDelete: "Supprimer ce projet?",
  columns: { code: "Numéro de projet", name: "Nom", location: "Emplacement", actions: "Actions" },
  fields: { code: "Numéro de projet", name: "Nom", location: "Emplacement" },
  placeholders: { code: "ex. 21-5866", name: "ex. MTQ_2503-21-0202", location: "ex. Île-aux-Tourtes (Vaudreuil-Dorion)" },
  searchPlaceholder: "Rechercher des projets...",
  edit: "Modifier",
  remove: "Supprimer",
  cancel: "Annuler",
  save: "Enregistrer",
} as const

export default function SettingsPage() {
  const { locale, setLocale, t } = useLocale()
  const { theme, setTheme } = useTheme()
  const { isOnline, isSyncing, syncNow } = useOffline()
  const { observations, incidents, inspections, projects, addProject, updateProject, deleteProject, sessionDurationMinutes, setSessionDurationMinutes } = useAppStore()
  const [projectDialogOpen, setProjectDialogOpen] = React.useState(false)
  const [editingProjectId, setEditingProjectId] = React.useState<string | null>(null)
  const [projectForm, setProjectForm] = React.useState({ code: "", name: "", location: "" })
  const [projectSearchQuery, setProjectSearchQuery] = React.useState("")

  const projectSearchLower = projectSearchQuery.trim().toLowerCase()
  const filteredProjects = projectSearchLower
    ? projects.filter(
        (p) =>
          p.code.toLowerCase().includes(projectSearchLower) ||
          p.name.toLowerCase().includes(projectSearchLower) ||
          (p.location || "").toLowerCase().includes(projectSearchLower)
      )
    : projects

  const [livrableOptsOpen, setLivrableOptsOpen] = React.useState(false)
  const [livrableOptsKey, setLivrableOptsKey] = React.useState<
    "types" | "packages" | "costCodes" | "locations" | "scheduleTasks"
  >("types")
  const [livrableOptsTitle, setLivrableOptsTitle] = React.useState("")

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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <OfflineIndicator variant="full" className="flex-1 min-w-0" />
                <Button
                  type="button"
                  variant="default"
                  onClick={() => syncNow()}
                  disabled={!isOnline || isSyncing}
                  className="shrink-0 gap-2"
                >
                  {isSyncing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : null}
                  {t("sync.syncNow")}
                </Button>
              </div>
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

          {/* Session */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t("settings.session")}
              </CardTitle>
              <CardDescription>{t("settings.session.desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="session-duration">{t("settings.session.logoutAfter")}</Label>
                <Select
                  value={String(sessionDurationMinutes ?? 60)}
                  onValueChange={(v) => setSessionDurationMinutes(Number(v))}
                >
                  <SelectTrigger id="session-duration" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {t(opt.labelKey as any)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="en">{t("settings.language.english")}</SelectItem>
                    <SelectItem value="fr">{t("settings.language.french")}</SelectItem>
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

          {/* Project No (Projects) - always French */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                {PROJECT_NO_FR.title}
              </CardTitle>
              <CardDescription>{PROJECT_NO_FR.desc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  {PROJECT_NO_FR.count(projects.length)}
                </div>
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => {
                    setEditingProjectId(null)
                    setProjectForm({ code: "", name: "", location: "" })
                    setProjectDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  {PROJECT_NO_FR.add}
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={PROJECT_NO_FR.searchPlaceholder}
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{PROJECT_NO_FR.columns.code}</TableHead>
                    <TableHead>{PROJECT_NO_FR.columns.name}</TableHead>
                    <TableHead>{PROJECT_NO_FR.columns.location}</TableHead>
                    <TableHead className="w-[120px]">{PROJECT_NO_FR.columns.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">{p.code}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="truncate max-w-[220px]">{p.location}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() => {
                              setEditingProjectId(p.id)
                              setProjectForm({ code: p.code, name: p.name, location: p.location })
                              setProjectDialogOpen(true)
                            }}
                            title={PROJECT_NO_FR.edit}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => {
                              if (confirm(PROJECT_NO_FR.confirmDelete)) deleteProject(p.id)
                            }}
                            title={PROJECT_NO_FR.remove}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Livrable dropdown options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" />
                {t("settings.livrableOptions.title")}
              </CardTitle>
              <CardDescription>{t("settings.livrableOptions.desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setLivrableOptsKey("types")
                    setLivrableOptsTitle(t("settings.livrableOptions.types"))
                    setLivrableOptsOpen(true)
                  }}
                >
                  {t("settings.livrableOptions.types")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setLivrableOptsKey("packages")
                    setLivrableOptsTitle(t("settings.livrableOptions.packages"))
                    setLivrableOptsOpen(true)
                  }}
                >
                  {t("settings.livrableOptions.packages")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setLivrableOptsKey("costCodes")
                    setLivrableOptsTitle(t("settings.livrableOptions.costCodes"))
                    setLivrableOptsOpen(true)
                  }}
                >
                  {t("settings.livrableOptions.costCodes")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setLivrableOptsKey("locations")
                    setLivrableOptsTitle(t("settings.livrableOptions.locations"))
                    setLivrableOptsOpen(true)
                  }}
                >
                  {t("settings.livrableOptions.locations")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setLivrableOptsKey("scheduleTasks")
                    setLivrableOptsTitle(t("settings.livrableOptions.scheduleTasks"))
                    setLivrableOptsOpen(true)
                  }}
                >
                  {t("settings.livrableOptions.scheduleTasks")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProjectId ? PROJECT_NO_FR.editTitle : PROJECT_NO_FR.addTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>{PROJECT_NO_FR.fields.code}</Label>
              <Input
                value={projectForm.code}
                onChange={(e) => setProjectForm((s) => ({ ...s, code: e.target.value }))}
                placeholder={PROJECT_NO_FR.placeholders.code}
              />
            </div>
            <div className="space-y-1">
              <Label>{PROJECT_NO_FR.fields.name}</Label>
              <Input
                value={projectForm.name}
                onChange={(e) => setProjectForm((s) => ({ ...s, name: e.target.value }))}
                placeholder={PROJECT_NO_FR.placeholders.name}
              />
            </div>
            <div className="space-y-1">
              <Label>{PROJECT_NO_FR.fields.location}</Label>
              <Input
                value={projectForm.location}
                onChange={(e) => setProjectForm((s) => ({ ...s, location: e.target.value }))}
                placeholder={PROJECT_NO_FR.placeholders.location}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setProjectDialogOpen(false)}
            >
              {PROJECT_NO_FR.cancel}
            </Button>
            <Button
              type="button"
              onClick={() => {
                const code = projectForm.code.trim()
                if (!code) return
                if (editingProjectId) {
                  updateProject(editingProjectId, {
                    code,
                    name: projectForm.name.trim(),
                    location: projectForm.location.trim(),
                  })
                } else {
                  addProject({
                    id: crypto.randomUUID(),
                    code,
                    name: projectForm.name.trim() || code,
                    location: projectForm.location.trim(),
                  })
                }
                setProjectDialogOpen(false)
              }}
            >
              {PROJECT_NO_FR.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LivrableOptionsDialog
        open={livrableOptsOpen}
        onOpenChange={setLivrableOptsOpen}
        listKey={livrableOptsKey}
        title={livrableOptsTitle || t("settings.livrableOptions.title")}
      />
    </AppShell>
  )
}
