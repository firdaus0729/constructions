"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

export type EditableComboboxOption = {
  value: string
  label: string
}

type Props = {
  value: string
  onChange: (value: string) => void
  options: EditableComboboxOption[]
  placeholder: string
  searchPlaceholder: string
  emptyLabel: string
  allowCustomValue?: boolean
  customValueLabel?: (query: string) => string
}

export function EditableCombobox({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  allowCustomValue = true,
  customValueLabel,
}: Props) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const selected = React.useMemo(() => options.find((o) => o.value === value) || null, [options, value])

  const normalizedQuery = query.trim()
  const canUseCustom =
    allowCustomValue &&
    normalizedQuery.length > 0 &&
    !options.some((o) => o.label.toLowerCase() === normalizedQuery.toLowerCase()) &&
    !options.some((o) => o.value.toLowerCase() === normalizedQuery.toLowerCase())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{selected ? selected.label : value ? value : placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder}
          />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {canUseCustom && (
                <CommandItem
                  value={normalizedQuery}
                  onSelect={() => {
                    onChange(normalizedQuery)
                    setOpen(false)
                    setQuery("")
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === normalizedQuery ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">
                    {customValueLabel ? customValueLabel(normalizedQuery) : normalizedQuery}
                  </span>
                </CommandItem>
              )}
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={`${opt.label} ${opt.value}`}
                  onSelect={() => {
                    onChange(opt.value)
                    setOpen(false)
                    setQuery("")
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === opt.value ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

