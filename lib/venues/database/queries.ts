import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, normalizePagination } from "@/lib/pagination"
import { createServiceSupabaseClient } from "@/lib/supabase/service-client"
import { mapSupabaseError } from "@/lib/supabase/utils"
import { VenueFilters } from "@/schemas/venue.schema"

interface GetVenuesOptions {
  filters?: VenueFilters
  page?: number
  pageSize?: number
}

interface GetVenuesResult {
  venues: unknown[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function checkSlugExists(slug: string) {
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase.from("venues").select("id").eq("slug", slug).maybeSingle() // ✅ FIX
  console.log("🚀 ~ checkSlugExists ~ data:", data)

  console.log("🚀 ~ checkSlugExists ~ error:", error)
  if (error) throw error

  return data ? true : false // true if exists, false if not
}

export async function getVenues(options?: GetVenuesOptions): Promise<GetVenuesResult> {
  const { filters, page = 1, pageSize = 24 } = options || {}

  const supabase = createServiceSupabaseClient()

  // Build the base query for counting with inner join on addresses
  // Only include active venues in public search results
  let countQuery = supabase
    .from("venues")
    .select("id, addresses!inner(city)", { count: "exact", head: true })
    .eq("is_active", true)

  // Build the base query for data
  // Only include active venues in public search results
  let query = supabase
    .from("venues")
    .select(
      `
      *,
      addresses!inner (
        street,
        address_line_2,
        city,
        state,
        country,
        lat,
        lng
      ),
      images (
        id,
        storage_path,
        url,
        is_featured,
        sort_order
      )
    `
    )
    .eq("is_active", true)

  // Apply filters to both queries
  if (filters) {
    // Text search on venue name
    if (filters.query) {
      query = query.ilike("name", `%${filters.query}%`)
      countQuery = countQuery.ilike("name", `%${filters.query}%`)
    }

    if (filters.venue_type) {
      query = query.eq("venue_type", filters.venue_type)
      countQuery = countQuery.eq("venue_type", filters.venue_type)
    }

    // Filter by event types if provided
    if (filters.event_types && filters.event_types.length > 0) {
      // Use overlap operator to find venues that have any of the requested event types
      query = query.overlaps("event_types", filters.event_types)
      countQuery = countQuery.overlaps("event_types", filters.event_types)
    }

    // Use case-insensitive match for city filtering
    if (filters.city) {
      query = query.ilike("addresses.city", `%${filters.city}%`)
      countQuery = countQuery.ilike("addresses.city", `%${filters.city}%`)
    }

    if (filters.min_capacity) {
      query = query.gte("capacity", filters.min_capacity)
      countQuery = countQuery.gte("capacity", filters.min_capacity)
    }
    if (filters.max_capacity) {
      query = query.lte("capacity", filters.max_capacity)
      countQuery = countQuery.lte("capacity", filters.max_capacity)
    }

    // Filter by max hourly rate - only venues at or below the specified price
    if (filters.max_hourly_rate) {
      query = query.lte("hourly_rate", filters.max_hourly_rate)
      countQuery = countQuery.lte("hourly_rate", filters.max_hourly_rate)
    }

    // Filter by max min hours - only venues with minimum hours at or below the specified value
    if (filters.max_min_hours) {
      query = query.lte("min_hours", filters.max_min_hours)
      countQuery = countQuery.lte("min_hours", filters.max_min_hours)
    }

    // Filter by amenities - venue must have ALL selected amenities (AND logic)
    if (filters.amenities && filters.amenities.length > 0) {
      query = query.contains("amenities", filters.amenities)
      countQuery = countQuery.contains("amenities", filters.amenities)
    }

    // Filter by indoor/outdoor setting
    // When user picks "indoor" or "outdoor", also include venues marked as "both"
    if (filters.indoor_outdoor) {
      if (filters.indoor_outdoor === "both") {
        query = query.eq("indoor_outdoor", "both")
        countQuery = countQuery.eq("indoor_outdoor", "both")
      } else {
        query = query.in("indoor_outdoor", [filters.indoor_outdoor, "both"])
        countQuery = countQuery.in("indoor_outdoor", [filters.indoor_outdoor, "both"])
      }
    }

    // Filter by instant booking availability
    if (filters.instabook) {
      query = query.eq("instabook", true)
      countQuery = countQuery.eq("instabook", true)
    }
  }

  // Get total count first
  const { count, error: countError } = await countQuery

  if (countError) throw countError

  const total = count || 0
  const totalPages = Math.ceil(total / pageSize)

  // Apply pagination to data query
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to)

  const { data, error } = await query

  if (error) throw error

  return {
    venues: data || [],
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function getVenueById(id: string) {
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase
    .from("venues")
    .select(
      `
      *,
      addresses (
        street,
        address_line_2,
        city,
        state,
        country,
        zip,
        lat,
        lng
      ),
      images (
        id,
        storage_path,
        url,
        width,
        height,
        is_featured,
        sort_order
      ),
      ratings (
        rating,
        review,
        user_id,
        created_at
      )
    `
    )
    .eq("id", id)
    .eq("is_active", true)
    .order("sort_order", { referencedTable: "images", ascending: true })
    .single()

  if (error) throw error
  return data
}

export async function getVenuesByOwnerId(ownerId: string, filters?: VenueFilters) {
  const supabase = createServiceSupabaseClient()

  const { page, pageSize, from, to } = normalizePagination({
    page: filters?.page || DEFAULT_PAGE,
    pageSize: filters?.perPage || DEFAULT_PAGE_SIZE,
  })

  let query = supabase
    .from("venues")
    .select(
      `
      *,
      addresses!inner (
        street,
        address_line_2,
        city,
        state,
        country,
        zip,
        lat,
        lng
      ),
      images (
        id,
        storage_path,
        url,
        width,
        height,
        is_featured,
        sort_order,
        size
      )
      `,
      { count: "exact" }
    )
    .eq("owner_id", ownerId)

  // ---------- Filters ----------
  if (filters?.query?.trim()) {
    const search = filters.query.trim().replace(/\s+/g, " ")
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }
  // ---------- Ordering ----------
  query = query
    .order("created_at", { ascending: false })
    .order("sort_order", { referencedTable: "images", ascending: true })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw mapSupabaseError(error, "Failed to fetch venues")
  }

  const venues = data ?? []
  const venueIds = venues.map((venue) => venue.id).filter(Boolean)
  const nowIso = new Date().toISOString()

  let bookedVenueIds = new Set<string>()
  if (venueIds.length > 0) {
    const { data: activeBookings, error: bookingError } = await supabase
      .from("bookings")
      .select("venue_id")
      .in("venue_id", venueIds)
      .in("status", ["pending", "confirmed"])
      .gte("end_at", nowIso)

    if (bookingError) {
      throw mapSupabaseError(bookingError, "Failed to fetch venue booking status")
    }

    bookedVenueIds = new Set((activeBookings ?? []).map((booking) => booking.venue_id))
  }

  const items = venues.map((venue) => ({
    ...venue,
    is_booked: bookedVenueIds.has(venue.id),
  }))

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    items,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}

export async function checkVenueOwnership(venueId: string, userId: string) {
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase
    .from("venues")
    .select("owner_id")
    .eq("id", venueId)
    .single()

  if (error) throw error
  return data.owner_id === userId
}

export async function getVenueBySlug(slug: string, userId: string) {
  const supabase = createServiceSupabaseClient()

  const query = supabase
    .from("venues")
    .select(
      `
      *,
      addresses (
        street,
        address_line_2,
        city,
        state,
        country,
        zip,
        lat,
        lng
      ),
      images (
        id,
        storage_path,
        url,
        width,
        height,
        size,
        is_featured,
        sort_order
      ),
      ratings (
        rating,
        review,
        user_id,
        created_at
      )
    `
    )
    .eq("slug", slug)
    // .eq("is_active", true)
    .eq("owner_id", userId)
    .order("sort_order", { referencedTable: "images", ascending: true })
    .maybeSingle()

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getCities() {
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase
    .from("addresses")
    .select("city, state, country")
    .order("city", { ascending: true })

  if (error) throw error

  if (!data) return []

  const filteredData = data.filter((item) => item.city && item.state && item.country)

  return filteredData
}
