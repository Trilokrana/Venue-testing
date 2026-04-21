import { SupabaseClient } from "@supabase/supabase-js"
import { Database } from "../../supabase/database.types"

export async function getUserAccountType(client: SupabaseClient<Database>, userId: string) {
  const result = await client.from("users").select("account_type").eq("id", userId).maybeSingle()

  return result.data?.account_type
}
