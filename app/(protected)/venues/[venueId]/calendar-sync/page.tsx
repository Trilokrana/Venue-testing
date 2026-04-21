import { CalendarConnectedSuccessPanel } from "@/app/connect-calendar/components/CalendarConnectedSuccessPanel"
import { ConnectCalendarClient } from "@/app/connect-calendar/components/ConnectCalendarClient"
import { CRONOFY_SCOPE, getCronofyConnectPublicConfig } from "@/lib/cronofy/config"
import { encodeCronofyState } from "@/lib/cronofy/oauth-state"
import { getPublicAppOrigin } from "@/lib/site-origin"
import { ensureVenueCronofyCalendarAndChannel } from "@/lib/cronofy/venue-setup"
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client"
import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import Link from "next/link"
import { redirect } from "next/navigation"

const CRONOFY_ELEMENTS_SCRIPT = "https://elements.cronofy.com/js/CronofyElements.v1.67.6.js"

type Props = {
  params: Promise<{ venueId: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

/**
 * Per-venue calendar connection (Giggster-style `/list/{id}/edit/calendar-sync`).
 * OAuth always returns to this URL — no multi-step form redirect issues.
 */
export default async function VenueCalendarSyncPage({ params, searchParams }: Props) {
  const { venueId } = await params
  const sp = (await searchParams) ?? {}
  const freshOAuthSuccess = firstParam(sp.success) === "1"
  const oauthError = firstParam(sp.error) ?? null

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/venues/${venueId}/calendar-sync`)}`)
  }

  const { data: venue } = await supabase
    .from("venues")
    .select("id, name")
    .eq("id", venueId)
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!venue) {
    redirect("/venues")
  }

  const connect = getCronofyConnectPublicConfig()
  if (!connect) {
    return (
      <div className="container max-w-2xl py-10">
        <p className="text-destructive text-sm">
          Cronofy is not configured. Set{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_CRONOFY_CLIENT_ID</code> and{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_CRONOFY_REDIRECT_URI</code> in your env.
        </p>
        <Link href="/venues" className="mt-4 inline-block text-sm text-primary underline">
          Back to venues
        </Link>
      </div>
    )
  }

  const { data: existing } = await supabase
    .from("cronofy_credentials")
    .select("sub")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const connected = Boolean(existing?.sub)

  const breadcrumbs = (
    <nav className="mb-6 text-base text-muted-foreground">
      <Link href="/venues" className="font-medium text-foreground hover:underline">
        Venues
      </Link>
      <span className="mx-2 text-muted-foreground/80">/</span>
      <span className="font-medium text-foreground">{venue.name}</span>
      <span className="mx-2 text-muted-foreground/80">/</span>
      <span className="text-muted-foreground">Calendar sync</span>
    </nav>
  )

  const backLink = (
    <Link
      href="/venues"
      className="mt-10 inline-flex text-sm font-medium text-primary hover:underline"
    >
      ← Back to my venues
    </Link>
  )

  /** Connected: no Cronofy Elements widget — fast load, success-focused UI only */
  if (connected) {
    const { data: venueCal } = await supabase
      .from("venue_calendars")
      .select("cronofy_calendar_id")
      .eq("venue_id", venue.id)
      .maybeSingle()

    if (!venueCal?.cronofy_calendar_id) {
      const appOrigin = await getPublicAppOrigin()
      const db = getSupabaseAdminClient() ?? supabase
      const setup = await ensureVenueCronofyCalendarAndChannel({
        db,
        userId: user.id,
        venueId: venue.id,
        venueName: venue.name,
        appOrigin,
      })
      if (!setup.ok) {
        console.error("[calendar-sync] ensureVenueCronofyCalendarAndChannel", setup.error)
      }
    }

    return (
      <div className="container max-w-3xl -mt-2 pb-10 pt-0 md:-mt-3">
        <CalendarConnectedSuccessPanel
          breadcrumb={breadcrumbs}
          venueId={venue.id}
          venueName={venue.name}
          freshOAuthSuccess={freshOAuthSuccess}
          oauthError={oauthError}
        />
        {backLink}
      </div>
    )
  }

  let oauthState: string
  try {
    oauthState = encodeCronofyState(user.id, "venue-calendar-sync", { venueId: venue.id })
  } catch {
    redirect("/venues")
  }

  return (
    <div className="container max-w-3xl -mt-2 pb-10 pt-0 md:-mt-3">
      <div className="-mt-4 mb-6 md:-mt-5">{breadcrumbs}</div>

      <h1 className="text-2xl font-semibold tracking-tight">Connect your calendar</h1>
      <p className="mt-2 text-muted-foreground leading-relaxed">
        Link Google, Outlook, Apple, or another provider so booking availability reflects your real
        calendar. This applies to your account; we return you here after you authorize Cronofy.
      </p>

      <div className="mt-8 rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Listing:</span> {venue.name}
        </p>
      </div>

      <div className="mt-8">
        <ConnectCalendarClient
          scriptUrl={CRONOFY_ELEMENTS_SCRIPT}
          dataCenter={connect.dataCenter}
          authorization={{
            client_id: connect.clientId,
            redirect_uri: connect.redirectUri,
            scope: CRONOFY_SCOPE,
            state: oauthState,
          }}
          hasExistingCredentials={false}
        />
      </div>

      {backLink}
    </div>
  )
}
