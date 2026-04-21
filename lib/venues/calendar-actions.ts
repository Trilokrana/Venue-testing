"use server"

import { getValidCronofyAccessTokenForUser } from "@/lib/cronofy/access-token"
import createClient from "@/lib/supabase/server-component-client"
import { createCronofyEvent, deleteCronofyEvent } from "@/lib/cronofy/events"
import { revalidatePath } from "next/cache"
import requireSession from "@/lib/user/require-session"

export type BlockData = {
  id: string
  venue_id: string
  start_at: string
  end_at: string
  cronofy_event_id: string | null
}

export async function getVenueCalendar(venueId: string) {
  const supabase = await createClient()

  const [blocksRes, bookingsRes, venueCalRes, venueRes, externalEventsRes] = await Promise.all([
    supabase.from("venue_blocks").select("*").eq("venue_id", venueId),
    supabase
      .from("bookings")
      .select("*")
      .eq("venue_id", venueId)
      .in("status", ["confirmed", "pending"]),
    supabase
      .from("venue_calendars")
      .select("cronofy_calendar_id")
      .eq("venue_id", venueId)
      .maybeSingle(),
    supabase.from("venues").select("calendar_sync").eq("id", venueId).maybeSingle(),
    supabase
      .from("venue_calendar_events")
      .select("id, venue_id, title, start_time, end_time, is_external, is_booking, is_blocked, cronofy_event_id")
      .eq("venue_id", venueId)
      .eq("is_external", true),
  ])

  const hasCronofySync =
    Boolean(venueCalRes.data?.cronofy_calendar_id) || venueRes.data?.calendar_sync === "connected"

  return {
    success: true,
    blocks: blocksRes.data || [],
    bookings: bookingsRes.data || [],
    externalEvents: externalEventsRes.data || [],
    hasCronofySync,
  }
}

export async function createVenueBlock(venueId: string, startAt: string, endAt: string) {
  try {
    const supabase = await createClient()
    const { user } = await requireSession(supabase)
    const ownerId = user.id

    // Insert the block first
    const { data: block, error } = await supabase
      .from("venue_blocks")
      .insert({
        venue_id: venueId,
        owner_id: ownerId,
        start_at: startAt,
        end_at: endAt,
      })
      .select()
      .single()

    if (error || !block) throw new Error("Failed to create block")

    const accessToken = await getValidCronofyAccessTokenForUser(ownerId)
    const { data: vCal } = await supabase
      .from("venue_calendars")
      .select("cronofy_calendar_id")
      .eq("venue_id", venueId)
      .maybeSingle()

    if (accessToken) {
      try {
        let eventUid = `block-${block.id}`
        const calendarId = vCal?.cronofy_calendar_id ?? undefined
        if (calendarId) {
          eventUid = `${eventUid}-${calendarId}`
        }

        const actualUid = await createCronofyEvent({
          accessToken,
          calendarId,
          eventUid,
          summary: "Gig Blocked",
          start: { time: startAt, tzid: "UTC" },
          end: { time: endAt, tzid: "UTC" },
        })

        await supabase
          .from("venue_blocks")
          .update({ cronofy_event_id: actualUid })
          .eq("id", block.id)
      } catch (e) {
        console.error("Cronofy sync failed for block", e)
      }
    }

    revalidatePath(`/venues/${venueId}/calendar`)
    return { success: true, data: block }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create block" }
  }
}

export async function deleteVenueBlock(blockId: string) {
  try {
    const supabase = await createClient()
    const { user } = await requireSession(supabase)

    const { data: block } = await supabase
      .from("venue_blocks")
      .select("*")
      .eq("id", blockId)
      .single()

    if (!block || block.owner_id !== user.id) {
      throw new Error("Not found or unauthorized")
    }

    if (block.cronofy_event_id) {
      const accessToken = await getValidCronofyAccessTokenForUser(user.id)
      const { data: vCal } = await supabase
        .from("venue_calendars")
        .select("cronofy_calendar_id")
        .eq("venue_id", block.venue_id)
        .maybeSingle()

      if (accessToken) {
        try {
          await deleteCronofyEvent({
            accessToken,
            eventUid: block.cronofy_event_id,
            calendarId: vCal?.cronofy_calendar_id ?? undefined,
          })
        } catch (e) {
          console.error("Cronofy delete sync failed for block", e)
        }
      }
    }

    await supabase.from("venue_blocks").delete().eq("id", blockId)

    revalidatePath(`/venues/${block.venue_id}/calendar`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete block" }
  }
}
