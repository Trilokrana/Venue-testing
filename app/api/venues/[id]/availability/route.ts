import { getSupabaseAdminClient } from "@/lib/supabase/admin-client"
import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

/**
 * GET /api/venues/{id}/availability?date=YYYY-MM-DD
 *
 * Returns busy intervals that overlap the given UTC calendar day: app bookings, owner blocks,
 * and external events synced from the host’s Cronofy calendar (`is_external` only).
 *
 * Uses the service role when configured so RLS does not hide other guests' bookings.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: venueId } = await params
  if (!venueId?.trim()) {
    return NextResponse.json({ error: "Missing venue id" }, { status: 400 })
  }

  const url = new URL(_req.url)
  const date = url.searchParams.get("date") // "YYYY-MM-DD"

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 })
  }

  const [y, m, d] = date.split("-").map((n) => parseInt(n, 10))
  if (!y || !m || !d) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 })
  }

  const dayStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)).toISOString()
  const dayEndExclusive = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0)).toISOString()

  const admin = getSupabaseAdminClient()
  const supabase = admin ?? (await createSupabaseServerClient())

  const [bookingsRes, blocksRes, externalRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("start_at, end_at")
      .eq("venue_id", venueId)
      .not("status", "in", '("cancelled_by_guest","cancelled_by_owner")')
      .lt("start_at", dayEndExclusive)
      .gt("end_at", dayStart),
    supabase
      .from("venue_blocks")
      .select("start_at, end_at")
      .eq("venue_id", venueId)
      .lt("start_at", dayEndExclusive)
      .gt("end_at", dayStart),
    supabase
      .from("venue_calendar_events")
      .select("start_time, end_time, title, is_external, is_blocked")
      .eq("venue_id", venueId)
      .eq("is_external", true)
      .lt("start_time", dayEndExclusive)
      .gt("end_time", dayStart),
  ])

  if (bookingsRes.error || blocksRes.error || externalRes.error) {
    if (bookingsRes.error) {
      console.error("[availability] bookings error", bookingsRes.error.message)
    }
    if (blocksRes.error) {
      console.error("[availability] blocks error", blocksRes.error.message)
    }
    if (externalRes.error) {
      console.error("[availability] external events error", externalRes.error.message)
    }
    return NextResponse.json(
      { error: "Failed to load availability" },
      { status: 500 }
    )
  }

  type BookedRange = {
    start: string
    end: string
    title: string
    type: "booking" | "block" | "external"
  }

  const bookedRanges: BookedRange[] = [
    ...(bookingsRes.data ?? []).map((b) => ({
      start: b.start_at,
      end: b.end_at,
      title: "Booked",
      type: "booking" as const,
    })),
    ...(blocksRes.data ?? []).map((b) => ({
      start: b.start_at,
      end: b.end_at,
      title: "Blocked",
      type: "block" as const,
    })),
    ...(externalRes.data ?? []).map((e) => ({
      start: e.start_time,
      end: e.end_time,
      title: e.title || "Busy",
      type: "external" as const,
    })),
  ]

  return NextResponse.json({ bookedRanges })
}
