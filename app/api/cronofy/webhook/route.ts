import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client"
import { refreshCronofyToken } from "@/lib/cronofy/events"
import { getCronofyConfig } from "@/lib/cronofy/config"

type CronofyWebhookPayload = {
  notification?: { type?: string; changes_since?: string }
  notifications?: Array<{ type?: string; changes_since?: string }>
  channel?: { channel_id?: string }
  channel_id?: string
}

function firstNotificationType(payload: CronofyWebhookPayload): string | null {
  return payload.notification?.type ?? payload.notifications?.[0]?.type ?? null
}

function extractChannelId(payload: CronofyWebhookPayload): string | null {
  return payload.channel?.channel_id ?? payload.channel_id ?? null
}

function toIsoDateTime(value: unknown): string | null {
  if (typeof value === "string") {
    const ts = Date.parse(value)
    return Number.isNaN(ts) ? null : new Date(ts).toISOString()
  }

  if (value && typeof value === "object") {
    const obj = value as { time?: unknown; date?: unknown }
    if (typeof obj.time === "string") {
      const ts = Date.parse(obj.time)
      return Number.isNaN(ts) ? null : new Date(ts).toISOString()
    }
    if (typeof obj.date === "string") {
      const ts = Date.parse(`${obj.date}T00:00:00Z`)
      return Number.isNaN(ts) ? null : new Date(ts).toISOString()
    }
  }

  return null
}

async function getValidAccessToken(db: any, userId: string) {
  const { data: cred } = await db
    .from("cronofy_credentials")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!cred) return null

  const expiresAt = cred.expires_at ? new Date(cred.expires_at).getTime() : 0
  if (expiresAt - Date.now() > 60_000) return cred.access_token

  try {
    const fresh = await refreshCronofyToken(cred.refresh_token)
    await db
      .from("cronofy_credentials")
      .update({
        access_token: fresh.access_token,
        refresh_token: fresh.refresh_token,
        expires_at: new Date(Date.now() + fresh.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("sub", cred.sub)
    return fresh.access_token
  } catch (e) {
    console.error("Token refresh failed in webhook:", e)
    return null
  }
}

/**
 * Build venue_calendar_events rows from Cronofy events for a given venue.
 */
function buildEventRows(venueId: string, events: any[]) {
  return events
    .filter((e: any) => !e.deleted)
    .map((e: any) => {
      const startTime = toIsoDateTime(e.start)
      const endTime = toIsoDateTime(e.end)
      if (!startTime || !endTime) return null

      const eventId = typeof e.event_id === "string" ? e.event_id : ""
      const isBooking = eventId.startsWith("booking-")
      const isBlocked = eventId.startsWith("block-")

      return {
        venue_id: venueId,
        cronofy_event_id: e.event_uid ?? null,
        event_uid: e.event_uid ?? null,
        title: e.summary || "Busy",
        start_time: startTime,
        end_time: endTime,
        is_external: !isBooking && !isBlocked,
        is_booking: isBooking,
        is_blocked: isBlocked,
        raw_data: e,
      }
    })
    .filter(Boolean)
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as CronofyWebhookPayload
    console.log("Cronofy webhook received:", JSON.stringify(payload, null, 2))

    const notificationType = firstNotificationType(payload)
    const channelId = extractChannelId(payload)

    if (notificationType === "verification") {
      console.log("Cronofy channel verification acknowledged:", channelId)
      return new NextResponse("OK", { status: 200 })
    }

    if (notificationType !== "change" || !channelId) {
      return new NextResponse("Ignored", { status: 200 })
    }

    const db = getSupabaseAdminClient()
    if (!db) {
      return new NextResponse("No DB", { status: 500 })
    }

    // 1. Find ALL venues associated with this channel (Cronofy may
    //    de-duplicate channels with the same callback_url + filters,
    //    so multiple venues can share one channel_id).
    const { data: channelRows } = await db
      .from("cronofy_channels")
      .select("venue_id, owner_id")
      .eq("channel_id", channelId)

    if (!channelRows || channelRows.length === 0) {
      return new NextResponse("Channel unknown", { status: 200 })
    }

    const ownerId = channelRows[0].owner_id as string | null
    if (!ownerId) {
      return new NextResponse("No owner", { status: 200 })
    }

    // 2. Gather ALL connected venues for this owner so external Google
    //    Calendar events (maintenance, personal busy, etc.) block every
    //    venue, not just the one whose channel fired.
    const { data: allOwnerVenueCalendars } = await db
      .from("venue_calendars")
      .select("venue_id, cronofy_calendar_id")
      .eq("owner_id", ownerId)

    if (!allOwnerVenueCalendars || allOwnerVenueCalendars.length === 0) {
      return new NextResponse("No venue calendars", { status: 200 })
    }

    const venueIds = allOwnerVenueCalendars.map((vc) => vc.venue_id).filter(Boolean) as string[]

    // 3. Get valid token
    const token = await getValidAccessToken(db, ownerId)
    if (!token) return new NextResponse("Token error", { status: 200 })

    // 4. Fetch events from ALL connected account calendars.
    //    Cronofy Read Events limits: `from` within the last 42 days, `to` at most 201 days
    //    ahead (see https://docs.cronofy.com/developers/api/events/read-events/).
    //    No calendar_ids filter — personal Google events also block venue availability.
    const { apiUrl } = getCronofyConfig()
    const fromDate = new Date()
    fromDate.setUTCDate(fromDate.getUTCDate() - 42)
    fromDate.setUTCHours(0, 0, 0, 0)
    const toDate = new Date()
    toDate.setUTCDate(toDate.getUTCDate() + 201)
    toDate.setUTCHours(0, 0, 0, 0)

    const url = new URL(`${apiUrl}/v1/events`)
    url.searchParams.set("tzid", "UTC")
    url.searchParams.set("from", fromDate.toISOString().split("T")[0])
    url.searchParams.set("to", toDate.toISOString().split("T")[0])
    url.searchParams.set("include_deleted", "true")
    url.searchParams.set("include_managed", "true")

    const eventsRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!eventsRes.ok) {
      console.error("Failed to fetch events from Cronofy", await eventsRes.text())
      return new NextResponse("Fetch failed", { status: 500 })
    }

    const { events } = await eventsRes.json()

    // 5. Sync events to EVERY connected venue for this owner.
    //    Each venue gets the full set of events — external events from
    //    the owner's personal calendar appear as busy on all venues.
    let totalInserted = 0
    for (const venueId of venueIds) {
      await db.from("venue_calendar_events").delete().eq("venue_id", venueId)

      const inserts = buildEventRows(venueId, events as any[])
      if (inserts.length > 0) {
        const { error: insErr } = await db
          .from("venue_calendar_events")
          .insert(inserts)
        if (insErr) console.error("Error inserting events for venue", venueId, insErr)
        totalInserted += inserts.length
      }
    }

    console.log("Cronofy webhook synced events", {
      ownerId,
      channelId,
      venueCount: venueIds.length,
      venueIds,
      totalFetched: Array.isArray(events) ? events.length : 0,
      totalInserted,
    })

    return new NextResponse("OK", { status: 200 })
  } catch (err) {
    console.error("Cronofy webhook error:", err)
    return new NextResponse("Error", { status: 500 })
  }
}