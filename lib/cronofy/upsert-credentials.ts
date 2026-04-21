import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

export type CronofyCredentialRow = Database["public"]["Tables"]["cronofy_credentials"]["Insert"]

/**
 * Supabase unique constraints differ by migration (often `sub` only, sometimes `venue_id`).
 * Try both so OAuth callback saves reliably.
 */
export async function upsertCronofyCredentialsRow(
  db: SupabaseClient,
  row: CronofyCredentialRow
): Promise<{ error: { message: string; code?: string; details?: string } | null }> {
  const strategies = ["venue_id", "sub", "user_id,sub"] as const

  let last: { message: string; code?: string; details?: string } | null = null
  for (const onConflict of strategies) {
    const { error } = await db.from("cronofy_credentials").upsert(row, { onConflict })
    if (!error) return { error: null }
    last = {
      message: error.message,
      code: error.code,
      details: error.details ?? undefined,
    }
    console.warn("[cronofy] upsert attempt failed", { onConflict, ...last })
  }

  return { error: last ?? { message: "upsert_failed" } }
}

// OAuth ke baad jo tokens DB mein save hote hain, unhe ek hi  jagah se upsert (insert ya update) karne ke liye helper.

// ye DB migration differences handle karta hai.
