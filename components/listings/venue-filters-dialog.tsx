"use client"

import * as React from "react"
import { Check, ChevronDown, Search, Users, X } from "lucide-react"

import {
  AMENITY_CATEGORIES,
  FILTER_MIN_HOURS_MAX,
  FILTER_PRICE_MAX,
  type FilterState,
} from "@/app/listings/data"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

const INDOOR_OUTDOOR_OPTIONS: { value: FilterState["indoorOutdoor"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
  { value: "both", label: "Both" },
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: FilterState
  onFiltersChange: React.Dispatch<React.SetStateAction<FilterState>>
  amenitiesOpen: boolean
  onAmenitiesOpenChange: (open: boolean) => void
  onApply: () => void
  onReset: () => void
}

export function VenueFiltersDialog({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  amenitiesOpen,
  onAmenitiesOpenChange,
  onApply,
  onReset,
}: Props) {
  const [amenityQuery, setAmenityQuery] = React.useState("")
  const [ioOpen, setIoOpen] = React.useState(false)

  const filteredCategories = React.useMemo(() => {
    const q = amenityQuery.trim().toLowerCase()
    if (!q) return AMENITY_CATEGORIES
    return AMENITY_CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter((i) => i.toLowerCase().includes(q)),
    })).filter((c) => c.items.length > 0)
  }, [amenityQuery])

  const indoorOutdoorLabel =
    INDOOR_OUTDOOR_OPTIONS.find((o) => o.value === filters.indoorOutdoor)?.label ?? "All"

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "!flex h-[min(90vh,720px)] max-h-[min(90vh,720px)] w-full max-w-lg flex-col gap-0 overflow-hidden rounded-xl border-primary/25 bg-white p-0 sm:max-w-lg"
          )}
        >
          <DialogHeader className="shrink-0 border-b border-primary/15 px-6 py-4">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-lg font-semibold">Filter Venues</DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6">
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-neutral-500">Search <span className="text-neutral-400 text-xs font-normal">(by venue name)</span></Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    className="h-10 rounded-lg border-primary/25 bg-white pl-10 focus-visible:border-primary focus-visible:ring-primary/20"
                    placeholder="Search venues…"
                    value={filters.searchQuery}
                    onChange={(e) =>
                      onFiltersChange((p) => ({ ...p, searchQuery: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-neutral-800">Indoor / Outdoor</Label>
                <Popover open={ioOpen} onOpenChange={setIoOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-full items-center justify-between rounded-lg border border-primary/25 bg-white px-3 text-left text-sm text-neutral-900 shadow-xs transition-[color,box-shadow] outline-none hover:border-primary/45 hover:bg-primary/10 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/30"
                    >
                      <span>{indoorOutdoorLabel}</span>
                      <ChevronDown className="size-4 shrink-0 text-neutral-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] rounded-lg border border-primary/25 p-1 shadow-md"
                    align="start"
                  >
                    <ul className="py-0.5">
                      {INDOOR_OUTDOOR_OPTIONS.map((opt) => {
                        const selected = filters.indoorOutdoor === opt.value
                        return (
                          <li key={opt.value}>
                            <button
                              type="button"
                              className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-neutral-900",
                                selected ? "bg-neutral-100" : "hover:bg-neutral-50"
                              )}
                              onClick={() => {
                                onFiltersChange((p) => ({ ...p, indoorOutdoor: opt.value }))
                                setIoOpen(false)
                              }}
                            >
                              <span className="flex size-4 shrink-0 items-center justify-center">
                                {selected ? (
                                  <span className="flex size-4 items-center justify-center rounded-full border border-neutral-400 bg-white">
                                    <Check className="size-2.5 text-neutral-800" strokeWidth={3} />
                                  </span>
                                ) : (
                                  <span className="size-4" aria-hidden />
                                )}
                              </span>
                              <span className={cn(!selected && "pl-0")}>{opt.label}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </PopoverContent>
                </Popover>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-neutral-800">
                <Checkbox
                  checked={filters.instantOnly}
                  onCheckedChange={(c) =>
                    onFiltersChange((p) => ({ ...p, instantOnly: Boolean(c) }))
                  }
                  className="border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                />
                Instant Booking Only
              </label>

              <div className="space-y-2">
                <Label className="text-neutral-500">Number of Guests</Label>
                <div className="relative">
                  <Users className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    className="h-10 rounded-lg border-primary/25 pl-10 focus-visible:border-primary focus-visible:ring-primary/20"
                    inputMode="numeric"
                    placeholder="Enter number of guests"
                    value={filters.minGuests}
                    onChange={(e) =>
                      onFiltersChange((p) => ({ ...p, minGuests: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-neutral-600">Max Price per Hour</Label>
                  <span className="text-sm font-medium text-primary">
                    {filters.maxPrice >= FILTER_PRICE_MAX ? "Any" : `$${filters.maxPrice}`}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={FILTER_PRICE_MAX}
                  step={50}
                  value={[filters.maxPrice]}
                  onValueChange={([v]) => onFiltersChange((p) => ({ ...p, maxPrice: v }))}
                  className="[&_[data-slot=slider-range]]:bg-primary"
                />
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>$0</span>
                  <span>$2000</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-neutral-600">Minimum Hours</Label>
                  <span className="text-sm font-medium text-primary">
                    {filters.maxMinHours >= FILTER_MIN_HOURS_MAX
                      ? "Any"
                      : `${filters.maxMinHours} hrs`}
                  </span>
                </div>
                <Slider
                  min={1}
                  max={FILTER_MIN_HOURS_MAX}
                  step={1}
                  value={[filters.maxMinHours]}
                  onValueChange={([v]) => onFiltersChange((p) => ({ ...p, maxMinHours: v }))}
                  className="[&_[data-slot=slider-range]]:bg-primary"
                />
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>1 hr</span>
                  <span>24 hrs</span>
                </div>
              </div>

              <Separator />

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-lg border-primary/25 text-primary hover:bg-primary/10"
                onClick={() => onAmenitiesOpenChange(true)}
              >
                Amenities
                {filters.selectedAmenities.length > 0 ? (
                  <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                    {filters.selectedAmenities.length}
                  </span>
                ) : null}
              </Button>
            </div>
          </div>

          <DialogFooter className="shrink-0 grid grid-cols-2 gap-3 border-t border-primary/15 bg-white px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-lg border-primary/25 px-4 text-sm font-semibold"
              onClick={onReset}
            >
              Reset
            </Button>
            <Button
              type="button"
              className="h-10 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              onClick={onApply}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={amenitiesOpen} onOpenChange={onAmenitiesOpenChange}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "!flex h-[min(85vh,560px)] max-h-[min(85vh,560px)] flex-col gap-0 overflow-hidden rounded-xl border-primary/25 bg-white p-0 sm:max-w-md"
          )}
        >
          <DialogHeader className="shrink-0 border-b border-primary/15 px-6 py-4">
            <DialogTitle className="text-lg font-semibold">Amenities</DialogTitle>
            <Input
              className="mt-3 rounded-lg border-primary/25 focus-visible:border-primary focus-visible:ring-primary/20"
              placeholder="Search amenities…"
              value={amenityQuery}
              onChange={(e) => setAmenityQuery(e.target.value)}
            />
            <p className="text-xs text-neutral-500">
              {filters.selectedAmenities.length
                ? `${filters.selectedAmenities.length} selected`
                : "No amenities selected"}
            </p>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6">
            <div className="space-y-2 py-4">
              {filteredCategories.map((cat) => (
                <div key={cat.title} className="rounded-lg border border-primary/25">
                  <p className="border-b border-neutral-100 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-600">
                    {cat.title}
                  </p>
                  <ul className="divide-y divide-neutral-100">
                    {cat.items.map((item) => {
                      const id = `${cat.title}-${item}`
                      const checked = filters.selectedAmenities.includes(item)
                      return (
                        <li key={id} className="px-3 py-2">
                          <label className="flex cursor-pointer items-center gap-2 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => {
                                onFiltersChange((prev) => ({
                                  ...prev,
                                  selectedAmenities: checked
                                    ? prev.selectedAmenities.filter((x) => x !== item)
                                    : [...prev.selectedAmenities, item],
                                }))
                              }}
                              className="border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                            />
                            <span className="capitalize">{item.replace(/_/g, " ")}</span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t border-primary/15 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-lg border-primary/25"
              onClick={() => onFiltersChange((p) => ({ ...p, selectedAmenities: [] }))}
            >
              Clear All
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onAmenitiesOpenChange(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
