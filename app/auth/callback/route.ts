import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`
      )
    }
    // ** LOGIN SUCCESS **
    // Get user AFTER session is created
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const accountType = user.user_metadata?.account_type

      // 🔥 If account_type is missing → set default
      if (!accountType) {
        const defaultRole = "rentee"

        await Promise.all([
          // ✅ Update metadata
          supabase.auth.updateUser({
            data: {
              account_type: defaultRole,
            },
          }),

          // ✅ Sync with your public.users table
          supabase.from("users").upsert({
            id: user.id,
            email: user.email,
            account_type: defaultRole,
          }),
        ])
      }
    }
    // ** LOGIN SUCCESS End Here **
  }

  return NextResponse.redirect(`${requestUrl.origin}${next}`)
}
