"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { useLocale } from "@/lib/locale-context"
import { FormField } from "./form-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, UserPlus, Users } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DistributionSelectorProps {
  selectedUserIds: string[]
  selectedGroupIds: string[]
  onUsersChange: (userIds: string[]) => void
  onGroupsChange: (groupIds: string[]) => void
}

export function DistributionSelector({
  selectedUserIds,
  selectedGroupIds,
  onUsersChange,
  onGroupsChange,
}: DistributionSelectorProps) {
  const { t } = useLocale()
  const { authUsers, userGroups } = useAppStore()
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedGroupId, setSelectedGroupId] = useState("")

  const addUser = () => {
    if (selectedUserId && !selectedUserIds.includes(selectedUserId)) {
      onUsersChange([...selectedUserIds, selectedUserId])
      setSelectedUserId("")
    }
  }

  const removeUser = (userId: string) => {
    onUsersChange(selectedUserIds.filter((id) => id !== userId))
  }

  const addGroup = () => {
    if (selectedGroupId && !selectedGroupIds.includes(selectedGroupId)) {
      onGroupsChange([...selectedGroupIds, selectedGroupId])
      setSelectedGroupId("")
    }
  }

  const removeGroup = (groupId: string) => {
    onGroupsChange(selectedGroupIds.filter((id) => id !== groupId))
  }

  const getUserName = (userId: string) => {
    return authUsers.find((u) => u.id === userId)?.name || "Unknown User"
  }

  const getGroupName = (groupId: string) => {
    return userGroups.find((g) => g.id === groupId)?.name || "Unknown Group"
  }

  return (
    <div className="space-y-4">
      {/* User Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          {t("assignUsers")}
        </label>
        <div className="flex gap-2">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={t("selectUser")} />
            </SelectTrigger>
            <SelectContent>
              {authUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.email}) - {user.role.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={addUser} variant="outline" size="icon">
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
        {selectedUserIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedUserIds.map((userId) => (
              <Badge key={userId} variant="secondary" className="gap-1">
                {getUserName(userId)}
                <button
                  type="button"
                  onClick={() => removeUser(userId)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Group Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t("assignGroups")}
        </label>
        <div className="flex gap-2">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={t("selectGroup")} />
            </SelectTrigger>
            <SelectContent>
              {userGroups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name} ({group.memberIds.length} {t("members")})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={addGroup} variant="outline" size="icon">
            <Users className="h-4 w-4" />
          </Button>
        </div>
        {selectedGroupIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedGroupIds.map((groupId) => (
              <Badge key={groupId} variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {getGroupName(groupId)}
                <button
                  type="button"
                  onClick={() => removeGroup(groupId)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
