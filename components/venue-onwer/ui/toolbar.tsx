"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { LayoutGrid, LayoutList, Search, X } from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"
import { useState } from "react"

type ViewMode = "list" | "grid"

interface ToolbarProps {
  onSearch?: (value: string) => void

  onViewChange?: (view: ViewMode) => void
  filterActive?: boolean
  isLoading?: boolean
}

export function Toolbar({ onSearch, onViewChange, isLoading = false }: ToolbarProps) {
  const [query] = useQueryState("query", parseAsString.withDefault(""))
  const [search, setSearch] = useState(query ?? "")
  const [defaultView] = useQueryState("mode", parseAsString.withDefault("grid"))

  const [view, setView] = useState<ViewMode>(defaultView as ViewMode)

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value)
    onSearch?.(e.target.value)
  }

  function handleView(val: string) {
    if (!val) return
    const next = val as ViewMode
    setView(next)
    onViewChange?.(next)
  }

  return (
    <div className="flex items-center gap-3 border-b border-border pb-4">
      {/* Search */}
      <div className="relative flex-1 max-w-56">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={handleSearch}
          placeholder="Search Your Venues..."
          className="pl-8 h-8 text-sm bg-muted/50 border-border shadow-none focus-visible:ring-1 rounded-full"
          disabled={isLoading}
        />
        {search && (
          <Button
            className="z-10 cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground rounded-full"
            variant="ghost"
            size="icon-xs"
            type="button"
            onClick={() => {
              setSearch("")
              onSearch?.("")
            }}
            disabled={isLoading}
          >
            <X />
          </Button>
        )}
      </div>

      {/* View Mode */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-muted-foreground">View Mode {view}</span>
        <ToggleGroup
          type="single"
          value={view}
          defaultValue={view}
          onValueChange={handleView}
          className="border border-border rounded-lg overflow-hidden gap-0 h-8"
          disabled={isLoading}
        >
          <ToggleGroupItem
            value="list"
            className="h-8 w-8 rounded-none border-r border-border data-[state=on]:bg-muted"
          >
            <LayoutList className="size-3.5" />
            <span className="sr-only">List view</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" className="h-8 w-8 rounded-none data-[state=on]:bg-muted">
            <LayoutGrid className="size-3.5" />
            <span className="sr-only">Grid view</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}
