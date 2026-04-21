import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { createElementToken } from "@/lib/cronofy/client"
import { NextResponse } from "next/server"

/**
 * Returns a short-lived Element Token for the Calendar Sync UI element.
 * Requires the user to be logged in and to have at least one cronofy_credentials row (sub).
 * @see https://docs.cronofy.com/developers/ui-elements/authentication/
 */
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: row } = await supabase
    .from("cronofy_credentials")
    .select("sub")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (!row?.sub) {
    return NextResponse.json(
      { error: "No calendar connected. Connect a calendar first." },
      { status: 404 }
    )
  }

  const origin =
    request.headers.get("origin") ??
    request.headers.get("referer")?.replace(/\/[^/]*$/, "") ??
    "http://localhost:3000"

  try {
    const { element_token } = await createElementToken({
      sub: row.sub,
      permissions: ["account_management"],
      origin,
    })
    return NextResponse.json({ token: element_token.token })
  } catch (err) {
    console.error("Element token error", err)
    return NextResponse.json(
      { error: "Failed to create element token" },
      { status: 500 }
    )
  }
}
