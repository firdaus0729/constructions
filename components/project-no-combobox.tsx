 "use client"
 
import * as React from "react"
import { ChevronsUpDown, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Project } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
 
 type Props = {
   projects: Project[]
   value: string | null | undefined
   onChange: (projectId: string) => void
  placeholder?: string
 }
 
export function ProjectNoCombobox({
  projects,
  value,
  onChange,
  // Always use a French default placeholder for Project No
  placeholder = "Sélectionner un numéro de projet...",
}: Props) {
  const [open, setOpen] = React.useState(false)
  const selected = projects.find((p) => p.id === value) || null
 
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
           <span className="truncate">
            {selected ? `${selected.code} — ${selected.name}` : placeholder}
           </span>
           <ChevronsUpDown className="h-4 w-4 opacity-50" />
         </Button>
       </PopoverTrigger>
       <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
         <Command>
          {/* Always show French UI text for search */}
          <CommandInput placeholder="Rechercher..." />
           <CommandList>
            {/* Always show French UI text when there are no projects */}
            <CommandEmpty>Aucun projet trouvé</CommandEmpty>
             <CommandGroup>
               {projects.map((p) => (
                 <CommandItem
                   key={p.id}
                   value={`${p.code} ${p.name} ${p.location}`}
                   onSelect={() => {
                     onChange(p.id)
                     setOpen(false)
                   }}
                 >
                   <Check className={cn("mr-2 h-4 w-4", value === p.id ? "opacity-100" : "opacity-0")} />
                   <span className="font-mono text-xs mr-2">{p.code}</span>
                   <span className="truncate">{p.name}</span>
                 </CommandItem>
               ))}
             </CommandGroup>
           </CommandList>
         </Command>
       </PopoverContent>
     </Popover>
   )
 }
