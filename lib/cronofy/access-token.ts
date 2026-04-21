import { refreshCronofyToken } from "@/lib/cronofy/events"
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client"
import { createSupabaseServerClient } from "@/lib/supabase/server-client"

/** Valid access token for Cronofy API calls; refreshes and persists when near expiry. */
export async function getValidCronofyAccessTokenForUser(userId: string): Promise<string | null> {
  const admin = getSupabaseAdminClient()
  const db = admin ?? (await createSupabaseServerClient())

  const { data: cred } = await db
    .from("cronofy_credentials")
    .select("access_token, refresh_token, expires_at, sub")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!cred) return null

  const expiresAt = cred.expires_at ? new Date(cred.expires_at).getTime() : 0
  if (expiresAt - Date.now() > 60_000) return cred.access_token

  try {
    const fresh = await refreshCronofyToken(cred.refresh_token)
    const newExpiry = new Date(Date.now() + fresh.expires_in * 1000).toISOString()
    await db
      .from("cronofy_credentials")
      .update({
        access_token: fresh.access_token,
        refresh_token: fresh.refresh_token,
        expires_at: newExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("sub", cred.sub)
    return fresh.access_token
  } catch {
    return null
  }
}
