import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function POST(req: Request): Promise<NextResponse> {
  const { accountType, displayName, photoUrl } = await req.json()
  const supabase = await createSupabaseServerClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const updates: {
    account_type?: "venue_owner" | "rentee"
    display_name?: string | null
    photo_url?: string | null
  } = {}

  if (accountType === "venue_owner" || accountType === "rentee") {
    updates.account_type = accountType
  }

  if (displayName !== undefined) {
    const normalizedName = typeof displayName === "string" ? displayName.trim() : ""
    updates.display_name = normalizedName || null
  }

  if (photoUrl !== undefined) {
    updates.photo_url = typeof photoUrl === "string" && photoUrl.trim() ? photoUrl.trim() : null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  const { data: existingProfile } = await supabase
    .from("users")
    .select("id, account_type")
    .eq("id", authUser.id)
    .maybeSingle()

  if (existingProfile) {
    const user = await supabase
      .from("users")
      .update(updates)
      .eq("id", authUser.id)
      .select()
      .single()
    return NextResponse.json(user)
  }

  const user = await supabase
    .from("users")
    .insert({
      id: authUser.id,
      account_type: updates.account_type ?? "rentee",
      display_name: updates.display_name ?? null,
      photo_url: updates.photo_url ?? null,
    })
    .select()
    .single()

  return NextResponse.json(user)
}
