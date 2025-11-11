"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
  meta?: any
}

interface ComboboxSelectProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  inputPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

export function ComboboxSelect({
  options,
  value,
  onValueChange,
  placeholder = "Selecione um item...",
  inputPlaceholder = "Digite para buscar...",
  emptyMessage = "Nenhum item encontrado.",
  className,
  disabled = false,
  autoOpenOnSingle = false,
}: ComboboxSelectProps & { autoOpenOnSingle?: boolean }) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  // normalize (remove accents, lower case)
  const normalize = (s: string) =>
    s?.normalize?.("NFD")?.replace(/[\u0300-\u036f]/g, "")?.toLowerCase() ?? ""

  const filteredOptions = React.useMemo(() => {
    const s = normalize(searchValue)
    if (!s) return options
    
    return options.filter((opt) => {
      const haystacks: string[] = [opt.label]
      if (opt.meta) {
        const m: any = opt.meta
        if (m.name) haystacks.push(String(m.name))
        if (m.specifications) haystacks.push(String(m.specifications))
        if (m.barcode) haystacks.push(String(m.barcode))
      }
      
      // More permissive search - match if ANY field contains the search term
      return haystacks.some(text => normalize(text).includes(s))
    })
  }, [options, searchValue])

  const [pendingOption, setPendingOption] = React.useState<ComboboxOption | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)

  // Auto-open detail dialog when exactly one match remains
  React.useEffect(() => {
    if (!autoOpenOnSingle) return
    if (!searchValue || searchValue.trim() === "") return
    if (filteredOptions.length === 1) {
      const only = filteredOptions[0]
      if (!only.disabled) {
        setPendingOption(only)
        setDetailOpen(true)
      }
    }
  }, [filteredOptions, searchValue])

  const selectedLabel = React.useMemo(() => {
    return options.find((o) => o.value === value)?.label || ""
  }, [options, value])

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between whitespace-nowrap overflow-hidden", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {value ? selectedLabel : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(calc(100vw-2rem),400px)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={inputPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (filteredOptions.length > 0) {
                  const first = filteredOptions[0]
                  if (!first.disabled) {
                    setPendingOption(first)
                    setDetailOpen(true)
                  }
                }
              }
            }}
            className="border-none focus:ring-0"
          />
          <CommandGroup>
            <ScrollArea className="h-[300px]" onMouseDown={(e) => e.preventDefault()}>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    // open detail card for confirmation before selecting
                    setPendingOption(option)
                    setDetailOpen(true)
                  }}
                  disabled={option.disabled}
                  className={cn("py-3", option.disabled && "cursor-not-allowed opacity-50")}
                >
                  <div
                    className="flex items-start"
                    onClick={() => {
                      if (option.disabled) return
                      setPendingOption(option)
                      setDetailOpen(true)
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4 flex-shrink-0 mt-1", value === option.value ? "opacity-100" : "opacity-0")}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium truncate">{option.label.split(" - ")[0]}</div>
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        {option.label.split(" - ").slice(1).join(" - ")}
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
    {/* detail dialog (card) for pendingOption */}
    <Dialog open={detailOpen} onOpenChange={(v) => setDetailOpen(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selecionar Item</DialogTitle>
          <DialogDescription>
            Confirme o item que deseja selecionar.
          </DialogDescription>
        </DialogHeader>
        {pendingOption && (
          <div className="mt-4">
            <div className="text-sm font-semibold">{pendingOption.label.split(" - ")[0]}</div>
            <div className="text-xs text-muted-foreground mt-1">{pendingOption.label.split(" - ").slice(1).join(" - ")}</div>
            {pendingOption.meta?.quantity != null && (
              <div className="mt-2 text-xs">
                Quantidade em estoque: <span className="font-medium">{pendingOption.meta.quantity}</span>
              </div>
            )}
          </div>
        )}
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setDetailOpen(false)}>Cancelar</Button>
          <Button
            onClick={() => {
              if (!pendingOption) return
              onValueChange?.(pendingOption.value)
              setDetailOpen(false)
              setOpen(false)
              setSearchValue("")
            }}
            className="ml-2"
          >
            Selecionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
)
}
 