"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { useCallback, useState } from "react"

export function validateUrl(value: string): string | null {
  const urlPattern = /^https?:\/\/.+\..+/
  if (!urlPattern.test(value)) {
    return "Please enter a valid URL (e.g., https://example.com)"
  }
  return null
}

export interface VenueRulesListProps {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  addButtonText?: string
  validate?: (value: string) => string | null
  hint?: string
}

function VenueRulesList({
  items,
  onChange,
  placeholder = "Enter a value...",
  addButtonText = "Add",
  validate,
  hint,
}: VenueRulesListProps) {
  const [newItem, setNewItem] = useState("")
  const [error, setError] = useState<string | null>(null)

  const addItem = useCallback(() => {
    const trimmed = newItem.trim()
    if (!trimmed) return

    if (validate) {
      const validationError = validate(trimmed)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setError(null)
    onChange([...items, trimmed])
    setNewItem("")
  }, [newItem, items, onChange, validate])

  const updateItem = useCallback(
    (index: number, value: string) => {
      const updated = [...items]
      updated[index] = value
      onChange(updated)
    },
    [items, onChange]
  )

  const removeItem = useCallback(
    (index: number) => {
      onChange(items.filter((_, i) => i !== index))
    },
    [items, onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        addItem()
      }
    },
    [addItem]
  )

  return (
    <div className="space-y-2">
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => {
            setNewItem(e.target.value)
            if (error) setError(null)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          // className="flex-1"
        />
        <Button type="button" variant="secondary" onClick={addItem}>
          {addButtonText}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {items.length > 0 && (
        <ul className="mt-2 space-y-1">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2 py-2 rounded">
              <Input
                type="text"
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                className="flex-1 text-sm bg-transparent border-0 shadow-none border-transparent focus:ring-0"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeItem(index)}
                className="text-destructive hover:text-destructive/80 text-sm whitespace-nowrap"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default VenueRulesList
