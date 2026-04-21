import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "./lib/supabase/proxy"

/**
 * Cronofy OAuth may still hit a legacy redirect URI (`/dashboard`).
 * Forward to the real callback so the code can be exchanged (same as former middleware).
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  if (pathname === "/dashboard") {
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const oauthError = searchParams.get("error")
    if ((code && state) || oauthError) {
      const target = new URL("/api/cronofy/callback", request.nextUrl.origin)
      searchParams.forEach((value, key) => {
        target.searchParams.set(key, value)
      })
      return NextResponse.redirect(target)
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
