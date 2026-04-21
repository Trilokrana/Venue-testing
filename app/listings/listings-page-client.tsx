"use client"

import { useJsApiLoader } from "@react-google-maps/api"
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  SlidersHorizontal,
  X,
} from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import {
  ALL_PLANNING,
  EVENT_TYPE_CHECKBOX_OPTIONS,
  getTimeSlotOptions,
  type VenueWithRelations,
  VENUE_TYPE_OPTIONS,
} from "@/app/listings/data"
import { VenueFiltersDialog } from "@/components/listings/venue-filters-dialog"
import { VenueListingCard } from "@/components/listings/venue-listing-card"
import { VenueListingCardSkeleton } from "@/components/listings/venue-listing-card-skeleton"
import { VenueSearchBar } from "@/components/listings/venue-search-bar"
import { VenuesMap } from "@/components/listings/venues-map"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useVenue } from "@/hooks/useVenue"
import { cn } from "@/lib/utils"

const TIME_OPTIONS = getTimeSlotOptions()
const GOOGLE_MAPS_LIBRARIES = ["places"] as const

type Props = {
  venues: VenueWithRelations[]
}

export function ListingsPageClient({ venues }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()

  const state = useVenue(venues)

  const { isLoaded: mapsLoaded, loadError } = useJsApiLoader({
    id: "venue-booking-google",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: GOOGLE_MAPS_LIBRARIES as any,
  })

  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [hydratedFromUrl, setHydratedFromUrl] = React.useState(false)
  const [filterOpen, setFilterOpen] = React.useState(false)
  const [amenitiesOpen, setAmenitiesOpen] = React.useState(false)
  const [eventTypeOpen, setEventTypeOpen] = React.useState(false)

  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({})
  const hydratedRef = React.useRef(false)

  React.useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    const params = new URLSearchParams(searchParamsString)
    const qpPlanning = params.get("planning")?.trim() || ALL_PLANNING
    const qpPlaceLabel = params.get("place")?.trim() || ""
    const qpLat = Number(params.get("lat"))
    const qpLng = Number(params.get("lng"))
    const qpDate = params.get("date")
    const qpStart = params.get("start")
    const qpEnd = params.get("end")
    const qpShowMap = params.get("map")

    const parsedPlace =
      qpPlaceLabel && Number.isFinite(qpLat) && Number.isFinite(qpLng)
        ? { label: qpPlaceLabel, lat: qpLat, lng: qpLng }
        : null

    const parsedDate = qpDate ? new Date(qpDate) : undefined
    const nextDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : undefined

    const nextStart = qpStart && TIME_OPTIONS.includes(qpStart) ? qpStart : TIME_OPTIONS[4] ?? ""
    const nextEnd = qpEnd && TIME_OPTIONS.includes(qpEnd) ? qpEnd : TIME_OPTIONS[14] ?? ""

    state.hydrateFromUrl({
      planning: qpPlanning,
      place: parsedPlace,
      date: nextDate,
      startTime: nextStart,
      endTime: nextEnd,
      showMap: qpShowMap !== "0",
    })

    setHydratedFromUrl(true)
  }, [searchParamsString, state.hydrateFromUrl])

  const persistSearch = React.useCallback(
    (next: {
      planning: string
      place: { lat: number; lng: number; label: string } | null
      date: Date | undefined
      start: string
      end: string
      showMap: boolean
    }) => {
      const params = new URLSearchParams(searchParamsString)
      params.set("planning", next.planning)
      params.set("map", next.showMap ? "1" : "0")

      if (next.place) {
        params.set("place", next.place.label)
        params.set("lat", String(next.place.lat))
        params.set("lng", String(next.place.lng))
      } else {
        params.delete("place")
        params.delete("lat")
        params.delete("lng")
      }

      if (next.date) params.set("date", next.date.toISOString().slice(0, 10))
      else params.delete("date")

      if (next.start) params.set("start", next.start)
      else params.delete("start")

      if (next.end) params.set("end", next.end)
      else params.delete("end")

      const nextQuery = params.toString()
      const currentQuery = searchParamsString
      if (nextQuery === currentQuery) return

      router.replace(`${pathname}?${nextQuery}`, { scroll: false })
    },
    [pathname, router, searchParamsString]
  )

  React.useEffect(() => {
    if (!hydratedFromUrl) return

    const timer = setTimeout(() => {
      persistSearch({
        planning: state.appliedPlanning,
        place: state.appliedPlace,
        date: state.appliedDate,
        start: state.appliedStartTime,
        end: state.appliedEndTime,
        showMap: state.showMap,
      })
    }, 200)

    return () => clearTimeout(timer)
  }, [
    state.appliedPlanning,
    state.appliedPlace,
    state.appliedDate,
    state.appliedStartTime,
    state.appliedEndTime,
    state.showMap,
    persistSearch,
    hydratedFromUrl,
  ])

  React.useEffect(() => {
    setSelectedId(null)
  }, [state.page, state.total])

  const summaryPlace = state.appliedPlace?.label ?? "your area"
  const summaryEventLabel =
    state.appliedPlanning.trim().toLowerCase() === ALL_PLANNING.toLowerCase()
      ? "venues"
      : `${state.appliedPlanning.toLowerCase()} locations`

  const selectedEventCount = state.filters.eventTypes.length

  const onMarkerClick = React.useCallback((id: string) => {
    setSelectedId(id)
    requestAnimationFrame(() => {
      cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    })
  }, [])

  return (
    <div className="min-h-screen bg-background text-base">
      <nav className="sticky top-0 z-40 border-b border-primary/15 bg-gray-50 shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl justify-center px-4 py-3 md:px-6 lg:px-8">
          <VenueSearchBar
            mapsLoaded={mapsLoaded && !loadError}
            planning={state.planning}
            onPlanningChange={state.setPlanning}
            place={state.place}
            onPlaceChange={state.setPlace}
            date={state.date}
            onDateChange={state.setDate}
            startTime={state.startTime}
            endTime={state.endTime}
            onStartTimeChange={state.setStartTime}
            onEndTimeChange={state.setEndTime}
            onSearch={() => {
              state.applySearch()
              setSelectedId(null)
            }}
            className="w-full max-w-5xl"
            size="md"
          />
        </div>
      </nav>

      <VenueFiltersDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={state.filters}
        onFiltersChange={state.setFilters}
        amenitiesOpen={amenitiesOpen}
        onAmenitiesOpenChange={setAmenitiesOpen}
        onApply={() => setFilterOpen(false)}
        onReset={state.resetFilters}
      />

      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-start gap-x-4 gap-y-0">
          <p className="w-full min-w-0 sm:flex-1 text-sm text-neutral-600">
            Showing <span className="font-semibold text-neutral-900">{state.total}</span> {summaryEventLabel} near{" "}
            <span className="inline-flex items-center gap-1 font-semibold text-neutral-900">
              <MapPin className="size-3.5 shrink-0" />
              <span className="line-clamp-1">{summaryPlace}</span>
            </span>
            .
          </p>

          <div className="flex min-w-0 w-full sm:w-auto flex-wrap items-center justify-start sm:justify-end gap-3 sm:gap-4">
            <Select
              value={state.filters.venueType}
              onValueChange={(value) => state.setFilters((prev) => ({ ...prev, venueType: value }))}
            >
              <SelectTrigger className="h-10 min-w-[170px] rounded-md border-primary/25 bg-white px-3">
                <span className="flex min-w-0 items-center gap-2 text-sm text-neutral-900">
                  <Building2 className="size-4 shrink-0 text-neutral-400" />
                  <SelectValue placeholder="Venue Type" />
                </span>
              </SelectTrigger>
              <SelectContent className="rounded-md border-primary/25">
                {VENUE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover open={eventTypeOpen} onOpenChange={setEventTypeOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="h-10 min-w-[210px] justify-between rounded-md border-primary/25">
                  <span className="inline-flex items-center gap-2 text-sm text-neutral-800">
                    <Filter className="size-4 text-neutral-500" />
                    {selectedEventCount > 0 ? `${selectedEventCount} event types` : "Event Types"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(92vw,360px)] rounded-md border border-primary/25 p-3" align="end">
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {EVENT_TYPE_CHECKBOX_OPTIONS.map((label) => (
                    <label key={label} className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800">
                      <Checkbox
                        checked={state.filters.eventTypes.includes(label)}
                        onCheckedChange={() =>
                          state.setFilters((prev) => ({
                            ...prev,
                            eventTypes: prev.eventTypes.includes(label)
                              ? prev.eventTypes.filter((v) => v !== label)
                              : [...prev.eventTypes, label],
                          }))
                        }
                        className="border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button type="button" variant="outline" onClick={() => setFilterOpen(true)} className="h-10 rounded-md border-primary/25">
              <SlidersHorizontal className="size-4 text-neutral-700" />
              Filters
              {state.activeFilterCount > 0 ? (
                <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">
                  {state.activeFilterCount}
                </span>
              ) : null}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={state.resetFilters}
              className="h-10 rounded-md border-primary/25 text-neutral-700 hover:bg-neutral-50"
            >
              <X className="size-4" />
              Reset
            </Button>

            <div className="flex items-center gap-2">
              <Switch
                id="show-map"
                size="lg"
                checked={state.showMap}
                onCheckedChange={state.setShowMap}
                className="data-checked:bg-primary"
              />
              <Label htmlFor="show-map" className="text-sm font-medium text-neutral-700">
                Show map
              </Label>
            </div>
          </div>
        </div>

        <div
          className={
            state.showMap
              ? "flex flex-col-reverse gap-6 lg:flex-row lg:items-start lg:gap-8"
              : "flex flex-col gap-6"
          }
        >
          <div
            className={
              state.showMap
                ? "min-h-0 min-w-0 w-full lg:flex-1 lg:basis-0 lg:min-w-0"
                : "mx-auto w-full max-w-[1600px]"
            }
          >
            {state.isPending && state.total === 0 ? (
              <div
                className={
                  state.showMap
                    ? "grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 lg:gap-5 xl:grid-cols-3 items-stretch"
                    : "grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5 items-stretch"
                }
              >
                {Array.from({ length: state.showMap ? 9 : 12 }).map((_, i) => (
                  <VenueListingCardSkeleton key={i} />
                ))}
              </div>
            ) : state.isError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-10 text-sm text-red-700">
                Something went wrong while loading venues. Please try again.
              </div>
            ) : state.total === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center text-sm text-neutral-600">
                No venues match these filters. Try another event type or widen the location search.
              </div>
            ) : (
              <div
                className={
                  state.showMap
                    ? "grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 lg:gap-5 xl:grid-cols-3"
                    : "grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5"
                }
              >
                {state.venues.map((venue) => (
                  <div
                    key={venue.id}
                    ref={(el) => {
                      cardRefs.current[venue.id] = el
                    }}
                    className="h-full rounded-xl"
                    onMouseEnter={() => setSelectedId(venue.id)}
                  >
                    <VenueListingCard
                      venue={venue}
                      className={cn(
                        "w-full bg-gray-50 transition-colors hover:shadow-md",
                        state.isPending && "opacity-70"
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {state.showMap ? (
            <div className="flex w-full min-w-0 flex-col mb-2 lg:mb-0 lg:mt-0 lg:sticky lg:top-[68px] lg:h-[calc(100vh-80px)] lg:max-h-[calc(100vh-80px)] lg:w-[min(100%,360px)] lg:max-w-[360px] lg:shrink-0">
              <VenuesMap
                venues={state.filteredVenues}
                searchCenter={state.appliedPlace ? { lat: state.appliedPlace.lat, lng: state.appliedPlace.lng } : null}
                selectedId={selectedId}
                onMarkerClick={onMarkerClick}
                mapsLoaded={mapsLoaded}
                mapsError={loadError ?? undefined}
                className="h-full w-full flex-1 lg:min-h-0"
              />
            </div>
          ) : null}
        </div>

        {state.pageCount > 1 ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => state.setPage((p) => Math.max(1, p - 1))}
              disabled={state.page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>

            {Array.from({ length: state.pageCount }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === state.pageCount || Math.abs(p - state.page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1]
                const showGap = prev != null && p - prev > 1
                return (
                  <React.Fragment key={p}>
                    {showGap ? <span className="px-1 text-neutral-500">...</span> : null}
                    <button
                      type="button"
                      onClick={() => state.setPage(p)}
                      className={cn(
                        "size-10 rounded-full text-sm font-semibold transition-colors",
                        p === state.page
                          ? "bg-primary text-primary-foreground"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      )}
                      aria-label={`Go to page ${p}`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                )
              })}

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => state.setPage((p) => Math.min(state.pageCount, p + 1))}
              disabled={state.page === state.pageCount}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
