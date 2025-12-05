import * as React from "react"

// Normalize text for comparison (remove accents, lowercase)
function normalizeText(text: string): string {
  return text
    ?.normalize("NFD")
    ?.replace(/[\u0300-\u036f]/g, "") // remove accents
    ?.toLowerCase()
    ?.trim() ?? ""
}

export interface SearchableOption<T = any> {
  value: string
  label: string
  disabled?: boolean
  data: T
  keywords?: string[]
}

interface UseSearchableSelectProps<T> {
  options: SearchableOption<T>[]
  onSelect?: (option: SearchableOption<T>) => void
  searchFields?: (keyof T)[]
  minSearchLength?: number
  maxResults?: number
  sortResults?: boolean
}

interface UseSearchableSelectState<T> {
  searchTerm: string
  selectedOption: SearchableOption<T> | null
  filteredOptions: SearchableOption<T>[]
  highlightedIndex: number
  isOpen: boolean
}

export function useSearchableSelect<T>({
  options,
  onSelect,
  searchFields = [],
  minSearchLength = 1,
  maxResults = 100,
  sortResults = true,
}: UseSearchableSelectProps<T>) {
  const [state, setState] = React.useState<UseSearchableSelectState<T>>({
    searchTerm: "",
    selectedOption: null,
    filteredOptions: [],
    highlightedIndex: -1,
    isOpen: false,
  })

  // Memoize search function to avoid recreating on every render
  const searchOptions = React.useCallback(
    (term: string) => {
      if (!term || term.length < minSearchLength) {
        return sortResults ? [...options].sort((a, b) => a.label.localeCompare(b.label)) : options
      }

      const normalized = normalizeText(term)
      
      return options
        .filter((option) => {
          // Always search in label
          if (normalizeText(option.label).includes(normalized)) return true
          
          // Search in custom keywords if provided
          if (option.keywords?.some(k => normalizeText(k).includes(normalized))) return true
          
          // Search in specified data fields
          if (searchFields.length > 0) {
            return searchFields.some((field) => {
              const value = option.data[field]
              return value ? normalizeText(String(value)).includes(normalized) : false
            })
          }
          
          return false
        })
        .sort((a, b) => {
          if (!sortResults) return 0
          
          // Prioritize exact matches and starts-with matches
          const aLabel = normalizeText(a.label)
          const bLabel = normalizeText(b.label)
          
          if (aLabel === normalized && bLabel !== normalized) return -1
          if (bLabel === normalized && aLabel !== normalized) return 1
          
          if (aLabel.startsWith(normalized) && !bLabel.startsWith(normalized)) return -1
          if (bLabel.startsWith(normalized) && !aLabel.startsWith(normalized)) return 1
          
          return a.label.localeCompare(b.label)
        })
        .slice(0, maxResults)
    },
    [options, searchFields, minSearchLength, maxResults, sortResults]
  )

  // Update filtered options when search term changes
  React.useEffect(() => {
    setState((prev) => ({
      ...prev,
      filteredOptions: searchOptions(prev.searchTerm),
    }))
  }, [state.searchTerm, searchOptions])

  const setSearchTerm = React.useCallback((term: string) => {
    setState((prev) => ({
      ...prev,
      searchTerm: term,
      highlightedIndex: -1,
    }))
  }, [])

  const selectOption = React.useCallback(
    (option: SearchableOption<T> | null) => {
      setState((prev) => ({
        ...prev,
        selectedOption: option,
        searchTerm: "",
        isOpen: false,
      }))
      if (option) {
        onSelect?.(option)
      }
    },
    [onSelect]
  )

  const setHighlightedIndex = React.useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      highlightedIndex: index,
    }))
  }, [])

  const setIsOpen = React.useCallback((isOpen: boolean) => {
    setState((prev) => ({
      ...prev,
      isOpen,
      // Reset highlight when opening
      highlightedIndex: isOpen ? -1 : prev.highlightedIndex,
    }))
  }, [])

  // Keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const { filteredOptions, highlightedIndex, isOpen } = state

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          } else {
            setHighlightedIndex(
              highlightedIndex < filteredOptions.length - 1 ? highlightedIndex + 1 : 0
            )
          }
          break

        case "ArrowUp":
          e.preventDefault()
          if (!isOpen) {
            setIsOpen(true)
          } else {
            setHighlightedIndex(
              highlightedIndex > 0 ? highlightedIndex - 1 : filteredOptions.length - 1
            )
          }
          break

        case "Enter":
          e.preventDefault()
          if (isOpen && highlightedIndex >= 0) {
            selectOption(filteredOptions[highlightedIndex])
          }
          break

        case "Escape":
          e.preventDefault()
          setIsOpen(false)
          break

        case "Tab":
          if (isOpen) {
            e.preventDefault()
            if (highlightedIndex >= 0) {
              selectOption(filteredOptions[highlightedIndex])
            }
          }
          break
      }
    },
    [state, setIsOpen, setHighlightedIndex, selectOption]
  )

  return {
    ...state,
    setSearchTerm,
    selectOption,
    setHighlightedIndex,
    setIsOpen,
    handleKeyDown,
  }
}