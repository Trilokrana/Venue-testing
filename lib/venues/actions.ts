"use server"
import createClient from "@/lib/supabase/server-component-client"
import { createServiceSupabaseClient } from "@/lib/supabase/service-client"
import * as mutations from "@/lib/venues/database/mutations"
import * as queries from "@/lib/venues/database/queries"
import {
  createVenueSchema,
  deleteVenueSchema,
  UpdateVenue,
  updateVenueSchema,
  VenueFilters,
  type CreateVenue,
} from "@/schemas/venue.schema"
import { revalidatePath } from "next/cache"
import { ActionResult, Meta, PaginatedResult } from "../supabase/utils"
import { getUserAccountType } from "../user/database/queries"
import requireSession from "../user/require-session"
import { parseVenueError } from "./error-utils"
import { VenueWithRelations } from "./types"

export async function isOwnerCalendarConnected(): Promise<boolean> {
  try {
    const client = await createClient()
    const { user } = await requireSession(client)
    const { data } = await client
      .from("cronofy_credentials")
      .select("sub")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    return !!data?.sub
  } catch {
    return false
  }
}

// Check if venue exists by slug (public)
export async function checkSlugExists(slug: string) {
  try {
    const slugExists = await queries.checkSlugExists(slug)
    return {
      success: !slugExists, // success = available
      data: slugExists, // true = exists, false = available
      statusCode: 200,
      message: slugExists ? `(${slug}) is already taken` : `(${slug}) is available`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check slug",
      statusCode: 500,
    }
  }
}

// Get venues for current owner (authorized)
export async function getMyVenues(
  filters?: VenueFilters
): Promise<PaginatedResult<VenueWithRelations>> {
  try {
    const client = await createClient()
    const { user } = await requireSession(client)

    const venues = await queries.getVenuesByOwnerId(user.id, filters)

    return {
      success: true,
      data: {
        items: venues.items,
        meta: venues.meta as Meta,
      },
      statusCode: 200,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch your venues",
      statusCode: 500,
    }
  }
}

