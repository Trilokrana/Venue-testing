import { headers } from "next/headers"

/** Canonical public origin for OAuth redirects, webhooks, etc. */
export async function getPublicAppOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (fromEnv) return fromEnv
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "http"
  if (host) return `${proto}://${host}`
  return "http://localhost:3000"
}
