"use client"

import * as React from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"

import { useAppStore } from "@/lib/store"
import { useLocale } from "@/lib/locale-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ListKey = keyof ReturnType<typeof useAppStore>["livrableOptionLists"]

export function LivrableOptionsDialog({
  open,
  onOpenChange,
  listKey,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  listKey: ListKey
  title: string
}) {
  const { t } = useLocale()
  const { livrableOptionLists, addLivrableOption, updateLivrableOption, deleteLivrableOption } = useAppStore()

  const items = livrableOptionLists[listKey] || []

  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [label, setLabel] = React.useState("")

  const reset = () => {
    setEditingId(null)
    setLabel("")
  }

  const onSave = () => {
    const trimmed = label.trim()
    if (!trimmed) return

    if (editingId) {
      updateLivrableOption(listKey, editingId, { label: trimmed })
    } else {
      addLivrableOption(listKey, { id: `${listKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label: trimmed })
    }
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) reset()
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label>{t("settings.livrableOptions.label")}</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("settings.livrableOptions.placeholder")} />
            </div>
            <Button type="button" className="gap-2" onClick={onSave}>
              <Plus className="h-4 w-4" />
              {editingId ? t("settings.livrableOptions.save") : t("settings.livrableOptions.add")}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("settings.livrableOptions.columns.label")}</TableHead>
                <TableHead className="w-[120px]">{t("settings.livrableOptions.columns.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.label}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => {
                          setEditingId(it.id)
                          setLabel(it.label)
                        }}
                        title={t("action.edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => {
                          if (confirm(t("settings.livrableOptions.confirmDelete"))) deleteLivrableOption(listKey, it.id)
                        }}
                        title={t("action.remove")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("action.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

