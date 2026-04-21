"use server"
import * as mutations from "@/lib/bookings/database/mutations"
import * as queries from "@/lib/bookings/database/queries"
import createClient from "@/lib/supabase/server-component-client"
import { getUserAccountType } from "@/lib/user/database/queries"
import requireSession from "@/lib/user/require-session"
import {
  BookingFilters,
  CreateBooking,
  createBookingSchema,
  deleteBookingSchema,
} from "@/schemas/booking.schema"
import { revalidatePath } from "next/cache"
import { ActionResult, Meta, PaginatedResult } from "../supabase/utils"
import { BookingWithRelations } from "./types"

// Get bookings for current owner (authorized)
export async function getOwnerBookings(
  filters?: BookingFilters
): Promise<PaginatedResult<BookingWithRelations>> {
  try {
    const client = await createClient()
    const { user } = await requireSession(client)
    const bookings = await queries.getBookingsByOwnerId(user.id, filters)
    return {
      success: true,
      data: {
        items: bookings.items ?? [],
        meta: bookings.meta as Meta,
      },
      statusCode: 200,
    }
  } catch (error) {
    console.error("Error fetching owner venues:", error)
    return {
      success: false,
      error: "Failed to fetch your venues",
      statusCode: 500,
    }
  }
}

// Get bookings for current rentee (authorized)
export async function getRenteeBookings(
  filters?: BookingFilters
): Promise<PaginatedResult<BookingWithRelations>> {
  try {
    const client = await createClient()
    const { user } = await requireSession(client)
    const bookings = await queries.getBookingsByRenteeId(user.id, filters)
    return {
      success: true,
      data: {
        items: bookings.items ?? [],
        meta: bookings.meta as Meta,
      },
      statusCode: 200,
    }
  } catch (error) {
    console.error("Error fetching owner venues:", error)
    return {
      success: false,
      error: "Failed to fetch your venues",
      statusCode: 500,
    }
  }
}

// Create booking (authorized - rentees only)
export async function createBooking(
  data: CreateBooking
): Promise<ActionResult<Awaited<ReturnType<typeof mutations.createBooking>>>> {
  try {
    const client = await createClient()
    const { user } = await requireSession(client)

    // Verify user is a venue owner
    const accountType = await getUserAccountType(client, user.id)
    if (accountType !== "rentee") {
      return { success: false, error: "Only Rentees can create bookings", statusCode: 403 }
    }

    // Check venue count before creating
    // const existingVenues = await queries.getVenuesByOwnerId(user.id)
    // if (existingVenues && existingVenues.length >= 3) {
    //   return { success: false, error: "You have reached the maximum number of venues allowed" }
    // }

    const validatedData = createBookingSchema.parse(data)

    const bookingWithOwner = { ...validatedData, owner_id: user.id }

    const result = await mutations.createBooking(bookingWithOwner)
    revalidatePath("/bookings")
    return { success: true, data: result, statusCode: 200 }
  } catch (error) {
    console.error("Error creating Booking:", error)
    return { success: false, error: (error as Error).message, statusCode: 500 }
  }
}

// Update booking (authorized + ownership check)
export async function updateBooking(
  id: string,
  data: Omit<CreateBooking, "id">
): Promise<ActionResult<Awaited<ReturnType<typeof mutations.updateBooking>>>> {
  try {
    const client = await createClient()
    const { user } = await requireSession(client)

    // Add ID to validation data
    const validationData = { ...data, id }
    const validatedData = createBookingSchema.parse(validationData)

    // const isOwner = await queries.checkVenueOwnership(id, user.id)

    // if (!isOwner) {
    //   return { success: false, error: "You do not have permission to update this venue" }
    // }

    const result = await mutations.updateBooking(id, validatedData)
    revalidatePath(`/bookings/${id}`)
    return { success: true, data: result, statusCode: 200 }
  } catch (error) {
    console.error(`Error updating Booking ${id}:`, error)
    return { success: false, error: (error as Error).message, statusCode: 500 }
  }
}

// Delete booking (authorized + ownership check)
export async function deleteBooking(id: string): Promise<ActionResult<boolean>> {
  try {
    const client = await createClient()
    const { user } = await requireSession(client)

    const validatedData = deleteBookingSchema.parse({ id })
    const isOwner = await queries.checkVenueOwnership(validatedData.id, user.id)

    if (!isOwner) {
      return {
        success: false,
        error: "You do not have permission to delete this venue",
        statusCode: 403,
      }
    }

    await mutations.deleteBooking(validatedData.id)
    revalidatePath("/venues")
    return { success: true, data: true, statusCode: 200 }
  } catch (error) {
    console.error(`Error deleting venue ${id}:`, error)
    if (error instanceof Error) {
      return { success: false, error: error.message, statusCode: 500 }
    }
    return { success: false, error: "Failed to delete venue", statusCode: 500 }
  }
}
