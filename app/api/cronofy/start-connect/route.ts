import { CRONOFY_SCOPE, getCronofyConfig } from "@/lib/cronofy/config"
import { encodeCronofyState } from "@/lib/cronofy/oauth-state"
import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

/**
 * Initiates Cronofy OAuth flow for calendar sync.
 * Usage: /api/cronofy/start-connect?venue_id=xxx&return_to=my-venues
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const venueId = searchParams.get("venue_id")
    const returnTo = searchParams.get("return_to") || "my-venues"

//   console.log("[cronofy/start-connect] venueId:", venueId)

    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

//   console.log("[cronofy/start-connect] user.id:", user?.id)

    if (!user) {
      // console.log("[cronofy/start-connect] No user, redirecting to login")
      return NextResponse.redirect(new URL("/login", request.url))
    }

    if (!venueId) {
      console.log("[cronofy/start-connect] No venueId provided")
      return NextResponse.json({ error: "venue_id is required" }, { status: 400 })
    }

    // Verify user owns the venue
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select("id, owner_id")
      .eq("id", venueId)
      .eq("owner_id", user.id)
      .maybeSingle()

    console.log("[cronofy/start-connect] venue query:", { venue, venueError, venueId, userId: user.id })

    if (!venue) {
      console.log("[cronofy/start-connect] Venue not found or unauthorized")
      return NextResponse.json({ error: "Venue not found or forbidden", debug: { venueId, userId: user.id } }, { status: 403 })
    }

    let config
    try {
      config = getCronofyConfig()
    } catch (error) {
      const message = error instanceof Error ? error.message : "cronofy_not_configured"
      console.error("[cronofy/start-connect] Cronofy config error:", message)
      const target = new URL(`/venues/${venueId}/calendar-sync`, request.url)
      target.searchParams.set("error", "cronofy_not_configured")
      target.searchParams.set("hint", message)
      return NextResponse.redirect(target)
    }

    const state = encodeCronofyState(
      user.id,
      "venue-calendar-sync",
      { venueId }
    )

    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: CRONOFY_SCOPE,
      state,
    })

    const cronofyAuthUrl = `${config.appUrl}/oauth/authorize?${params.toString()}`
    return NextResponse.redirect(cronofyAuthUrl)
  } catch (error) {
    console.error("[cronofy/start-connect] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to initiate Cronofy connection" },
      { status: 500 }
    )
  }
}
