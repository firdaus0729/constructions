"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Pencil, Trash2, X } from "lucide-react"

import { useAppStore } from "@/lib/store"
import { useLocale } from "@/lib/locale-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

export function ObservationContributingBehaviorCrudCombobox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const { t } = useLocale()
  const { observationOptionLists, addObservationContributingBehaviorOption, updateObservationContributingBehaviorOption, deleteObservationContributingBehaviorOption } = useAppStore()

  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [newLabel, setNewLabel] = React.useState("")
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editingLabel, setEditingLabel] = React.useState("")

  const items = observationOptionLists.contributingBehavior || []
  const selected = items.find((it) => it.id === value) || null

  const stopItemSelect = (e: React.SyntheticEvent) => {
    e.preventDefault()
    // @ts-expect-error stopPropagation exists
    e.stopPropagation?.()
  }

  const startEdit = (id: string, label: string) => {
    setEditingId(id)
    setEditingLabel(label)
  }
  const cancelEdit = () => {
    setEditingId(null)
    setEditingLabel("")
  }
  const saveEdit = () => {
    if (!editingId) return
    const next = editingLabel.trim()
    if (!next) return
    updateObservationContributingBehaviorOption(editingId, { label: next })
    cancelEdit()
  }

  const addNew = () => {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    const existing = items.find((it) => it.label.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      onChange(existing.id)
      setNewLabel("")
      setOpen(false)
      return
    }
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    addObservationContributingBehaviorOption({ id, label: trimmed })
    onChange(id)
    setNewLabel("")
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) {
          setQuery("")
          cancelEdit()
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-12">
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter>
          <CommandInput value={query} onValueChange={setQuery} placeholder={t("action.search")} />
          <CommandList>
            <CommandEmpty>{t("empty.noResults")}</CommandEmpty>
            <CommandGroup>
              {items.map((it) => {
                const isEditing = editingId === it.id
                const isSelected = value === it.id
                return (
                  <CommandItem
                    key={it.id}
                    value={it.label}
                    onSelect={() => {
                      if (isEditing) return
                      onChange(it.id)
                      setOpen(false)
                    }}
                    className="flex items-center"
                  >
                    <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Input
                          value={editingLabel}
                          onChange={(e) => setEditingLabel(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit()
                            if (e.key === "Escape") cancelEdit()
                          }}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onPointerDown={stopItemSelect}
                          onMouseDown={stopItemSelect}
                          onClick={saveEdit}
                          title={t("action.save")}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onPointerDown={stopItemSelect}
                          onMouseDown={stopItemSelect}
                          onClick={cancelEdit}
                          title={t("action.cancel")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="truncate flex-1">{it.label}</span>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onPointerDown={stopItemSelect}
                            onMouseDown={stopItemSelect}
                            onClick={(e) => {
                              stopItemSelect(e)
                              startEdit(it.id, it.label)
                            }}
                            title={t("action.edit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onPointerDown={stopItemSelect}
                            onMouseDown={stopItemSelect}
                            onClick={(e) => {
                              stopItemSelect(e)
                              if (confirm(t("settings.livrableOptions.confirmDelete"))) {
                                deleteObservationContributingBehaviorOption(it.id)
                                if (value === it.id) onChange("")
                              }
                            }}
                            title={t("action.remove")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>

            <div className="border-t p-2">
              <div className="flex gap-2">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder={t("settings.livrableOptions.placeholder")}
                  className="h-9"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addNew()
                  }}
                />
                <Button type="button" className="h-9 shrink-0" onClick={addNew}>
                  {t("settings.livrableOptions.add")}
                </Button>
              </div>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
