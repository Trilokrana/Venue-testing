export type CronofyOAuthReturn = "connect-calendar" | "venue-calendar-sync" | "my-venues"

export type CronofyOAuthStatePayload = {
  u: string // Supabse user id
  r: CronofyOAuthReturn // return to the page after OAuth
  n: string
  /** Present when `r === "venue-calendar-sync"` */
  venueId?: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function toBase64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(s: string): Buffer {
  const pad = 4 - (s.length % 4 || 4)
  const b64 = (s + "=".repeat(pad === 4 ? 0 : pad)).replace(/-/g, "+").replace(/_/g, "/")
  return Buffer.from(b64, "base64")
}

function randomNonce(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "")
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

/**
 * Build OAuth `state` for Cronofy (server or client).
 * - `my-venues`: return to /venues after OAuth (banner on My Venues).
 * - `venue-calendar-sync` + venueId: return to that venue’s calendar page.
 */
export function encodeCronofyState(
  userId: string,
  returnTo: CronofyOAuthReturn,
  options?: { venueId?: string }
): string {
  if (returnTo === "venue-calendar-sync") {
    const vid = options?.venueId?.trim()
    if (!vid || !UUID_RE.test(vid)) {
      throw new Error("encodeCronofyState: valid venueId required for venue-calendar-sync")
    }
  }

  const payload: Record<string, string> = {
    u: userId,
    r: returnTo,
    n: randomNonce(),
  }
  if (returnTo === "venue-calendar-sync" && options?.venueId) {
    payload.v = options.venueId
  }

  const json = JSON.stringify(payload)
  if (typeof Buffer !== "undefined") {
    return toBase64Url(Buffer.from(json, "utf8"))
  }
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

/**
 * Parse Cronofy OAuth state. Legacy: raw Supabase user UUID → connect-calendar.
 */
export function decodeCronofyState(state: string): CronofyOAuthStatePayload | null {
  const trimmed = state.trim()
  if (UUID_RE.test(trimmed)) {
    return { u: trimmed, r: "connect-calendar", n: "" }
  }
  try {
    const json = fromBase64Url(trimmed).toString("utf8")
    const o = JSON.parse(json) as Record<string, unknown>
    if (typeof o.u !== "string" || !UUID_RE.test(o.u)) return null

    if (o.r === "venue-calendar-sync" && typeof o.v === "string" && UUID_RE.test(o.v)) {
      return {
        u: o.u,
        r: "venue-calendar-sync",
        venueId: o.v,
        n: typeof o.n === "string" ? o.n : "",
      }
    }

    if (o.r === "my-venues") {
      return { u: o.u, r: "my-venues", n: typeof o.n === "string" ? o.n : "" }
    }

    return { u: o.u, r: "connect-calendar", n: typeof o.n === "string" ? o.n : "" }
  } catch {
    return null
  }
}
