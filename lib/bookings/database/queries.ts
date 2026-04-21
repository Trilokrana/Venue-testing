import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, normalizePagination } from "@/lib/pagination"
import { createServiceSupabaseClient } from "@/lib/supabase/service-client"
import { BookingFilters } from "@/schemas/booking.schema"

export async function getBookingsByOwnerId(ownerId: string, filters?: BookingFilters) {
  const supabase = createServiceSupabaseClient()

  const { page, pageSize, from, to } = normalizePagination({
    page: filters?.page || DEFAULT_PAGE,
    pageSize: filters?.perPage || DEFAULT_PAGE_SIZE,
  })

  let query = supabase
    .from("bookings")
    .select(
      `
        *,
        venue:venues!bookings_venue_id_fkey!inner (
          *,
          addresses (*),
          images (*)
        ),
        rentee:users!bookings_rentee_id_fkey!inner (
          id,
          display_name,
          account_type
        ),
        owner:users!bookings_owner_id_fkey!inner (
          id,
          display_name,
          account_type
        )
        `,
      { count: "exact" }
    )
    .eq("owner_id", ownerId)

  // ---------- Filters ----------
  if (filters?.query?.trim()) {
    const search = filters.query.trim().replace(/\s+/g, " ")
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`, {
      foreignTable: "venues",
    })
  }

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.created_at) {
    const start = new Date(parseInt(filters.created_at))
    const end = new Date(parseInt(filters.created_at))
    end.setDate(end.getDate() + 1)
    // query = query.gte("created_at", start.toISOString()).lt("created_at", end.toISOString())
    query = query.gte("created_at", start.toISOString())
  }

  if (filters?.start_at) {
    const start = new Date(parseInt(filters.start_at))
    const end = new Date(parseInt(filters.start_at))
    end.setDate(end.getDate() + 1)
    // query = query.gte("start_at", start.toISOString()).lt("start_at", end.toISOString())
    query = query.gte("start_at", start.toISOString())
  }

  if (filters?.end_at) {
    const start = new Date(parseInt(filters.end_at))
    const end = new Date(parseInt(filters.end_at))
    end.setDate(end.getDate() + 1)
    // query = query.gte("end_at", start.toISOString()).lt("end_at", end.toISOString())
    query = query.gte("end_at", start.toISOString())
  }

  // ---------- Sorting ----------

  if (filters?.sort_column && filters?.sort_order) {
    if (filters?.sort_column.includes(".")) {
      const [table, column] = filters.sort_column.split(".")
      query = query.order(column, {
        referencedTable: table,
        ascending: filters.sort_order === "asc",
      })
    } else {
      query = query.order(filters.sort_column, { ascending: filters.sort_order === "asc" })
    }
  }

  // ---------- Ordering ----------

  query = query
    .order("created_at", { ascending: false })
    // .order("sort_order", { referencedTable: "images", ascending: true })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    return {
      success: false,
      error: error.message,
      statusCode: 500,
    }
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    items: data ?? [],
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

export async function getBookingsByRenteeId(renteeId: string, filters?: BookingFilters) {
  const supabase = createServiceSupabaseClient()

  const { page, pageSize, from, to } = normalizePagination({
    page: filters?.page || DEFAULT_PAGE,
    pageSize: filters?.perPage || DEFAULT_PAGE_SIZE,
  })

  let query = supabase.from("bookings").select(
    `
        *,
        venue:venues!bookings_venue_id_fkey!inner (
          *,
          addresses (*),
          images (*)
        ),
        rentee:users!bookings_rentee_id_fkey!inner (
          id,
          display_name,
          account_type
        ),
        owner:users!bookings_owner_id_fkey!inner (
          id,
          display_name,
          account_type
        )
        `,
    { count: "exact" }
  )
  // .eq("rentee_id", renteeId)

  // ---------- Filters ----------
  if (filters?.query?.trim()) {
    const search = filters.query.trim().replace(/\s+/g, " ")
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`, {
      foreignTable: "venues",
    })
  }
  console.log("🚀 ~ getBookingsByRenteeId ~ filters?.status:", filters?.status)
  if (filters?.status) {
    query = query.eq("status", filters.status)
  }
  // ---------- Ordering ----------
  query = query
    .order("created_at", { ascending: false })
    // .order("sort_order", { referencedTable: "images", ascending: true })
    .range(from, to)

  const { data, error, count } = await query

  if (error) {
    return {
      success: false,
      error: error.message,
      statusCode: 500,
    }
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    items: data ?? [],
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
