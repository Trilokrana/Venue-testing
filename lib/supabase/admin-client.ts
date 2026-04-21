import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Service role client — bypasses RLS. Use only on the server after verifying the user.
 * Needed for Cronofy OAuth callback saves when user-session + RLS upsert fails.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
