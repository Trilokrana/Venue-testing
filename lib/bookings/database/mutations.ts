import type { Database } from "@/lib/supabase/database.types"
import { createServiceSupabaseClient } from "@/lib/supabase/service-client"
import { CreateBooking } from "@/schemas/booking.schema"

export async function createBooking(booking: CreateBooking) {
  const supabase = createServiceSupabaseClient()

  let venueId: string | null = null

  try {
    // 1. Create venue
    const bookingInsert: Database["public"]["Tables"]["bookings"]["Insert"] = {
      ...(booking as unknown as Database["public"]["Tables"]["bookings"]["Insert"]),
    }

    const { data: venueResult, error: venueError } = await supabase
      .from("bookings")
      .insert(bookingInsert)
      .select()
      .single()

    if (venueError) throw venueError
    venueId = venueResult.id

    return venueId
  } catch (err) {
    console.error("Create venue failed, rolling back...", err)

    throw err
  }
}

export async function updateBooking(id: string, booking: Omit<CreateBooking, "id">) {
  const supabase = createServiceSupabaseClient()

  let venueId: string | null = null

  try {
    // 1. Create venue
    const bookingUpdate: Database["public"]["Tables"]["bookings"]["Update"] = {
      ...(booking as unknown as Database["public"]["Tables"]["bookings"]["Insert"]),
    }

    const { data: venueResult, error: venueError } = await supabase
      .from("bookings")
      .update(bookingUpdate)
      .eq("id", id)
      .select()
      .single()

    if (venueError) throw venueError
    venueId = venueResult.id

    return venueId
  } catch (err) {
    console.error("Create venue failed, rolling back...", err)

    throw err
  }
}

export async function deleteBooking(id: string) {
  const supabase = createServiceSupabaseClient()

  let bookingId: string | null = null

  try {
    // 1. Delete booking
    const { data: bookingResult, error: bookingError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id)
      .select()
      .single()

    if (bookingError) throw bookingError
    bookingId = bookingResult.id

    return bookingId
  } catch (err) {
    console.error("Delete booking failed, rolling back...", err)

    throw err
  }
}
