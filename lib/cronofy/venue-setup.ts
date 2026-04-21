import type { SupabaseClient } from "@supabase/supabase-js"

import { createVenueCalendar, createWebhookChannel } from "@/lib/cronofy/client"
import { getValidCronofyAccessTokenForUser } from "@/lib/cronofy/access-token"
import { getCronofyPrimaryProfileId } from "@/lib/cronofy/userinfo"

export type EnsureVenueCronofyResult =
  | { ok: true; calendarId: string; channelCreated: boolean }
  | { ok: false; error: string }

/**
 * Per venue: dedicated Cronofy calendar + push channel (webhook → venue_calendar_events).
 * Idempotent — safe to call after OAuth or when user was already connected globally.
 */
export async function ensureVenueCronofyCalendarAndChannel(params: {
  db: SupabaseClient
  userId: string
  venueId: string
  venueName: string
  /** e.g. https://yourapp.com — used for Cronofy channel callback_url */
  appOrigin: string
}): Promise<EnsureVenueCronofyResult> {
  const { db, userId, venueId, venueName, appOrigin } = params

  const accessToken = await getValidCronofyAccessTokenForUser(userId)
  if (!accessToken) {
    return { ok: false, error: "no_cronofy_token" }
  }

  let calendarId: string | undefined
  let calendarName = `Venue — ${venueName}`

  const { data: existingCal } = await db
    .from("venue_calendars")
    .select("cronofy_calendar_id, calendar_name")
    .eq("venue_id", venueId)
    .maybeSingle()

  if (existingCal?.cronofy_calendar_id) {
    calendarId = existingCal.cronofy_calendar_id
    calendarName = existingCal.calendar_name ?? calendarName
  } else {
    const profileId = await getCronofyPrimaryProfileId(accessToken)
    if (!profileId) {
      return { ok: false, error: "no_cronofy_profile" }
    }

    try {
      const created = await createVenueCalendar(accessToken, profileId, venueName)
      calendarId = created.calendar.calendar_id
      calendarName = created.calendar.calendar_name ?? calendarName
    } catch (e) {
      const msg = e instanceof Error ? e.message : "create_calendar_failed"
      console.error("[ensureVenueCronofyCalendarAndChannel] createVenueCalendar", msg)
      return { ok: false, error: msg }
    }

    const { error: calErr } = await db.from("venue_calendars").upsert(
      {
        venue_id: venueId,
        owner_id: userId,
        cronofy_calendar_id: calendarId,
        calendar_name: calendarName,
        provider: "cronofy",
      },
      { onConflict: "venue_id" }
    )

    if (calErr) {
      console.error("[ensureVenueCronofyCalendarAndChannel] venue_calendars upsert", calErr)
      return { ok: false, error: calErr.message }
    }
  }

  const callbackUrl = `${appOrigin.replace(/\/$/, "")}/api/cronofy/webhook`

  const { data: existingCh } = await db
    .from("cronofy_channels")
    .select("channel_id")
    .eq("venue_id", venueId)
    .maybeSingle()

  let channelCreated = false
  if (!existingCh?.channel_id) {
    try {
      const ch = await createWebhookChannel(accessToken, callbackUrl)
      const channelId = ch.channel.channel_id
      await db.from("cronofy_channels").delete().eq("venue_id", venueId)
      const { error: chErr } = await db.from("cronofy_channels").insert({
        owner_id: userId,
        venue_id: venueId,
        channel_id: channelId,
        callback_url: callbackUrl,
      })
      if (chErr) {
        console.error("[ensureVenueCronofyCalendarAndChannel] cronofy_channels insert", chErr)
        return { ok: false, error: chErr.message }
      }
      channelCreated = true
    } catch (e) {
      const msg = e instanceof Error ? e.message : "create_channel_failed"
      console.error("[ensureVenueCronofyCalendarAndChannel] createWebhookChannel", msg)
      return { ok: false, error: msg }
    }
  }

  return { ok: true, calendarId: calendarId!, channelCreated }
}
