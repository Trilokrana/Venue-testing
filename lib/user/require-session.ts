import verifyRequiresMfa from "@/hooks/check-requires-mfa"
import type { SupabaseClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
// import configuration from '~/configuration';
import { Database } from "@/lib/supabase/database.types"

/**
 * @name requireSession
 * @description Require a session to be present in the request
 */
async function requireSession(
  client: SupabaseClient<Database>,
  params = {
    verifyFromServer: true,
  }
) {
  const { data, error } = await client.auth.getSession()

  if (!data.session || error) {
    return redirect("/login")
  }

  const requiresMfa = await verifyRequiresMfa(client)

  // If the user requires multi-factor authentication,
  // redirect them to the page where they can verify their identity.
  if (requiresMfa) {
    return redirect("/auth/verify")
  }

  if (params.verifyFromServer) {
    const { data: user, error } = await client.auth.getUser()

    if (!user || error) {
      return redirect("login")
    }
  }

  return data.session
}

export default requireSession