// Get venues for current owner (authorized)
export async function getMyVenueBySlug(
  slug: string
): Promise<ActionResult<VenueWithRelations>> {
  try {
    const trimmed = slug?.trim() ?? ""
    if (!trimmed) {
      return {
        success: false,
        error: "A venue slug is required in the URL.",
        statusCode: 400,
      }
    }

    const client = await createClient()
    const { user } = await requireSession(client)

    const venue = await queries.getVenueBySlug(trimmed, user.id)

    if (!venue) {
      return {
        success: false,
        error:
          "We could not find a venue with this link. It may have been removed, or the URL may be wrong.",
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: venue as unknown as VenueWithRelations,
      statusCode: 200,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not load this venue. Please try again.",
      statusCode: 500,
    }
  }
}

// Create venue (authorized - venue owners only)
export async function createVenue(
  data: CreateVenue
): Promise<ActionResult<Awaited<ReturnType<typeof mutations.createVenue>>>> {
  try {
    const client = await createClient()
    const { user } = await requireSession(client)

    // Verify user is a venue owner
    const accountType = await getUserAccountType(client, user.id)
    if (accountType !== "venue_owner") {
      return { success: false, error: "Only venue owners can create venues", statusCode: 403 }
    }

    // Check venue count before creating
    // const existingVenues = await queries.getVenuesByOwnerId(user.id)
    // if (existingVenues && existingVenues.length >= 3) {
    //   return { success: false, error: "You have reached the maximum number of venues allowed" }
    // }

    const validatedData = createVenueSchema.parse(data)

    const venueWithOwner = { ...validatedData, owner_id: user.id }

    const result = await mutations.createVenue(venueWithOwner)
    revalidatePath("/venues")
    return { success: true, data: result, statusCode: 200 }
  } catch (error) {
    console.error("Error creating venue:", error)
    return { success: false, error: parseVenueError(error), statusCode: 500 }
  }
}

// Update venue (authorized + ownership check)
export async function updateVenue(
  id: string,
  data: Omit<UpdateVenue, "id">
): Promise<ActionResult<Awaited<ReturnType<typeof mutations.updateVenue>>>> {
  try {
    const client = await createClient()
    const { user } = await requireSession(client)

    // Add ID to validation data
    const validationData = { ...data, id }
    console.log("🚀 ~ updateVenue ~ validationData:", validationData.images)
    const validatedData = updateVenueSchema.parse(validationData)
    console.log("🚀 ~ updateVenue ~ validatedData:", validatedData)

    const isOwner = await queries.checkVenueOwnership(id, user.id)

    if (!isOwner) {
      return {
        success: false,
        error: "You do not have permission to update this venue",
        statusCode: 403,
      }
    }

    const result = await mutations.updateVenue(id, validatedData)
    revalidatePath(`/venues/${id}`)
    return { success: true, data: result, statusCode: 200 }
  } catch (error) {
    console.error(`Error updating venue ${id}:`, error)
    return { success: false, error: parseVenueError(error), statusCode: 500 }
  }
}

// Delete venue (authorized + ownership check)
export async function deleteVenue(id: string) {
  try {
    const client = await createClient()
    const { user } = await requireSession(client)

    const validatedData = deleteVenueSchema.parse({ id })
    const isOwner = await queries.checkVenueOwnership(validatedData.id, user.id)

    if (!isOwner) {
      throw new Error("You do not have permission to delete this venue")
    }

    await mutations.deleteVenue(validatedData.id)
    revalidatePath("/venues")
    return true
  } catch (error) {
    console.error(`Error deleting venue ${id}:`, error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to delete venue")
  }
}

// Normalized address type returned from Google Places API
export interface NormalizedAddress {
  street: string
  address_line_2?: string
  city: string
  state: string
  zip: string
  country: string
  place_id: string
  formatted_address: string
  lat: number
  lng: number
}

// Normalize Google Place Details and optionally persist to venue
export async function normalizePlaceDetails(
  placeId: string,
  options?: {
    sessionToken?: string
    venueId?: string
  }
): Promise<NormalizedAddress> {
  try {
    if (!placeId?.trim()) {
      throw new Error("placeId is required")
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      throw new Error("Server is not configured for Google Maps")
    }

    const fields = ["address_component", "formatted_address", "geometry/location", "place_id"].join(
      ","
    )

    const params = new URLSearchParams({
      place_id: placeId,
      fields,
      key: apiKey,
    })

    if (options?.sessionToken) {
      params.set("sessiontoken", options.sessionToken)
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
    const res = await fetch(url, { cache: "no-store" })
    const json = await res.json()

    if (!res.ok || json.status !== "OK") {
      throw new Error(json.error_message || json.status || "Places API error")
    }

    const normalized = normalizeAddressComponents(json.result)

    // If a venueId is provided, verify ownership and upsert immediately
    if (options?.venueId) {
      const client = await createClient()
      const { user } = await requireSession(client)

      // Verify ownership
      const isOwner = await queries.checkVenueOwnership(options.venueId, user.id)

      if (!isOwner) {
        throw new Error("You do not have permission to update this venue")
      }

      const admin = createServiceSupabaseClient()
      const { error: rpcError } = await admin.rpc("upsert_venue_address", {
        p_venue_id: options.venueId,
        p_street: normalized.street,
        p_address_line_2: normalized.address_line_2 ?? null,
        p_city: normalized.city,
        p_state: normalized.state,
        p_zip: normalized.zip,
        p_country: normalized.country,
        p_place_id: normalized.place_id,
        p_formatted_address: normalized.formatted_address,
        p_lat: normalized.lat,
        p_lng: normalized.lng,
      })

      if (rpcError) {
        throw new Error(`Failed to update venue address: ${rpcError.message}`)
      }
    }

    return normalized
  } catch (error) {
    console.error("Error normalizing place details:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to normalize place details")
  }
}

/** Minimal shape of Google Place Details `result` for address normalization */
interface GooglePlaceDetailsResult {
  address_components?: Array<{ long_name: string; short_name: string; types: string[] }>
  formatted_address?: string
  place_id?: string
  geometry?: { location?: { lat?: number; lng?: number } }
}

// Helper function to normalize Google Place Details API result
function normalizeAddressComponents(result: GooglePlaceDetailsResult): NormalizedAddress {
  const components: Array<{ long_name: string; short_name: string; types: string[] }> =
    result.address_components || []

  function get(type: string, useShort = false): string {
    const c = components.find((c) => c.types.includes(type))
    if (!c) return ""
    return useShort ? c.short_name : c.long_name
  }

  const streetNumber = get("street_number")
  const route = get("route")
  const street = [streetNumber, route].filter(Boolean).join(" ")

  const address_line_2 = get("subpremise") || undefined
  const city = get("locality") || get("postal_town") || get("sublocality") || ""
  const state = get("administrative_area_level_1", true) || ""
  const zip = get("postal_code") || ""
  const country = get("country", true) || ""

  const formatted_address: string = result.formatted_address || ""
  const place_id: string = result.place_id || ""
  const lat: number = result.geometry?.location?.lat ?? 0
  const lng: number = result.geometry?.location?.lng ?? 0

  return {
    street,
    address_line_2,
    city,
    state,
    zip,
    country,
    place_id,
    formatted_address,
    lat,
    lng,
  }
}
