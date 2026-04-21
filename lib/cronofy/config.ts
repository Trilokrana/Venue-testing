/**
 * Cronofy config from env.
 * Data center: us (default), uk, sg, de, ca, au
 * @see https://docs.cronofy.com/developers/data-centers/
 */
const DATA_CENTER_URLS = {
  us: { api: "https://api.cronofy.com", app: "https://app.cronofy.com" },
  uk: { api: "https://api-uk.cronofy.com", app: "https://app-uk.cronofy.com" },
  sg: { api: "https://api-sg.cronofy.com", app: "https://app-sg.cronofy.com" },
  de: { api: "https://api-de.cronofy.com", app: "https://app-de.cronofy.com" },
  ca: { api: "https://api-ca.cronofy.com", app: "https://app-ca.cronofy.com" },
  au: { api: "https://api-au.cronofy.com", app: "https://app-au.cronofy.com" },
} as const

export type CronofyDataCenter = keyof typeof DATA_CENTER_URLS

function env(key: string): string | undefined {
  const value = process.env[key]
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function getCronofyConfig() {
  // Prefer server-only vars in production; keep NEXT_PUBLIC fallback for backward compatibility.
  const clientId = env("CRONOFY_CLIENT_ID") ?? env("NEXT_PUBLIC_CRONOFY_CLIENT_ID")
  const clientSecret =
    env("CRONOFY_CLIENT_SECRET") ?? env("NEXT_PUBLIC_CRONOFY_CLIENT_SECRET")
  const redirectUri = env("CRONOFY_REDIRECT_URI") ?? env("NEXT_PUBLIC_CRONOFY_REDIRECT_URI")
  const center =
    (env("CRONOFY_DATA_CENTER") ?? env("NEXT_PUBLIC_CRONOFY_DATA_CENTER") ?? "us") as
      CronofyDataCenter

  if (!clientId || !clientSecret) {
    throw new Error("Missing CRONOFY_CLIENT_ID or CRONOFY_CLIENT_SECRET")
  }

  if (!redirectUri) {
    throw new Error("Missing CRONOFY_REDIRECT_URI")
  }

  const urls = DATA_CENTER_URLS[center] ?? DATA_CENTER_URLS.us
  return {
    clientId,
    clientSecret,
    redirectUri: redirectUri ?? "",
    dataCenter: center,
    apiUrl: urls.api,
    appUrl: urls.app,
  }
}

/** For Calendar Sync / OAuth: scope for read+write calendar (create/delete events, read). */
export const CRONOFY_SCOPE = "read_write"

/** Client ID + redirect URI + data center for Calendar Sync. Must match Cronofy app region. */
export function getCronofyConnectPublicConfig(): {
  clientId: string
  redirectUri: string
  /** us | uk | sg | de | ca | au — must match where your Cronofy app lives */
  dataCenter: CronofyDataCenter
} | null {
  const clientId = env("NEXT_PUBLIC_CRONOFY_CLIENT_ID") ?? env("CRONOFY_CLIENT_ID")
  const redirectUri =
    env("NEXT_PUBLIC_CRONOFY_REDIRECT_URI") ?? env("CRONOFY_REDIRECT_URI")
  if (!clientId || !redirectUri) return null
  const center = (
    env("NEXT_PUBLIC_CRONOFY_DATA_CENTER") ?? env("CRONOFY_DATA_CENTER") ?? "us"
  ).toLowerCase() as CronofyDataCenter
  const dataCenter = center in DATA_CENTER_URLS ? center : "us"
  return { clientId, redirectUri, dataCenter }
}
