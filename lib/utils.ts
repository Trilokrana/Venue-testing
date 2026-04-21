import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** `<input type="number">` gives strings; Zod expects real numbers. */
export function parseOptionalInt(raw: string): number | undefined {
  if (raw === "") return undefined
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? undefined : n
}

export function parseOptionalFloat(raw: string): number | undefined {
  if (raw === "") return undefined
  const n = parseFloat(raw)
  return Number.isNaN(n) ? undefined : n
}
