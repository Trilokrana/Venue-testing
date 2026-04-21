"use client"

import {
  ALL_PLANNING,
  applyAdvancedFilters,
  defaultFilterState,
  distanceKm,
  getTimeSlotOptions,
  normalizeAddress,
  type FilterState,
  venueMatchesEventFilter,
} from "@/app/listings/data"
import type { VenueWithRelations } from "@/lib/venues/types"
import { useMutation } from "@tanstack/react-query"
import * as React from "react"

const TIME_OPTIONS = getTimeSlotOptions()

type VenueSearchPlace = {
  lat: number
  lng: number
  label: string
}

type VenueSearchPayload = {
  source: VenueWithRelations[]
  planning: string
  place: VenueSearchPlace | null
  date: string | null
  startTime: string
  endTime: string
  filters: FilterState
  page: number
  pageSize: number
}

type VenueSearchResponse = {
  items: VenueWithRelations[]
  allItems: VenueWithRelations[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

type HydrateSearchInput = {
  planning: string
  place: VenueSearchPlace | null
  date: Date | undefined
  startTime: string
  endTime: string
  showMap: boolean
}

const EMPTY_RESPONSE: VenueSearchResponse = {
  items: [],
  allItems: [],
  total: 0,
  page: 1,
  pageSize: 12,
  pageCount: 1,
}

function passesLocationFilter(venue: VenueWithRelations, place: VenueSearchPlace | null): boolean {
  if (!place) return true
  const addr = normalizeAddress(venue)
  if (addr?.lat != null && addr?.lng != null) {
    const d = distanceKm(place.lat, place.lng, addr.lat, addr.lng)
    if (d != null && d <= 120) return true
  }
  const label = place.label.toLowerCase()
  const city = addr?.city?.toLowerCase() ?? ""
  const state = addr?.state?.toLowerCase() ?? ""
  if (city && label.includes(city)) return true
  if (state && label.includes(state)) return true
  return false
}

async function searchVenues(payload: VenueSearchPayload): Promise<VenueSearchResponse> {
  const filtered = payload.source.filter(
    (venue) =>
      venueMatchesEventFilter(venue, payload.planning) &&
      passesLocationFilter(venue, payload.place) &&
      applyAdvancedFilters(venue, payload.filters)
  )

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / payload.pageSize))
  const safePage = Math.min(payload.page, pageCount)
  const start = (safePage - 1) * payload.pageSize

  return {
    items: filtered.slice(start, start + payload.pageSize),
    allItems: filtered,
    total,
    page: safePage,
    pageSize: payload.pageSize,
    pageCount,
  }
}

export function useVenue(initialVenues: VenueWithRelations[]) {
  const [planning, setPlanning] = React.useState<string>(ALL_PLANNING)
  const [appliedPlanning, setAppliedPlanning] = React.useState<string>(ALL_PLANNING)
  const [place, setPlace] = React.useState<VenueSearchPlace | null>(null)
  const [appliedPlace, setAppliedPlace] = React.useState<VenueSearchPlace | null>(null)
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [appliedDate, setAppliedDate] = React.useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = React.useState(TIME_OPTIONS[4] ?? "")
  const [endTime, setEndTime] = React.useState(TIME_OPTIONS[14] ?? "")
  const [appliedStartTime, setAppliedStartTime] = React.useState(TIME_OPTIONS[4] ?? "")
  const [appliedEndTime, setAppliedEndTime] = React.useState(TIME_OPTIONS[14] ?? "")

  const [filters, setFiltersState] = React.useState<FilterState>(defaultFilterState)
  const [showMap, setShowMapState] = React.useState(true)
  const [page, setPageState] = React.useState(1)

  const [result, setResult] = React.useState<VenueSearchResponse>(EMPTY_RESPONSE)
  const requestIdRef = React.useRef(0)

  const mutation = useMutation({
    mutationFn: searchVenues,
  })

  const payload = React.useMemo<VenueSearchPayload>(
    () => ({
      source: initialVenues,
      planning: appliedPlanning,
      place: appliedPlace,
      date: appliedDate ? appliedDate.toISOString().slice(0, 10) : null,
      startTime: appliedStartTime,
      endTime: appliedEndTime,
      filters,
      page,
      pageSize: showMap ? 9 : 12,
    }),
    [
      initialVenues,
      appliedPlanning,
      appliedPlace,
      appliedDate,
      appliedStartTime,
      appliedEndTime,
      filters,
      page,
      showMap,
    ]
  )

  React.useEffect(() => {
    let active = true
    const requestId = ++requestIdRef.current

    mutation
      .mutateAsync(payload)
      .then((next) => {
        if (!active) return
        if (requestId === requestIdRef.current) {
          setResult(next)
        }
      })
      .catch((error) => {
        if (!active) return
        console.error("useVenue search failed", error)
      })

    return () => {
      active = false
    }
  }, [payload, mutation.mutateAsync])

  React.useEffect(() => {
    if (page > result.pageCount) {
      setPageState(result.pageCount)
    }
  }, [page, result.pageCount])

  const applySearch = React.useCallback(() => {
    setAppliedPlanning(planning)
    setAppliedPlace(place)
    setAppliedDate(date)
    setAppliedStartTime(startTime)
    setAppliedEndTime(endTime)
    setPageState(1)
  }, [planning, place, date, startTime, endTime])

  const setFilters: React.Dispatch<React.SetStateAction<FilterState>> = React.useCallback((updater) => {
    setFiltersState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
      return next
    })
    setPageState(1)
  }, [])

  const resetFilters = React.useCallback(() => {
    setFiltersState(defaultFilterState())
    setPageState(1)
  }, [])

  const setShowMap = React.useCallback((value: boolean) => {
    setShowMapState(value)
    setPageState(1)
  }, [])

  const setPage = React.useCallback((next: number | ((prev: number) => number)) => {
    setPageState((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next
      return Math.max(1, resolved)
    })
  }, [])

  const hydrateFromUrl = React.useCallback((next: HydrateSearchInput) => {
    setPlanning(next.planning)
    setAppliedPlanning(next.planning)
    setPlace(next.place)
    setAppliedPlace(next.place)
    setDate(next.date)
    setAppliedDate(next.date)
    setStartTime(next.startTime)
    setEndTime(next.endTime)
    setAppliedStartTime(next.startTime)
    setAppliedEndTime(next.endTime)
    setShowMapState(next.showMap)
    setPageState(1)
  }, [])

  const activeFilterCount = React.useMemo(() => {
    const d = defaultFilterState()
    let n = 0
    if (filters.searchQuery.trim()) n++
    if (filters.venueType !== d.venueType) n++
    if (filters.eventTypes.length) n++
    if (filters.indoorOutdoor !== "all") n++
    if (filters.instantOnly) n++
    if (filters.minGuests.trim()) n++
    if (filters.maxPrice < d.maxPrice) n++
    if (filters.maxMinHours < d.maxMinHours) n++
    if (filters.selectedAmenities.length) n++
    return n
  }, [filters])

  return {
    planning,
    setPlanning,
    appliedPlanning,
    place,
    setPlace,
    appliedPlace,
    date,
    setDate,
    appliedDate,
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    appliedStartTime,
    appliedEndTime,
    applySearch,
    hydrateFromUrl,

    filters,
    setFilters,
    resetFilters,
    activeFilterCount,

    showMap,
    setShowMap,

    page,
    setPage,
    pageCount: result.pageCount,

    venues: result.items,
    filteredVenues: result.allItems,
    total: result.total,

    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

export type { VenueSearchPlace }
