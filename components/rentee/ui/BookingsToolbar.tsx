"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, CircleX, LayoutGrid, LayoutList, Search, X } from "lucide-react"
import { parseAsString, useQueryState } from "nuqs"
import { useState } from "react"

type ViewMode = "list" | "grid"

interface BookingsToolbarProps {
  onSearch?: (value: string) => void
  onViewChange?: (view: ViewMode) => void
  onStartedAtChange?: (date: Date | undefined) => void
  filterActive?: boolean
  isLoading?: boolean
}

/** Safely parse a stringified timestamp from the URL into a Date (or undefined). */
function parseDateParam(value: string): Date | undefined {
  if (!value) return undefined
  const ts = Number(value)
  if (Number.isNaN(ts)) return undefined
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export function BookingsToolbar({
  onSearch,
  onViewChange,
  onStartedAtChange,
  isLoading = false,
}: BookingsToolbarProps) {
  const [queryParam, setQueryParam] = useQueryState("query", parseAsString.withDefault(""))
  const [viewParam, setViewParam] = useQueryState("mode", parseAsString.withDefault("grid"))
  const [startedAtParam, setStartedAtParam] = useQueryState(
    "startedAt",
    parseAsString.withDefault("")
  )

  const [search, setSearch] = useState(queryParam)
  const [view, setView] = useState<ViewMode>(viewParam as ViewMode)
  const [startedAt, setStartedAt] = useState<Date | undefined>(parseDateParam(startedAtParam))
  const [open, setOpen] = useState(false)

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setSearch(value)
    setQueryParam(value || null) // strip from URL when empty
    onSearch?.(value)
  }

  function handleView(val: string) {
    if (!val) return
    const next = val as ViewMode
    setView(next)
    setViewParam(next)
    onViewChange?.(next)
  }

  function handleStartedAt(date: Date | undefined) {
    setStartedAt(date)
    // Persist as a millisecond timestamp string; remove from URL when cleared
    setStartedAtParam(date ? String(date.getTime()) : null)
    onStartedAtChange?.(date)
    setOpen(false)
  }

  function clearStartedAt(e: React.MouseEvent) {
    e.stopPropagation() // don't open the popover
    handleStartedAt(undefined)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-40 max-w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={handleSearch}
            placeholder="Search Your Bookings..."
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
                setQueryParam(null)
                onSearch?.("")
              }}
              disabled={isLoading}
            >
              <X />
            </Button>
          )}
        </div>

        {/* Started At filter */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="started-at-filter"
              aria-controls="started-at-filter-listbox"
              size="sm"
              variant="outline"
              disabled={isLoading}
              className={cn(
                "h-8 rounded-md px-2 font-normal dark:bg-input/30 border border-dashed items-center"
              )}
            >
              <span className="flex items-center justify-center gap-1">
                {startedAt ? (
                  <span
                    role="button"
                    aria-label="Clear started at filter"
                    onClick={clearStartedAt}
                    className="ml-1 inline-flex items-center justify-center rounded-sm hover:bg-muted p-0.5"
                  >
                    <CircleX className="size-4" />
                  </span>
                ) : (
                  <CalendarIcon className="size-4" />
                )}
                <span className="truncate">Started At</span>
                {startedAt && (
                  <Separator
                    orientation="vertical"
                    className="shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch mx-0.5 data-[orientation=vertical]:h-4"
                  />
                )}
                {startedAt && (
                  <span className="truncate ml-1">{format(startedAt, "MMM d, yyyy")}</span>
                )}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent id="started-at-filter-listbox" align="start" className="w-auto p-0">
            <Calendar
              autoFocus
              captionLayout="dropdown"
              mode="single"
              selected={startedAt}
              onSelect={handleStartedAt}
            />
          </PopoverContent>
        </Popover>

        {/* Status */}
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
