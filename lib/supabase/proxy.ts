import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import {
  isPathAllowedForRole,
  isPathInRbacZone,
  isSettingsPathForIncompleteProfile,
  type AccountType,
} from "@/lib/navigation/sidebar-routes"

/** Missing session is normal for anonymous traffic (e.g. webhooks, public pages). */
function isSessionMissingAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const e = error as { name?: string; message?: string }
  return (
    e.name === "AuthSessionMissingError" ||
    (typeof e.message === "string" && e.message.includes("Auth session missing"))
  )
}

/** Paths that should not force a redirect to /login when unauthenticated. */
function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true
  if (pathname.startsWith("/listings")) return true
  if (pathname.startsWith("/request-booking")) return true
  return false
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,

    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null
  let authFailed = false

  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      if (!isSessionMissingAuthError(error)) {
        authFailed = true
        console.error("supabase.auth.getUser error in proxy", error)
      }
    } else {
      user = data?.user ?? null
    }
    if (error && isSessionMissingAuthError(error)) {
      user = data?.user ?? null
    }
  } catch (error) {
    authFailed = true
    console.error("supabase.auth.getUser failed in proxy", error)
  }

  // If auth provider is temporarily unreachable, avoid breaking all requests.
  if (authFailed) {
    return supabaseResponse
  }

  const pathname = request.nextUrl.pathname
  const isApiRoute = pathname.startsWith("/api")

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth")

  const redirectWithCookies = (url: URL) => {
    const res = NextResponse.redirect(url)
    // Preserve any auth cookie updates Supabase made during this request.
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
      res.cookies.set(name, value, options)
    })
    return res
  }

  // If logged in, don't allow visiting login/register pages.
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return redirectWithCookies(url)
  }

  if (!user && !isAuthRoute && !isApiRoute && !isPublicPath(pathname)) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return redirectWithCookies(url)
  }

  // Role-based access from sidebar URLs: only allow navigation into RBAC routes the account may use.
  if (user && !isAuthRoute && isPathInRbacZone(pathname)) {
    let accountType: AccountType | null = null
    try {
      const { data: profile, error } = await supabase
        .from("users")
        .select("account_type")
        .eq("id", user.id)
        .maybeSingle()

      if (error) {
        console.error("users.account_type lookup in proxy", error)
      } else if (profile?.account_type === "venue_owner" || profile?.account_type === "rentee") {
        accountType = profile.account_type
      }
    } catch (e) {
      console.error("users.account_type lookup failed in proxy", e)
    }

    const allowed = accountType
      ? isPathAllowedForRole(pathname, accountType)
      : isSettingsPathForIncompleteProfile(pathname)

    if (!allowed) {
      const url = request.nextUrl.clone()
      url.pathname = accountType ? "/dashboard" : "/settings/profile"
      url.search = ""
      return redirectWithCookies(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
