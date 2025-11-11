import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeText(text: string): string {
  return text
    ?.normalize("NFD")
    ?.replace(/[\u0300-\u036f]/g, "") // remove accents
    ?.toLowerCase()
    ?.trim() ?? ""
}
