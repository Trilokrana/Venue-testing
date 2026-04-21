import { NextResponse } from "next/server"
import { createCronofyEvent, refreshCronofyToken, getPrimaryCalendarId } from "@/lib/cronofy/events"
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client"

export async function GET() {
  try {
    const db = getSupabaseAdminClient()
    if (!db) {
      return NextResponse.json({ error: "Missing Supabase admin client (check service role key)" })
    }

    // 1. Get the most recently created booking (the one you just made via SQL)
    const { data: booking, error: bkErr } = await db
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (bkErr || !booking) {
      return NextResponse.json({ error: "Could not find the recent booking.", details: bkErr })
    }

    // 2. Get the owner's Cronofy access token
    const { data: cred, error: credErr } = await db
      .from("cronofy_credentials")
      .select("*")
      .eq("user_id", booking.owner_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    if (credErr || !cred) {
      return NextResponse.json({ error: "Could not find Cronofy credentials for the owner.", details: credErr })
    }

    // Refresh token to prevent 401 Unauthorized if expired
    let accessToken = cred.access_token;
    const expiresAt = cred.expires_at ? new Date(cred.expires_at).getTime() : 0 
    if (expiresAt - Date.now() < 60_000) {
      const fresh = await refreshCronofyToken(cred.refresh_token)
      accessToken = fresh.access_token;
      await db.from("cronofy_credentials").update({
        access_token: fresh.access_token,
        refresh_token: fresh.refresh_token,
        expires_at: new Date(Date.now() + fresh.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }).eq("id", cred.id);
    }

    // 3. Get the Venue's dedicated Calendar ID
    let { data: vCal } = await db.from("venue_calendars").select("cronofy_calendar_id").eq("venue_id", booking.venue_id).single()
    let calendarId = vCal?.cronofy_calendar_id
    
    // If the venue calendar wasn't created properly previously, fallback to their primary calendar
    if (!calendarId) {
      calendarId = await getPrimaryCalendarId(accessToken, "https://api.cronofy.com")
    }

    let eventUidStr = `booking-${booking.id}`
    if (calendarId) {
      eventUidStr = `${eventUidStr}-${calendarId}`
    }

    // 4. Create the event in Cronofy (which pushes to Google Calendar)
    const eventUid = await createCronofyEvent({
      accessToken: accessToken,
      calendarId: calendarId ?? undefined,
      eventUid: eventUidStr,
      summary: `Test Booking Synced!`,
      description: `This booking was synced using the Cronofy Test sync script.`,
      start: { time: booking.start_at, tzid: "UTC" },
      end: { time: booking.end_at, tzid: "UTC" },
    })

    // 5. Update the booking with the new Cronofy Event ID explicitly
    await db
      .from("bookings")
      .update({ cronofy_event_id: eventUid })
      .eq("id", booking.id)

    return NextResponse.json({ 
      success: true, 
      message: "Sync complete! Check your Google Calendar.",
      cronofy_event_id: eventUid,
      used_calendar_id: calendarId
    })
    
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message, stack: err.stack })
  }
}
