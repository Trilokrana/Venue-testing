/**
 * URL-only sidebar config shared by the app shell and middleware RBAC.
 * Keep in sync with role capabilities: venue owners get venue management; renters do not.
 */
export type SidebarRouteItem = {
  title: string
  url: string
  items?: { title: string; url: string }[]
}

export type AccountType = "venue_owner" | "rentee"

export const sidebarRoutesByRole: Record<AccountType, SidebarRouteItem[]> = {
  venue_owner: [
    { title: "Dashboard", url: "/dashboard", items: [] },
    { title: "Bookings", url: "/bookings", items: [] },
    {
      title: "Venues",
      url: "/venues",
      items: [
        { title: "Create Venue", url: "/venues/create" },
        { title: "My Venues", url: "/venues" },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      items: [
        { title: "General", url: "/settings/profile" },
        { title: "Account", url: "/settings/account" },
      ],
    },
    { title: "Help", url: "/help", items: [] },
    { title: "Support", url: "/support", items: [] },
  ],
  rentee: [
    { title: "Dashboard", url: "/dashboard", items: [] },
    { title: "Bookings", url: "/bookings", items: [] },
    {
      title: "Settings",
      url: "/settings",
      items: [
        { title: "General", url: "/settings/profile" },
        { title: "Account", url: "/settings/account" },
      ],
    },
    { title: "Help", url: "/help", items: [] },
    { title: "Support", url: "/support", items: [] },
  ],
}

function collectPrefixesForRole(role: AccountType): string[] {
  const items = sidebarRoutesByRole[role]
  const out = new Set<string>()
  for (const item of items) {
    out.add(item.url)
    for (const sub of item.items ?? []) {
      out.add(sub.url)
    }
  }
  return [...out]
}

/** Every path prefix that appears in at least one role’s sidebar (used to decide when RBAC applies). */
const allRbacPrefixes: string[] = (() => {
  const s = new Set<string>()
  for (const role of Object.keys(sidebarRoutesByRole) as AccountType[]) {
    for (const p of collectPrefixesForRole(role)) {
      s.add(p)
    }
  }
  return [...s].sort((a, b) => b.length - a.length)
})()

/**
 * True if this pathname is “owned” by the sidebar RBAC rules (any role).
 * Paths outside this set are left to existing auth behavior (e.g. listings, home).
 */
export function isPathInRbacZone(pathname: string): boolean {
  return allRbacPrefixes.some(
    (prefix) => pathname === prefix || (prefix !== "/" && pathname.startsWith(`${prefix}/`))
  )
}

/** Whether pathname is allowed for the given account type (prefix match, same rules as sidebar active state). */
export function isPathAllowedForRole(pathname: string, role: AccountType | null): boolean {
  if (!role) return false

  const allowed = collectPrefixesForRole(role)

  return allowed.some((route) => {
    // ✅ 1. Exact match
    if (pathname === route) return true

    // ✅ 2. Dynamic route support (e.g. /venues/:id)
    // Only allow if route is meant to be a "base dynamic route"
    const isDynamicBase = route.split("/").length === 2 && route !== "/settings"

    if (isDynamicBase && pathname.startsWith(route + "/")) {
      return true
    }

    return false
  })
}

/** Lets signed-in users without `account_type` open settings only (avoid RBAC redirect loops). */
export function isSettingsPathForIncompleteProfile(pathname: string): boolean {
  return pathname === "/settings" || pathname.startsWith("/settings/")
}
