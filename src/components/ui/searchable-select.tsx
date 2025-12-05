"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { cn } from "@/lib/utils"
import { SearchableOption, useSearchableSelect } from "@/hooks/useSearchableSelect"

export interface SearchableSelectProps<T = any> {
  // Core props
  options: SearchableOption<T>[]
  onSelect?: (option: SearchableOption<T>) => void
  value?: string
  
  // Search behavior
  searchFields?: (keyof T)[]
  minSearchLength?: number
  maxResults?: number
  sortResults?: boolean
  
  // UI customization
  placeholder?: string
  searchPlaceholder?: string
  noResultsMessage?: string
  className?: string
  disabled?: boolean
  confirmSelection?: boolean
  
  // Render props for custom option display
  renderOption?: (option: SearchableOption<T>) => React.ReactNode
  renderSelected?: (option: SearchableOption<T>) => React.ReactNode
  renderConfirmation?: (option: SearchableOption<T>) => React.ReactNode
}

export function SearchableSelect<T extends Record<string, any>>({
  options,
  onSelect,
  value,
  searchFields = [],
  minSearchLength = 1,
  maxResults = 100,
  sortResults = true,
  placeholder = "Selecione um item...",
  searchPlaceholder = "Digite para buscar...",
  noResultsMessage = "Nenhum item encontrado.",
  className,
  disabled = false,
  confirmSelection = false,
  renderOption,
  renderSelected,
  renderConfirmation,
}: SearchableSelectProps<T>) {
  // Use our custom hook for search/select logic
  const {
    searchTerm,
    selectedOption,
    filteredOptions,
    highlightedIndex,
    isOpen,
    setSearchTerm,
    selectOption,
    setHighlightedIndex,
    setIsOpen,
    handleKeyDown,
  } = useSearchableSelect({
    options,
    onSelect,
    searchFields,
    minSearchLength,
    maxResults,
    sortResults,
  })

  // Find current selected option from value
  const currentOption = React.useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  )

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pendingOption, setPendingOption] = React.useState<SearchableOption<T> | null>(null)
  // UI state: detect small screens to render full-screen dialog on mobile
  const [isMobile, setIsMobile] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
  const mq = window.matchMedia('(max-width: 640px)')
    const set = () => setIsMobile(mq.matches)
    set()
    mq.addEventListener?.('change', set)
    return () => mq.removeEventListener?.('change', set)
  }, [])

  const showLimit = 6 // number of items to show in popover before showing "Ver mais"
  const [showAllOpen, setShowAllOpen] = React.useState(false)

  // Handle option selection (with or without confirmation)
  const handleSelect = React.useCallback(
    (option: SearchableOption<T>) => {
      // selection handler
      if (confirmSelection) {
        setPendingOption(option)
        setConfirmOpen(true)
      } else {
        selectOption(option)
      }
    },
    [confirmSelection, selectOption]
  )

  // Default option renderer
  const defaultRenderOption = React.useCallback((option: SearchableOption<T>) => (
    <div className="flex items-start">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium truncate">{option.label.split(" - ")[0]}</div>
        </div>
        {option.label.includes(" - ") && (
          <div className="text-xs text-muted-foreground truncate mt-1">
            {option.label.split(" - ").slice(1).join(" - ")}
          </div>
        )}
      </div>
    </div>
  ), [])

  // Default selected renderer
  const defaultRenderSelected = React.useCallback((option: SearchableOption<T>) => (
    <span className="truncate">{option.label}</span>
  ), [])

  // Default confirmation renderer
  const defaultRenderConfirmation = React.useCallback((option: SearchableOption<T>) => (
    <div className="mt-4">
      <div className="text-sm font-semibold">{option.label.split(" - ")[0]}</div>
      {option.label.includes(" - ") && (
        <div className="text-xs text-muted-foreground mt-1">
          {option.label.split(" - ").slice(1).join(" - ")}
        </div>
      )}
      {"quantity" in option.data && (
        <div className="mt-2 text-xs">
          Quantidade em estoque: <span className="font-medium">{option.data.quantity}</span>
        </div>
      )}
    </div>
  ), [])

  return (
    <>
  <Popover open={isOpen && !isMobile} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className={cn(
              "w-full justify-between whitespace-nowrap overflow-hidden",
              className
            )}
            disabled={disabled}
          >
            {currentOption
              ? (renderSelected ?? defaultRenderSelected)(currentOption)
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(calc(100vw-2rem),400px)] p-0"
          align="start"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="p-2">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-none focus:ring-0"
            />
          </div>

          <div className="px-2 pb-2">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{noResultsMessage}</div>
            ) : (
              <div>
                <div className="max-h-[336px] overflow-y-auto">
                  {filteredOptions.slice(0, showLimit).map((option, index) => (
                    <div
                      key={option.value}
                      role="option"
                      aria-selected={index === highlightedIndex}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault()
                        if (!option.disabled) handleSelect(option)
                      }}
                      className={cn(
                        "px-3 py-3 cursor-pointer",
                        option.disabled && "cursor-not-allowed opacity-50",
                        index === highlightedIndex && "bg-accent"
                      )}
                    >
                      {(renderOption ?? defaultRenderOption)(option)}
                    </div>
                  ))}
                </div>

                {filteredOptions.length > showLimit && (
                  <div className="mt-2 text-center">
                    <Button variant="ghost" size="sm" onClick={() => setShowAllOpen(true)}>Mostrar mais resultados...</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Full-screen dialog for mobile or full list */}
          {(isMobile || showAllOpen) && (
            <Dialog open={isOpen || showAllOpen} onOpenChange={(v) => { setIsOpen(v); setShowAllOpen(false) }}>
              <DialogContent className="w-full h-screen max-w-none p-0">
                <DialogHeader>
                  <DialogTitle>Buscar itens</DialogTitle>
                </DialogHeader>
                <div className="p-4 border-b">
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="border-none focus:ring-0"
                  />
                </div>
                <div className="p-4 h-[calc(100vh-96px)] overflow-auto">
                  {filteredOptions.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">{noResultsMessage}</div>
                  ) : (
                    <div className="space-y-1">
                      {filteredOptions.map((option, index) => (
                        <div
                          key={option.value}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (!option.disabled) handleSelect(option)
                          }}
                          className={cn(
                            "py-3 cursor-pointer w-full",
                            option.disabled && "cursor-not-allowed opacity-50",
                            index === highlightedIndex && "bg-accent"
                          )}
                        >
                          {(renderOption ?? defaultRenderOption)(option)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

      {confirmSelection && (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Seleção</DialogTitle>
              <DialogDescription>
                Confirme o item que deseja selecionar.
              </DialogDescription>
            </DialogHeader>
            {pendingOption && (renderConfirmation ?? defaultRenderConfirmation)(pendingOption)}
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (pendingOption) {
                    selectOption(pendingOption)
                    setConfirmOpen(false)
                  }
                }}
                className="ml-2"
              >
                Selecionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}