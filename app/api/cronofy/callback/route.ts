import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client"
import { exchangeCodeForToken } from "@/lib/cronofy/client"
import { getCronofyConfig } from "@/lib/cronofy/config"
import {
  decodeCronofyState,
  type CronofyOAuthStatePayload,
} from "@/lib/cronofy/oauth-state"
import { ensureVenueCronofyCalendarAndChannel } from "@/lib/cronofy/venue-setup"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

const DEFAULT_APP = "/connect-calendar"

/**
 * Token exchange must use the same redirect_uri as the authorize request.
 * After migrating `NEXT_PUBLIC_CRONOFY_REDIRECT_URI` from `/dashboard` to `/api/cronofy/callback`,
 * in-flight OAuth codes may still be for the legacy URI — retry once.
 */
async function exchangeCodeForTokenWithLegacyFallback(
  code: string,
  primaryRedirectUri: string,
  origin: string
) {
  try {
    return await exchangeCodeForToken(code, primaryRedirectUri)
  } catch (err) {
    const legacyDashboard = `${origin}/dashboard`
    if (primaryRedirectUri === legacyDashboard) {
      throw err
    }
    console.warn(
      "[cronofy/callback] token exchange failed for primary redirect_uri; retrying legacy /dashboard"
    )
    return await exchangeCodeForToken(code, legacyDashboard)
  }
}

function postOAuthBase(
  origin: string,
  decoded: CronofyOAuthStatePayload | null
): string {
  if (decoded?.r === "venue-calendar-sync" && decoded.venueId) {
    return `${origin}/venues/${decoded.venueId}/calendar-sync`
  }
  if (decoded?.r === "my-venues") {
    return `${origin}/venues`
  }
  return `${origin}${DEFAULT_APP}`
}

/**
 * Cronofy OAuth callback: exchange code for tokens and store in Supabase.
 * `state` is either a legacy raw user UUID or base64 JSON from `encodeCronofyState` (see oauth-state).
 * Redirect URI must match `NEXT_PUBLIC_CRONOFY_REDIRECT_URI` (e.g. /api/cronofy/callback).
 * @see https://docs.cronofy.com/developers/api/authorization/request-token/
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const stateParam = requestUrl.searchParams.get("state")
  const errorParam = requestUrl.searchParams.get("error")
  const origin = requestUrl.origin
  const loginUrl = `${origin}/login`

  const decodedEarly = stateParam ? decodeCronofyState(stateParam) : null
  const baseForFlow = postOAuthBase(origin, decodedEarly)

  if (errorParam) {
    return NextResponse.redirect(
      `${baseForFlow}?error=${encodeURIComponent(errorParam)}`
    )
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      `${origin}${DEFAULT_APP}?error=${encodeURIComponent("missing_code_or_state")}`
    )
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(
      `${loginUrl}?next=${encodeURIComponent(requestUrl.pathname + requestUrl.search)}`
    )
  }

  const decoded = decodeCronofyState(stateParam)
  if (!decoded || decoded.u !== user.id) {
    return NextResponse.redirect(
      `${origin}${DEFAULT_APP}?error=${encodeURIComponent("invalid_state")}`
    )
  }
  const userId = user.id
  const successBase = postOAuthBase(origin, decoded)

  let redirectUri: string
  try {
    redirectUri = getCronofyConfig().redirectUri
  } catch {
    return NextResponse.redirect(
      `${successBase}?error=${encodeURIComponent("cronofy_not_configured")}`
    )
  }
  if (!redirectUri) {
    return NextResponse.redirect(
      `${successBase}?error=${encodeURIComponent("cronofy_not_configured")}`
    )
  }

  try {
    const tokenData = await exchangeCodeForTokenWithLegacyFallback(
      code,
      redirectUri,
      origin
    )
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

    const row = {
      user_id: userId,
      sub: tokenData.sub,
      account_id: tokenData.account_id ?? null,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt.toISOString(),
      scope: tokenData.scope ?? null,
      updated_at: new Date().toISOString(),
    }

    const admin = getSupabaseAdminClient()
    const db = admin ?? supabase
    const { error } = await db.from("cronofy_credentials").upsert(row, {
      onConflict: "user_id,sub",
    })

    if (error) {
      console.error("Cronofy callback: Supabase upsert error", error.message, error.code, error.details)
      const hint =
        error.message?.includes("relation") || error.code === "42P01"
          ? "run_sql_migration"
          : error.code === "42501"
            ? "add_service_role"
            : "check_logs"
      return NextResponse.redirect(
        `${successBase}?error=${encodeURIComponent("save_failed")}&hint=${hint}`
      )
    }

    // Venue list / cards use `venues.calendar_sync` — was never set after OAuth.
    if (decoded.r === "venue-calendar-sync" && decoded.venueId) {
      const { error: venueErr } = await db
        .from("venues")
        .update({ calendar_sync: "connected" })
        .eq("id", decoded.venueId)
        .eq("owner_id", userId)
      if (venueErr) {
        console.error("[cronofy/callback] venues.calendar_sync update failed", venueErr.message)
      }

      const { data: venueRow } = await db
        .from("venues")
        .select("name")
        .eq("id", decoded.venueId)
        .eq("owner_id", userId)
        .maybeSingle()

      const setup = await ensureVenueCronofyCalendarAndChannel({
        db,
        userId,
        venueId: decoded.venueId,
        venueName: venueRow?.name ?? "Venue",
        appOrigin: origin,
      })
      if (!setup.ok) {
        console.error("[cronofy/callback] ensureVenueCronofyCalendarAndChannel", setup.error)
      }

      revalidatePath("/venues")
      revalidatePath(`/venues/${decoded.venueId}/calendar-sync`)
    } else if (decoded.r === "connect-calendar" || decoded.r === "my-venues") {
      const { error: venuesErr } = await db
        .from("venues")
        .update({ calendar_sync: "connected" })
        .eq("owner_id", userId)
      if (venuesErr) {
        console.error("[cronofy/callback] venues.calendar_sync bulk update failed", venuesErr.message)
      }
      revalidatePath("/venues")
    }

    return NextResponse.redirect(`${successBase}?success=1`)
  } catch (err) {
    console.error("Cronofy callback: token exchange failed", err)
    const message = err instanceof Error ? err.message : "token_exchange_failed"
    return NextResponse.redirect(
      `${successBase}?error=${encodeURIComponent(message)}`
    )
  }
}
