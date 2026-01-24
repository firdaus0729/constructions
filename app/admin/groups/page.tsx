"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useAppStore } from "@/lib/store"
import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, AlertCircle, Users } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { AppShell } from "@/components/app-shell"
import { toast } from "sonner"

export const dynamic = "force-dynamic"

export default function GroupsPage() {
  const { user } = useAuth()
  const { t } = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [formError, setFormError] = useState("")

  // Form state
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const authUsers = useAppStore((state) => state.authUsers)
  const userGroups = useAppStore((state) => state.userGroups)
  const addUserGroup = useAppStore((state) => state.addUserGroup)
  const deleteUserGroup = useAppStore((state) => state.deleteUserGroup)

  const handleAddGroup = () => {
    setFormError("")

    if (!newGroupName) {
      setFormError(t("groupNameRequired"))
      return
    }

    try {
      addUserGroup({
        id: `group-${Date.now()}`,
        name: newGroupName,
        description: newGroupDescription,
        memberIds: selectedMembers,
        createdAt: new Date(),
      })

      // Reset form
      setNewGroupName("")
      setNewGroupDescription("")
      setSelectedMembers([])
      setIsOpen(false)
      toast.success(t("alert.groupCreated") || "Group created successfully")
    } catch (err) {
      setFormError(t("failedToAddGroup"))
      toast.error(t("failedToAddGroup"))
    }
  }

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const getGroupMembers = (groupId: string) => {
    const group = userGroups.find((g) => g.id === groupId)
    if (!group) return []
    return authUsers.filter((u) => group.memberIds.includes(u.id))
  }

  // Only allow admins
  if (!user || user.role !== "admin") {
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
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">{t("groupManagement")}</h1>
            </div>
            <p className="text-muted-foreground mt-1">{t("manageGroupsDescription")}</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 h-12">
                <Plus className="h-5 w-5" />
                {t("addGroup")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("createNewGroup")}</DialogTitle>
                <DialogDescription>{t("addMembersToGroup")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("groupName")} *</label>
                  <Input
                    placeholder={t("groupNamePlaceholder")}
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("description")}</label>
                  <Input
                    placeholder={t("groupDescriptionPlaceholder")}
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">{t("members")}</label>
                  <div className="border rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto bg-muted/30">
                    {authUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t("noUsersAvailable")}</p>
                    ) : (
                      authUsers.map((u) => (
                        <div key={u.id} className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50 transition-colors">
                          <Checkbox
                            id={u.id}
                            checked={selectedMembers.includes(u.id)}
                            onCheckedChange={() => toggleMember(u.id)}
                            className="mt-1"
                          />
                          <label
                            htmlFor={u.id}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium text-sm">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </label>
                          <Badge variant="outline" className="text-xs">{t(u.role)}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    {t("cancel")}
                  </Button>
                  <Button onClick={handleAddGroup}>{t("createGroup")}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Groups Grid */}
        {userGroups.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noGroupsYet")}</h3>
              <p className="text-muted-foreground text-center mb-6">Create your first group to organize team members</p>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t("addGroup")}
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {userGroups.map((group) => {
              const members = getGroupMembers(group.id)
              return (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />
                          <CardTitle className="truncate">{group.name}</CardTitle>
                        </div>
                        {group.description && (
                          <CardDescription className="text-xs line-clamp-2">{group.description}</CardDescription>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          deleteUserGroup(group.id)
                          toast.success(`Group deleted: ${group.name}`)
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-3 font-medium">
                          {t("members")}: <Badge variant="secondary" className="ml-2">{members.length}</Badge>
                        </p>
                        {members.length === 0 ? (
                          <p className="text-muted-foreground/70 text-xs italic">{t("noMembers")}</p>
                        ) : (
                          <div className="space-y-2">
                            {members.map((member) => (
                              <div key={member.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate">{member.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                </div>
                                <Badge variant="outline" className="text-xs shrink-0">{t(member.role)}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )}