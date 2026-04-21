"use client"

import { Autocomplete } from "@react-google-maps/api"
import { format } from "date-fns"
import { MapPin, Search, X } from "lucide-react"
import * as React from "react"

import { PLANNING_OPTIONS } from "@/app/listings/data"
import { DateTimePickerPanel } from "@/components/listings/date-time-picker-panel"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type SearchPlace = {
  lat: number
  lng: number
  label: string
}

type Props = {
  mapsLoaded: boolean
  planning: string
  onPlanningChange: (v: string) => void
  place: SearchPlace | null
  onPlaceChange: (p: SearchPlace | null) => void
  date: Date | undefined
  onDateChange: (d: Date | undefined) => void
  startTime: string
  endTime: string
  onStartTimeChange: (t: string) => void
  onEndTimeChange: (t: string) => void
  onSearch: () => void
  className?: string
  size?: "sm" | "md" | "lg"
}

export function VenueSearchBar({
  mapsLoaded,
  planning,
  onPlanningChange,
  place,
  onPlaceChange,
  date,
  onDateChange,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  onSearch,
  className,
  size = "sm",
}: Props) {
  const acRef = React.useRef<google.maps.places.Autocomplete | null>(null)
  const [planOpen, setPlanOpen] = React.useState(false)
  const [whenOpen, setWhenOpen] = React.useState(false)
  const [whereFocused, setWhereFocused] = React.useState(false)

  const onPlaceChanged = React.useCallback(() => {
    const ac = acRef.current
    if (!ac) return
    const p = ac.getPlace()
    const loc = p.geometry?.location
    if (!loc) return
    const label = p.formatted_address ?? p.name ?? ""
    onPlaceChange({ lat: loc.lat(), lng: loc.lng(), label })
  }, [onPlaceChange])

  const whenSummary =
    date && startTime && endTime
      ? `${format(date, "MMM d")} · ${startTime} - ${endTime}`
      : date
        ? format(date, "MMM d")
        : "Pick date"

  return (
    <div className={cn("relative w-full", className)}>
      
        <div className={cn(
          "flex flex-col gap-0 bg-white lg:flex-row lg:items-stretch cursor-pointer hover:shadow-md transition-shadow",
          size === "md" ? "rounded-[14px] p-1.5 lg:pr-2 lg:pl-1 lg:py-1.5 border border-primary/10 shadow-sm" : "rounded-lg border border-primary/25"
        )}>
          <Popover open={planOpen} onOpenChange={setPlanOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "relative flex min-w-0 flex-1 flex-col justify-center text-left transition-colors",
                  size === "lg" ? "min-h-12 px-4 py-2 lg:min-h-14 lg:px-5 lg:py-3 rounded-none lg:rounded-l-lg" : 
                  size === "md" ? "min-h-11 px-4 py-2 lg:min-h-12 lg:px-5 lg:py-2.5 rounded-none lg:rounded-l-[10px]" :
                  "min-h-9 px-3 py-1.5 lg:min-h-9 lg:px-3 lg:py-1.5 rounded-none lg:rounded-l-lg",
                  planOpen ? "bg-white ring-2 ring-primary ring-inset rounded-lg z-10" : "bg-white hover:bg-neutral-50 z-0"
                )}
              >
                <span className={cn("font-medium text-neutral-600",
                  size === "lg" ? "text-sm leading-5" : 
                  size === "md" ? "text-[13px] leading-4 lg:mb-0.5" : 
                  "text-[12px] lg:text-[11px] leading-4"
                )}>What are you planning?</span>
                <div className={cn("relative mt-0.5 block w-full", size === "lg" ? "min-h-6" : size === "md" ? "min-h-5" : "min-h-5")}>
                  <span className={cn("block truncate font-semibold text-neutral-900 pr-6", 
                    size === "lg" ? "text-base leading-6" : 
                    size === "md" ? "text-[15px] leading-5" : 
                    "text-[14px] lg:text-[13px] leading-5"
                  )}>{planning || "Anything"}</span>
                  {planning && (
                    <button
                      type="button"
                      className="absolute right-0 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:text-neutral-900"
                      aria-label="Clear planning"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onPlanningChange("")
                      }}
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[min(100vw-2rem,380px)] rounded-xl border border-primary/25 p-0 shadow-lg" align="start">
              <Command className="rounded-xl">
                <CommandInput placeholder="Search activities..." />
                <CommandList>
                  <CommandEmpty>No match.</CommandEmpty>
                  <CommandGroup heading="Popular">
                    {PLANNING_OPTIONS.slice(0, 8).map((opt) => (
                      <CommandItem
                        key={opt}
                        value={opt}
                        onSelect={() => {
                          onPlanningChange(opt)
                          setPlanOpen(false)
                        }}
                      >
                        {opt}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandGroup heading="All">
                    {PLANNING_OPTIONS.slice(8).map((opt) => (
                      <CommandItem
                        key={opt}
                        value={opt}
                        onSelect={() => {
                          onPlanningChange(opt)
                          setPlanOpen(false)
                        }}
                      >
                        {opt}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div className={cn("hidden w-px shrink-0 bg-neutral-200/90 lg:block", size === "md" ? "h-10 self-center" : "self-stretch")} />

          <div
            className={cn(
              "relative min-w-0 flex-1 transition-colors",
              size === "lg" ? "min-h-12 px-4 py-2 lg:min-h-14 lg:px-5 lg:py-3" : 
              size === "md" ? "min-h-11 px-4 py-2 lg:min-h-12 lg:px-5 lg:py-2.5" : 
              "min-h-9 px-3 py-1.5 lg:min-h-9 lg:px-3 lg:py-1.5",
              whereFocused ? "bg-white ring-2 ring-primary ring-inset rounded-lg z-10" : "bg-white hover:bg-neutral-50 z-0"
            )}
          >
            <span className={cn("font-medium text-neutral-600",
              size === "lg" ? "text-sm leading-5" : 
              size === "md" ? "text-[13px] leading-4 lg:mb-0.5" : 
              "text-[12px] lg:text-[11px] leading-4"
            )}>Where?</span>
            {mapsLoaded ? (
              <div className={cn("relative mt-0.5 block", size === "lg" ? "min-h-6" : size === "md" ? "min-h-5" : "min-h-5")}>
                <MapPin className={cn("pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 text-neutral-400", size === "lg" ? "size-4" : size === "md" ? "size-4" : "size-3.5")} />
                <Autocomplete
                  onLoad={(ac) => {
                    acRef.current = ac
                  }}
                  onPlaceChanged={onPlaceChanged}
                  options={{
                    fields: ["formatted_address", "geometry", "name", "address_components"],
                  }}
                >
                  <input
                    key={place?.label ?? "no-place"}
                    className={cn(
                      "block w-full border-0 bg-transparent outline-none placeholder:text-neutral-400 font-semibold text-neutral-900 pr-8",
                      size === "lg" ? "py-1 pl-8 text-base leading-6" : 
                      size === "md" ? "py-0 pl-8 text-[15px] leading-5" : 
                      "py-0.5 pl-9 text-[14px] lg:text-[13px] leading-5"
                    )}
                    placeholder="Los Angeles, CA, USA"
                    defaultValue={place?.label ?? ""}
                    onFocus={() => setWhereFocused(true)}
                    onBlur={() => setWhereFocused(false)}
                  />
                </Autocomplete>
                {place ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded p-1 text-neutral-400 hover:text-neutral-900"
                    aria-label="Clear location"
                    onClick={() => onPlaceChange(null)}
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="mt-1 pl-0.5 text-sm text-neutral-400">Loading places...</p>
            )}
          </div>

          <div className={cn("hidden w-px shrink-0 bg-neutral-200/90 lg:block", size === "md" ? "h-10 self-center" : "self-stretch")} />

          <Popover open={whenOpen} onOpenChange={setWhenOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "relative flex min-w-0 flex-1 flex-col justify-center text-left transition-colors",
                  size === "lg" ? "min-h-12 px-4 py-2 lg:min-h-14 lg:px-5 lg:py-3 rounded-none lg:rounded-r-none" : 
                  size === "md" ? "min-h-11 px-4 py-2 lg:min-h-12 lg:px-5 lg:py-2.5 rounded-none lg:mr-2" : 
                  "min-h-9 px-3 py-1.5 lg:min-h-9 lg:px-3 lg:py-1.5 rounded-none lg:rounded-r-none",
                  whenOpen ? "bg-white ring-2 ring-primary ring-inset rounded-lg z-10" : "bg-white hover:bg-neutral-50 z-0"
                )}
              >
                <span className={cn("font-medium text-neutral-600",
                  size === "lg" ? "text-sm leading-5" : 
                  size === "md" ? "text-[13px] leading-4 lg:mb-0.5" : 
                  "text-[12px] lg:text-[11px] leading-4"
                )}>When?</span>
                <div className={cn("relative mt-0.5 block w-full", size === "lg" ? "min-h-6" : size === "md" ? "min-h-5" : "min-h-5")}>
                  <span className={cn("block truncate font-semibold text-neutral-900 pr-6",
                    size === "lg" ? "text-base leading-6" : 
                    size === "md" ? "text-[15px] leading-5" : 
                    "text-[14px] lg:text-[13px] leading-5"
                  )}>{whenSummary}</span>
                  {date && (
                    <button
                      type="button"
                      className="absolute right-0 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:text-neutral-900"
                      aria-label="Clear date"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onDateChange(undefined)
                      }}
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] rounded-xl border border-primary/25 bg-white p-0 shadow-lg" align="end">
              <DateTimePickerPanel
                date={date}
                startTime={startTime}
                endTime={endTime}
                onDateChange={onDateChange}
                onStartTimeChange={onStartTimeChange}
                onEndTimeChange={onEndTimeChange}
              />
            </PopoverContent>
          </Popover>

          <div className={cn(
            "flex items-stretch bg-white lg:bg-transparent",
            size === "lg" ? "border-t border-primary/15 p-2 lg:border-l lg:border-t-0 lg:p-0" : 
            size === "md" ? "p-1.5 lg:p-1.5 lg:pl-0 lg:pr-1 lg:rounded-r-[12px]" : 
            "border-t border-primary/15 p-1 lg:border-l lg:border-t-0 lg:p-0"
          )}>
            <Button
              type="button"
              className={cn(
                "h-auto w-full shrink-0 gap-1.5 font-semibold lg:w-auto lg:self-stretch",
                size === "lg" ? "min-h-12 px-6 text-base lg:min-h-14 lg:px-8 rounded-lg lg:rounded-l-none bg-primary text-primary-foreground hover:bg-primary/90" : 
                size === "md" ? "min-h-11 px-7 text-[15px] lg:px-8 rounded-[10px] bg-primary hover:bg-primary/90 text-white border-0 shadow-sm transition-all" : 
                "min-h-9 px-3 text-xs lg:min-h-9 lg:px-5 rounded-lg lg:rounded-l-none bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={onSearch}
            >
              <Search className={cn(size === "lg" ? "size-5" : size === "md" ? "size-4.5" : "size-4")} />
              Search
            </Button>
          </div>
        </div>
      
    </div>
  )
}
