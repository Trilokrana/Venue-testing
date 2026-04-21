import type { VenueAddress, VenueImage, VenueType, VenueWithRelations } from "@/lib/venues/types"

export type { VenueAddress, VenueImage, VenueType, VenueWithRelations }

/** Half-hour slots from 6:00 AM through 11:30 PM for booking UIs */
export function getTimeSlotOptions(): string[] {
  const out: string[] = []
  for (let h = 6; h <= 23; h++) {
    for (const m of [0, 30]) {
      if (h === 23 && m === 30) break
      const d = new Date(2000, 0, 1, h, m)
      out.push(
        d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      )
    }
  }
  return out
}

/** DB `venue_type` values + display labels for filters */
export const VENUE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "banquet_hall", label: "Banquet Hall" },
  { value: "conference_center", label: "Conference Center" },
  { value: "bar_nightclub", label: "Bar Nightclub" },
  { value: "event_space_studio", label: "Event Space Studio" },
]

export const EVENT_TYPE_CHECKBOX_OPTIONS = [
  "Wedding",
  "Conference",
  "Party",
  "Exhibition",
  "Concert",
  "Corporate Meeting",
  "Seminar",
  "Gala",
  "Trade Show",
  "Workshop",
  "Birthday",
] as const

export type FilterState = {
  searchQuery: string
  venueType: string
  eventTypes: string[]
  indoorOutdoor: "all" | "indoor" | "outdoor" | "both"
  instantOnly: boolean
  minGuests: string
  maxPrice: number
  maxMinHours: number
  selectedAmenities: string[]
}

export const FILTER_PRICE_MAX = 2000
export const FILTER_MIN_HOURS_MAX = 24

export const defaultFilterState = (): FilterState => ({
  searchQuery: "",
  venueType: "all",
  eventTypes: [],
  indoorOutdoor: "all",
  instantOnly: false,
  minGuests: "",
  maxPrice: FILTER_PRICE_MAX,
  maxMinHours: FILTER_MIN_HOURS_MAX,
  selectedAmenities: [],
})

/** Amenity categories for the amenities picker (subset; matches common venue.amenities strings) */
export const AMENITY_CATEGORIES: { title: string; items: string[] }[] = [
  {
    title: "Food & Beverage",
    items: ["mini bar", "catering", "kitchen"],
  },
  {
    title: "AV & Production",
    items: ["microphone", "projector", "speaker", "big ass speakers"],
  },
  {
    title: "Climate & Comfort",
    items: ["air_conditioning", "pool", "heating"],
  },
  {
    title: "Outdoor & Special",
    items: ["pool", "smoking_allowed", "outdoor"],
  },
  {
    title: "Access",
    items: ["ramps", "seating", "vip parking", "large parking lot"],
  },
]

/** Default: no event-type filter — all active venues show until user picks a type and searches. */
export const ALL_PLANNING = "All" as const

/** Popular + extended labels for "What are you planning?" */
export const PLANNING_OPTIONS = [
  ALL_PLANNING,
  "Christmas Party",
  "Birthday Party",
  "Wedding",
  "Corporate Event",
  "Photo Shoot",
  "Meeting",
  "Music Video",
  "Party",
  "Seminar",
  "Gala",
  "Concert",
  "Product Launch",
  "Baby Shower",
  "Recreation",
  "Production",
  "Event",
] as const

export function normalizeAddress(venue: VenueWithRelations): VenueAddress | null {
  const a = venue?.addresses
  if (!a) return null
  return Array.isArray(a) ? (a[0] ?? null) : a
}

export function primaryImageUrl(venue: VenueWithRelations): string | null {
  const imgs = venue.images
  if (!imgs?.length) return null
  const sorted = [...imgs].sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
    return a.sort_order - b.sort_order
  })
  return sorted[0]?.url ?? null
}

export function formatVenueType(type: VenueType): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export function applyAdvancedFilters(venue: VenueWithRelations, f: FilterState): boolean {
  const q = f.searchQuery.trim().toLowerCase()
  if (q) {
    const nameOk = venue.name.toLowerCase().includes(q)
    const descOk = venue.description?.toLowerCase().includes(q) ?? false
    const typeOk = formatVenueType(venue.venue_type).toLowerCase().includes(q)
    if (!nameOk && !descOk && !typeOk) return false
  }

  if (f.venueType !== "all" && venue.venue_type !== f.venueType) return false

  if (f.eventTypes.length > 0) {
    const et = venue.event_types ?? []
    const match = f.eventTypes.some((ft) =>
      et.some(
        (e) => e.toLowerCase() === ft.toLowerCase() || e.toLowerCase().includes(ft.toLowerCase())
      )
    )
    if (!match) return false
  }

  if (f.indoorOutdoor !== "all") {
    const io = (venue.indoor_outdoor ?? "").toLowerCase()
    if (f.indoorOutdoor === "both") {
      if (io !== "both") return false
    } else if (f.indoorOutdoor === "indoor") {
      if (io !== "indoor" && io !== "both") return false
    } else if (f.indoorOutdoor === "outdoor") {
      if (io !== "outdoor" && io !== "both") return false
    }
  }

  if (f.instantOnly && !venue.instabook) return false

  const guests = f.minGuests.trim() ? Number.parseInt(f.minGuests, 10) : NaN
  if (!Number.isNaN(guests) && guests > 0) {
    if (venue.capacity == null || venue.capacity < guests) return false
  }

  if (f.maxPrice < FILTER_PRICE_MAX) {
    if (venue.hourly_rate != null && venue.hourly_rate > f.maxPrice) return false
  }

  if (f.maxMinHours < FILTER_MIN_HOURS_MAX) {
    if (venue.min_hours != null && venue.min_hours > f.maxMinHours) return false
  }

  if (f.selectedAmenities.length > 0) {
    const am = (venue.amenities ?? []).map((a) => a.toLowerCase())
    const ok = f.selectedAmenities.every((sel) =>
      am.some((x) => x.includes(sel.toLowerCase()) || sel.toLowerCase().includes(x))
    )
    if (!ok) return false
  }

  return true
}

export function formatLocationLine(addr: VenueAddress | null): string {
  if (!addr) return "Location on request"
  if (addr.formatted_address) return addr.formatted_address
  const parts = [
    addr.street,
    addr.address_line_2,
    addr.city,
    addr.state,
    addr.country,
    addr.zip,
  ].filter(Boolean)
  if (parts.length) return parts.join(", ")
  return (
    [addr.street, addr.city, addr.state, addr.country].filter(Boolean).join(", ") ||
    "Location on request"
  )
}

export function formatShortLocation(addr: VenueAddress | null): string {
  if (!addr) return ""
  const parts = [addr.city, addr.state].filter(Boolean)
  return parts.join(", ") || addr.formatted_address || ""
}

/** Match selected planning label against venue.event_types (case-insensitive). */
export function venueMatchesEventFilter(
  venue: VenueWithRelations,
  planning: string | null
): boolean {
  if (!planning?.trim()) return true
  const q = planning.trim().toLowerCase()
  if (q === ALL_PLANNING.toLowerCase()) return true
  const types = venue.event_types
  if (!types?.length) return true
  return types.some((t) => t.toLowerCase().includes(q) || q.includes(t.toLowerCase()))
}

/** Haversine distance in km; returns null if coords missing. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number | null,
  lng2: number | null
): number | null {
  if (lat2 == null || lng2 == null) return null
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
