import { getCronofyConfig } from "./config"

export type CronofyEventTime = {
  time: string // ISO 8601 e.g. "2026-04-10T14:00:00Z"
  tzid: string // e.g. "UTC" or "America/New_York"
}

export type CreateCronofyEventParams = {
  accessToken: string
  eventUid: string // unique id — we use "booking-{bookingId}"
  summary: string // event title shown in calendar
  description?: string
  start: CronofyEventTime
  end: CronofyEventTime
  locationDescription?: string
  calendarId?: string // optional explicit calendar target
}

/**
 * Get the explicit primary calendar ID for an account.
 */
export async function getPrimaryCalendarId(accessToken: string, apiUrl: string): Promise<string> {
  const res = await fetch(`${apiUrl}/v1/calendars`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) throw new Error(`Failed to fetch calendars: ${res.status}`)

  const data = (await res.json()) as {
    calendars: { calendar_id: string; calendar_primary: boolean }[]
  }
  const primary = data.calendars.find((c) => c.calendar_primary)
  if (!primary) throw new Error("No primary calendar found for the account.")

  return primary.calendar_id
}

/**
 * Push a managed event to a specific Cronofy calendar.
 * Returns the event_uid on success, throws on failure.
 * @see https://docs.cronofy.com/developers/api/events/upsert-event/
 */
export async function createCronofyEvent(params: CreateCronofyEventParams): Promise<string> {
  const { apiUrl } = getCronofyConfig()

  let targetCalendarId = params.calendarId
  if (!targetCalendarId) {
    targetCalendarId = await getPrimaryCalendarId(params.accessToken, apiUrl)
  }

  const body: Record<string, unknown> = {
    event_id: params.eventUid,
    summary: params.summary,
    start: params.start,
    end: params.end,
    check_conflicts: true,
  }
  if (params.description) body.description = params.description
  if (params.locationDescription) body.location = { description: params.locationDescription }

  const res = await fetch(`${apiUrl}/v1/calendars/${targetCalendarId}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as any
    throw new Error(
      err.message ??
        err.error ??
        `Cronofy create event failed: ${res.status}. Details: ${JSON.stringify(err)}`
    )
  }
  return params.eventUid
}

/**
 * Delete a managed event from the owner's Cronofy calendar.
 * Safe to call even if the event doesn't exist (404 is ignored).
 * @see https://docs.cronofy.com/developers/api/events/delete-event/
 */
export async function deleteCronofyEvent(params: {
  accessToken: string
  eventUid: string
  calendarId?: string
}): Promise<void> {
  const { apiUrl } = getCronofyConfig()

  let targetCalendarId = params.calendarId
  if (!targetCalendarId) {
    // Attempt to extract calendarId if eventUid is formatted like "booking-{bookingId}-{calendarId}"
    // or fallback to getPrimaryCalendarId (might be slow for delete but safe)
    if (params.eventUid.split("-").length > 2) {
      targetCalendarId = params.eventUid.split("-").pop()
    }
  }

  if (!targetCalendarId) {
    targetCalendarId = await getPrimaryCalendarId(params.accessToken, apiUrl)
  }

  const res = await fetch(`${apiUrl}/v1/calendars/${targetCalendarId}/events`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ event_id: params.eventUid }),
  })

  if (!res.ok && res.status !== 404) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `Cronofy delete event failed: ${res.status}`)
  }
}

/**
 * Refresh a Cronofy access token using the stored refresh_token.
 * @see https://docs.cronofy.com/developers/api/authorization/refresh-token/
 */
export async function refreshCronofyToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const { clientId, clientSecret, apiUrl } = getCronofyConfig()

  const res = await fetch(`${apiUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error ?? `Cronofy token refresh failed: ${res.status}`)
  }

  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>
}
