"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useAppStore } from "@/lib/store"
import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, AlertCircle, UserCircle } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { toast } from "sonner"

export const dynamic = "force-dynamic"

export default function UsersPage() {
  const { user } = useAuth()
  const { t } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [formError, setFormError] = useState("")

  // Form state
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserRole, setNewUserRole] = useState<"admin" | "supervisor" | "worker">("worker")

  const authUsers = useAppStore((state) => state.authUsers)
  const addAuthUser = useAppStore((state) => state.addAuthUser)
  const deleteAuthUser = useAppStore((state) => state.deleteAuthUser)

  // Supervisors can only create worker accounts
  const canCreateSupervisorOrAdmin = user?.role === "admin"

  // Set default role based on user permissions
  useEffect(() => {
    if (!canCreateSupervisorOrAdmin && newUserRole !== "worker") {
      setNewUserRole("worker")
    }
  }, [canCreateSupervisorOrAdmin, newUserRole])

  const handleAddUser = () => {
    setFormError("")

    // Validation
    if (!newUserEmail.trim()) {
      setFormError(t("emailRequired") || "Email is required")
      return
    }
    if (!newUserName.trim()) {
      setFormError(t("nameRequired") || "Name is required")
      return
    }
    if (!newUserPassword.trim()) {
      setFormError(t("passwordRequired") || "Password is required")
      return
    }

    // Check if email already exists
    if (authUsers.some((u) => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
      setFormError(t("emailAlreadyExists") || "Email already exists")
      return
    }

    // Simple hash for demo (NOT production-grade)
    const simpleHash = (password: string) => {
      return Buffer.from(password).toString("base64")
    }

    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      email: newUserEmail.toLowerCase(),
      name: newUserName,
      passwordHash: simpleHash(newUserPassword),
      role: newUserRole,
      createdAt: new Date(),
    }

    addAuthUser(newUser)
    toast.success(`User ${newUserName} created successfully`)

    // Reset form
    setNewUserEmail("")
    setNewUserName("")
    setNewUserPassword("")
    setNewUserRole("worker")
    setIsOpen(false)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "supervisor":
        return "secondary"
      case "worker":
        return "default"
      default:
        return "outline"
    }
  }

  // Allow admins and supervisors to manage users
  if (!user || (user?.role !== "admin" && user?.role !== "supervisor")) {
    return (
      <AppShell>
        <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t("accessDenied")}</AlertDescription>
          </Alert>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">{t("userManagement")}</h1>
            </div>
            <p className="text-muted-foreground mt-1">{t("manageUsersDescription")}</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 h-12">
                <Plus className="h-5 w-5" />
                {t("addUser")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t("addNewUser")}</DialogTitle>
                <DialogDescription>{t("createUserForAccess")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("email")} *</label>
                  <Input
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("name")} *</label>
                  <Input
                    placeholder={t("userNamePlaceholder")}
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("password")} *</label>
                  <Input
                    type="password"
                    placeholder={t("passwordPlaceholder")}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("role")} *</label>
                  <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as any)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {canCreateSupervisorOrAdmin && <SelectItem value="admin">{t("admin")}</SelectItem>}
                      {canCreateSupervisorOrAdmin && <SelectItem value="supervisor">{t("supervisor")}</SelectItem>}
                      <SelectItem value="worker">{t("worker")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {!canCreateSupervisorOrAdmin && (
                    <p className="text-xs text-muted-foreground">
                      {t("supervisorsCanOnlyCreateWorkers")}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    {t("cancel")}
                  </Button>
                  <Button onClick={handleAddUser}>{t("createUser")}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        {authUsers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6">
              <UserCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noUsersYet")}</h3>
              <p className="text-muted-foreground text-center mb-6">Create your first user to get started</p>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t("addUser")}
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t("allUsers")}</CardTitle>
              <CardDescription>{t("totalUsers", { count: authUsers.length })}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("email")}</TableHead>
                      <TableHead>{t("role")}</TableHead>
                      <TableHead>{t("createdAt")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {authUsers.map((currentUser) => (
                      <TableRow key={currentUser.id}>
                        <TableCell className="font-medium">{currentUser.name}</TableCell>
                        <TableCell className="text-sm">{currentUser.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeColor(currentUser.role) as any}>
                            {t(currentUser.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(currentUser.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Prevent deleting your own account
                              if (user && currentUser.email === user.email) {
                                toast.error("You cannot delete your own account")
                                return
                              }
                              
                              if (confirm(`Delete user ${currentUser.name}?`)) {
                                deleteAuthUser(currentUser.id)
                                toast.success(`${t("name")}: ${currentUser.name} deleted`)
                              }
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={user && currentUser.email === user.email}
                            title={user && currentUser.email === user.email ? "Cannot delete your own account" : "Delete user"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
