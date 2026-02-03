"use client"

import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Shield, 
  Users, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Cloud,
  CloudOff,
  Settings,
  Search
} from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { toast } from "sonner"
import {
  getAzureAdGroups,
  getAzureAdGroup,
  getAzureAdGroupMembers,
  getAzureAdGroupMemberCount,
  syncUsersFromAzureGroup,
  isAzureAdConfigured,
  signInWithAzure,
  getCurrentAzureUser,
  type AzureAdGroup,
  type AzureAdUser,
} from "@/lib/azure-ad"
import type { UserRole } from "@/lib/types"

export const dynamic = "force-dynamic"

const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    description: "Administrators with full system access",
    color: "destructive",
    icon: Shield,
  },
  supervisor: {
    label: "Supervisor",
    description: "Supervisors who can manage workers and review forms",
    color: "secondary",
    icon: Users,
  },
  worker: {
    label: "Worker",
    description: "Workers who can create and submit forms",
    color: "default",
    icon: Users,
  },
} as const

export default function RolesAndUsersPage() {
  const { user } = useAuth()
  const { t } = useLocale()
  const [configDialogRole, setConfigDialogRole] = useState<UserRole | null>(null)
  const [isSyncing, setIsSyncing] = useState<Record<UserRole, boolean>>({
    admin: false,
    supervisor: false,
    worker: false,
  })
  const [azureGroups, setAzureGroups] = useState<AzureAdGroup[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAzureConnected, setIsAzureConnected] = useState(false)

  const azureAdGroupConfigs = useAppStore((state) => state.azureAdGroupConfigs)
  const setAzureAdGroupConfig = useAppStore((state) => state.setAzureAdGroupConfig)
  const initializeAzureAdGroupConfigs = useAppStore((state) => state.initializeAzureAdGroupConfigs)
  const authUsers = useAppStore((state) => state.authUsers)
  const addAuthUser = useAppStore((state) => state.addAuthUser)
  const updateAuthUser = useAppStore((state) => state.updateAuthUser)

  // Initialize Azure AD group configs on mount
  useEffect(() => {
    initializeAzureAdGroupConfigs()
    checkAzureConnection()
  }, [initializeAzureAdGroupConfigs])

  const checkAzureConnection = async () => {
    const currentUser = await getCurrentAzureUser()
    setIsAzureConnected(!!currentUser && isAzureAdConfigured())
  }

  const handleConnectAzure = async () => {
    try {
      const result = await signInWithAzure()
      if (result) {
        setIsAzureConnected(true)
        toast.success("Connected to Azure AD successfully")
        await loadAzureGroups()
      } else {
        toast.error("Failed to connect to Azure AD")
      }
    } catch (error) {
      console.error("Azure AD connection error:", error)
      toast.error("Failed to connect to Azure AD")
    }
  }

  const loadAzureGroups = async () => {
    try {
      const groups = await getAzureAdGroups()
      setAzureGroups(groups)
    } catch (error) {
      console.error("Failed to load Azure AD groups:", error)
      toast.error("Failed to load Azure AD groups")
    }
  }

  const handleConfigureGroup = async (role: UserRole, groupId: string) => {
    try {
      const group = await getAzureAdGroup(groupId)
      if (group) {
        const memberCount = await getAzureAdGroupMemberCount(groupId)
        setAzureAdGroupConfig(role, {
          azureGroupId: groupId,
          azureGroupName: group.displayName,
          description: group.description,
          lastSyncedAt: null,
          memberCount,
        })
        toast.success(`Configured ${ROLE_CONFIG[role].label} group: ${group.displayName}`)
      }
    } catch (error) {
      console.error(`Failed to configure ${role} group:`, error)
      toast.error(`Failed to configure ${role} group`)
    }
  }

  const handleSyncGroup = async (role: UserRole) => {
    const config = azureAdGroupConfigs.find((c) => c.role === role)
    if (!config || !config.azureGroupId) {
      toast.error(`No Azure AD group configured for ${ROLE_CONFIG[role].label}`)
      return
    }

    setIsSyncing((prev) => ({ ...prev, [role]: true }))

    try {
      const result = await syncUsersFromAzureGroup(config.azureGroupId, role)

      if (result.success) {
        // Update or create users in local store
        for (const azureUser of result.users) {
          const existingUser = authUsers.find((u) => u.azureAdId === azureUser.azureAdId)
          
          if (existingUser) {
            // Update existing user
            updateAuthUser(existingUser.id, {
              name: azureUser.name,
              email: azureUser.email,
              role: azureUser.role,
              azureAdId: azureUser.azureAdId,
              azureAdGroupId: config.azureGroupId,
            })
          } else {
            // Create new user (without password - they'll use Azure AD auth)
            addAuthUser({
              id: `user-${Date.now()}-${Math.random()}`,
              email: azureUser.email,
              name: azureUser.name,
              passwordHash: "", // Azure AD users don't need local password
              role: azureUser.role,
              createdAt: new Date(),
              azureAdId: azureUser.azureAdId,
              azureAdGroupId: config.azureGroupId,
            })
          }
        }

        // Update last synced time
        const memberCount = await getAzureAdGroupMemberCount(config.azureGroupId)
        setAzureAdGroupConfig(role, {
          lastSyncedAt: new Date(),
          memberCount,
        })

        toast.success(
          `Synced ${result.syncedCount} users from ${ROLE_CONFIG[role].label} group`
        )
      } else {
        toast.error(`Failed to sync ${ROLE_CONFIG[role].label} group`)
      }
    } catch (error) {
      console.error(`Failed to sync ${role} group:`, error)
      toast.error(`Failed to sync ${ROLE_CONFIG[role].label} group`)
    } finally {
      setIsSyncing((prev) => ({ ...prev, [role]: false }))
    }
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

  const filteredGroups = azureGroups.filter((group) =>
    group.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Roles & Users</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Manage role-based access control with Microsoft Azure AD Groups
            </p>
          </div>
          <div className="flex gap-2">
            {!isAzureConnected && (
              <Button onClick={handleConnectAzure} variant="outline" className="gap-2">
                {isAzureAdConfigured() ? (
                  <>
                    <Cloud className="h-4 w-4" />
                    Connect to Azure AD
                  </>
                ) : (
                  <>
                    <CloudOff className="h-4 w-4" />
                    Azure AD Not Configured
                  </>
                )}
              </Button>
            )}
            {isAzureConnected && (
              <Button onClick={loadAzureGroups} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh Groups
              </Button>
            )}
          </div>
        </div>

        {/* Azure AD Connection Status */}
        {!isAzureAdConfigured() && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Azure AD is not configured. Please set the following environment variables:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>NEXT_PUBLIC_AZURE_CLIENT_ID</li>
                <li>NEXT_PUBLIC_AZURE_TENANT_ID</li>
                <li>NEXT_PUBLIC_AZURE_REDIRECT_URI</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Three Role-Based Azure AD Groups */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-8">
          {(["admin", "supervisor", "worker"] as UserRole[]).map((role) => {
            const config = azureAdGroupConfigs.find((c) => c.role === role)
            const roleInfo = ROLE_CONFIG[role]
            const Icon = roleInfo.icon
            const isSyncingRole = isSyncing[role]

            return (
              <Card key={role} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-${roleInfo.color}-100 dark:bg-${roleInfo.color}-900 flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 text-${roleInfo.color}-600 dark:text-${roleInfo.color}-300`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{roleInfo.label}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {roleInfo.description}
                        </CardDescription>
                      </div>
                    </div>
                    {config?.azureGroupId && (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Configured
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {config?.azureGroupId ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Azure AD Group:</span>
                          <span className="font-medium">{config.azureGroupName || "Unknown"}</span>
                        </div>
                        {config.memberCount !== undefined && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Members:</span>
                            <Badge variant="secondary">{config.memberCount}</Badge>
                          </div>
                        )}
                        {config.lastSyncedAt && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Last Synced:</span>
                            <span className="text-xs">
                              {new Date(config.lastSyncedAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSyncGroup(role)}
                          disabled={isSyncingRole || !isAzureConnected}
                          className="flex-1 gap-2"
                          size="sm"
                        >
                          {isSyncingRole ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4" />
                              Sync Users
                            </>
                          )}
                        </Button>
                        <Dialog open={configDialogRole === role} onOpenChange={(open) => setConfigDialogRole(open ? role : null)}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              onClick={() => {
                                setConfigDialogRole(role)
                                loadAzureGroups()
                              }}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Configure {roleInfo.label} Group</DialogTitle>
                              <DialogDescription>
                                Select an Azure AD group for {roleInfo.label} role
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Search Groups</label>
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search Azure AD groups..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                  />
                                </div>
                              </div>
                              <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                                {filteredGroups.length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    {searchTerm ? "No groups found" : "Search for Azure AD groups"}
                                  </p>
                                ) : (
                                  filteredGroups.map((group) => (
                                    <button
                                      key={group.id}
                                      onClick={() => {
                                        handleConfigureGroup(role, group.id)
                                        setConfigDialogRole(null)
                                        setSearchTerm("")
                                      }}
                                      className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                                    >
                                      <div className="font-medium text-sm">{group.displayName}</div>
                                      {group.description && (
                                        <div className="text-xs text-muted-foreground">
                                          {group.description}
                                        </div>
                                      )}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          No Azure AD group configured for this role
                        </AlertDescription>
                      </Alert>
                      <Dialog open={configDialogRole === role} onOpenChange={(open) => setConfigDialogRole(open ? role : null)}>
                        <DialogTrigger asChild>
                          <Button
                            className="w-full gap-2"
                            disabled={!isAzureConnected}
                            onClick={() => {
                              setConfigDialogRole(role)
                              loadAzureGroups()
                            }}
                          >
                            <Settings className="h-4 w-4" />
                            Configure Group
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Configure {roleInfo.label} Group</DialogTitle>
                            <DialogDescription>
                              Select an Azure AD group for {roleInfo.label} role
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Search Groups</label>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search Azure AD groups..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="pl-9"
                                />
                              </div>
                            </div>
                            <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                              {filteredGroups.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  {searchTerm ? "No groups found" : "Search for Azure AD groups"}
                                </p>
                              ) : (
                                filteredGroups.map((group) => (
                                  <button
                                    key={group.id}
                                    onClick={() => {
                                      handleConfigureGroup(role, group.id)
                                      setConfigDialogRole(null)
                                      setSearchTerm("")
                                    }}
                                    className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                                  >
                                    <div className="font-medium text-sm">{group.displayName}</div>
                                    {group.description && (
                                      <div className="text-xs text-muted-foreground">
                                        {group.description}
                                      </div>
                                    )}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Users by Role Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
            <CardDescription>
              Users synced from Azure AD Groups and their assigned roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Azure AD Group</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No users synced yet. Configure and sync Azure AD groups above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    authUsers.map((authUser) => {
                      const groupConfig = authUser.azureAdGroupId
                        ? azureAdGroupConfigs.find((c) => c.azureGroupId === authUser.azureAdGroupId)
                        : null

                      return (
                        <TableRow key={authUser.id}>
                          <TableCell className="font-medium">{authUser.name}</TableCell>
                          <TableCell>{authUser.email}</TableCell>
                          <TableCell>
                            <Badge variant={ROLE_CONFIG[authUser.role].color as any}>
                              {ROLE_CONFIG[authUser.role].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {groupConfig?.azureGroupName || (
                              <span className="text-muted-foreground text-sm">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {authUser.azureAdId ? (
                              <Badge variant="outline" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Synced
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Local</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
