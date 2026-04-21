import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"
export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({
      user: null,
      userType: null,
    })
  }

  const { data: profile } = await supabase
    .from("users")
    .select("account_type")
    .eq("id", user.id)
    .single()

  return NextResponse.json({
    user,
    userType: profile?.account_type ?? null,
  })
}
