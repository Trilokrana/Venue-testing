import { getCronofyConfig } from "./config"

export type CronofyTokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  sub: string
  account_id: string
  scope: string
  token_type: string
  userinfo?: {
    sub: string
    email?: string
    name?: string
    "cronofy.data"?: {
      profiles?: Array<{
        profile_id: string
        provider_name: string
        profile_name: string
        profile_calendars?: Array<{
          calendar_id: string
          calendar_name: string
          calendar_readonly: boolean
        }>
      }>
    }
  }
}

/**
 * Exchange OAuth authorization code for access + refresh token.
 * @see https://docs.cronofy.com/developers/api/authorization/request-token/
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<CronofyTokenResponse> {
  const { clientId, clientSecret, apiUrl } = getCronofyConfig()

  const res = await fetch(`${apiUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string; error_description?: string }
    throw new Error(err.error_description ?? err.error ?? `Cronofy token error: ${res.status}`)
  }

  return res.json() as Promise<CronofyTokenResponse>
}

export type ElementTokenResponse = {
  element_token: {
    token: string
    expires_in: number
    permissions: string[]
    origin: string
  }
}

/**
 * Create a short-lived Element Token for UI Elements (e.g. Calendar Sync).
 * Use client_secret (API key); origin = app origin where element runs.
 * @see https://docs.cronofy.com/developers/ui-elements/authentication/
 */
export async function createElementToken(params: {
  sub: string
  permissions: string[]
  origin: string
}): Promise<ElementTokenResponse> {
  const { clientId, clientSecret, apiUrl } = getCronofyConfig()

  const res = await fetch(`${apiUrl}/v1/element_tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clientSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "1",
      permissions: params.permissions,
      subs: [params.sub],
      origin: params.origin,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `Element token error: ${res.status}`)
  }

  return res.json() as Promise<ElementTokenResponse>
}

/**
 * Create a new calendar for a specific profile (e.g. for a venue).
 * @see https://docs.cronofy.com/developers/api/calendars/create-calendar/
 */
export async function createVenueCalendar(
  accessToken: string,
  profileId: string,
  venueName: string
): Promise<{ calendar: { calendar_id: string; calendar_name: string } }> {
  const { apiUrl } = getCronofyConfig()

  const res = await fetch(`${apiUrl}/v1/calendars`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      profile_id: profileId,
      name: `Venue - ${venueName}`,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `Create calendar error: ${res.status}`)
  }

  return res.json()
}

/**
 * Configure a webhook channel for a user's calendars or specific ones.
 * @see https://docs.cronofy.com/developers/api/push-notifications/create-a-channel/
 */
export async function createWebhookChannel(
  accessToken: string,
  callbackUrl: string
): Promise<{ channel: { channel_id: string } }> {
  const { apiUrl } = getCronofyConfig()

  const res = await fetch(`${apiUrl}/v1/channels`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      callback_url: callbackUrl,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `Create channel error: ${res.status}`)
  }

  return res.json()
}

