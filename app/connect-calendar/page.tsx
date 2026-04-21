import { getCronofyConnectPublicConfig } from "@/lib/cronofy/config"
import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { redirect } from "next/navigation"
import { CalendarConnectedSuccessPanel } from "./components/CalendarConnectedSuccessPanel"
import { ConnectCalendarClient } from "./components/ConnectCalendarClient"

const CRONOFY_ELEMENTS_SCRIPT = "https://elements.cronofy.com/js/CronofyElements.v1.67.6.js"

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0]
  return v
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ConnectCalendarPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {}
  const freshOAuthSuccess = firstParam(sp.success) === "1"
  const oauthError = firstParam(sp.error) ?? null

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login?next=/connect-calendar")
  }

  const connect = getCronofyConnectPublicConfig()
  if (!connect) {
    return (
      <div className="container max-w-2xl py-12">
        <p className="text-destructive">
          Cronofy not configured. In <code className="rounded bg-muted px-1">.env.local</code> set{" "}
          <code className="rounded bg-muted px-1">CRONOFY_CLIENT_ID</code>,{" "}
          <code className="rounded bg-muted px-1">CRONOFY_CLIENT_SECRET</code>, and{" "}
          <code className="rounded bg-muted px-1">CRONOFY_REDIRECT_URI</code> (e.g.{" "}
          <code className="rounded bg-muted px-1">http://localhost:3000/api/cronofy/callback</code>
          ). Optional for UI pages: <code className="rounded bg-muted px-1">NEXT_PUBLIC_CRONOFY_CLIENT_ID</code>{" "}
          and <code className="rounded bg-muted px-1">NEXT_PUBLIC_CRONOFY_REDIRECT_URI</code>. Restart{" "}
          <code className="rounded bg-muted px-1">npm run dev</code> after saving.
        </p>
      </div>
    )
  }
  const { clientId, redirectUri, dataCenter } = connect

  const { data: existing } = await supabase
    .from("cronofy_credentials")
    .select("sub")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  const connected = Boolean(existing?.sub)

  if (connected && existing?.sub) {
    return (
      <div className="container max-w-4xl py-12">
        <CalendarConnectedSuccessPanel
          freshOAuthSuccess={freshOAuthSuccess}
          oauthError={oauthError}
        />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-12">
      <h1 className="mb-2 text-2xl font-semibold">Connect your calendar</h1>
      <p className="mb-8 text-muted-foreground">
        Link Google, Outlook, Apple, or other calendars so your venue availability stays in sync.
      </p>
      <ConnectCalendarClient
        scriptUrl={CRONOFY_ELEMENTS_SCRIPT}
        dataCenter={dataCenter}
        authorization={{
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: "read_write",
          state: user.id,
        }}
        hasExistingCredentials={false}
      />
    </div>
  )
}
