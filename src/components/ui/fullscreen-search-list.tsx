"use client"

import * as React from "react"
import { ChevronsUpDown, Search as SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { SearchableOption } from "@/hooks/useSearchableSelect"

function normalizeText(text: string) {
  return text
    ?.normalize?.("NFD")
  ?.replace(/[\u0300-\u036f]/g, "")
    ?.toLowerCase()
    ?.trim() ?? ""
}

export interface FullscreenSearchListProps<T = any> {
  options: SearchableOption<T>[]
  value?: string
  onSelect?: (option: SearchableOption<T>) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  maxResults?: number
}

export function FullscreenSearchList<T extends Record<string, any>>({
  options,
  value,
  onSelect,
  placeholder = "Selecione um item...",
  searchPlaceholder = "Digite para buscar...",
  disabled = false,
  maxResults = 1000,
}: FullscreenSearchListProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [highlighted, setHighlighted] = React.useState(-1)

  const filtered = React.useMemo(() => {
    const t = normalizeText(searchTerm)
    if (!t) return options.slice(0, maxResults)

    return options
      .filter((o) => {
        if (normalizeText(o.label).includes(t)) return true
        if (o.keywords?.some(k => normalizeText(k).includes(t))) return true
        // search in data fields shallow
        for (const k in o.data || {}) {
          try {
            const v = o.data[k]
            if (v && normalizeText(String(v)).includes(t)) return true
          } catch {}
        }
        return false
      })
      .slice(0, maxResults)
  }, [options, searchTerm, maxResults])

  const selectedLabel = React.useMemo(() => options.find(o => o.value === value)?.label ?? "", [options, value])

  React.useEffect(() => {
    if (!open) {
      setSearchTerm("")
      setHighlighted(-1)
    }
  }, [open])

  const onKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted >= 0 && filtered[highlighted]) {
        const opt = filtered[highlighted]
        if (!opt.disabled) {
          onSelect?.(opt)
          setOpen(false)
        }
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }, [filtered, highlighted, onSelect])

  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn("w-full justify-between whitespace-nowrap overflow-hidden")}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-none h-[100dvh] p-0 m-0 rounded-none border-0">
          <DialogHeader className="px-4 pt-6 pb-3 border-b">
            <DialogTitle>Buscar itens</DialogTitle>
            <DialogDescription className="sr-only">
              Busque e selecione um item da lista
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 py-3 border-b bg-background sticky top-0 z-10">
            <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
              <SearchIcon className="h-4 w-4 opacity-50 shrink-0" />
              <Input
                autoFocus
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={onKeyDown}
                className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent p-0 h-auto"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto px-4 py-2" style={{ 
            height: 'calc(100dvh - 180px)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)'
          }}>
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Nenhum item encontrado.</div>
            ) : (
              <div className="space-y-1 pb-4">
                {filtered.map((opt, idx) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={value === opt.value}
                    onClick={() => { if (!opt.disabled) { onSelect?.(opt); setOpen(false) } }}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={cn(
                      "w-full text-left p-3 rounded-md transition-colors",
                      "hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                      opt.disabled && "cursor-not-allowed opacity-50",
                      idx === highlighted && "bg-accent",
                      value === opt.value && "bg-accent/50"
                    )}
                    disabled={opt.disabled}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-medium truncate">{opt.label.split(" - ")[0]}</div>
                      {opt.label.includes(' - ') && (
                        <div className="text-xs text-muted-foreground truncate">{opt.label.split(' - ').slice(1).join(' - ')}</div>
                      )}
                      {"quantity" in opt.data && (
                        <div className="text-xs text-muted-foreground">
                          Estoque: <span className={cn(
                            "font-medium",
                            (opt.data as any).quantity > 0 ? "text-green-600" : "text-red-600"
                          )}>{(opt.data as any).quantity}</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default FullscreenSearchList
