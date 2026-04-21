"use client"

import {
  Building2,
  CalendarCheck,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Headset,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useUser } from "@/hooks/use-user"
import { type SidebarRouteItem, sidebarRoutesByRole } from "@/lib/navigation/sidebar-routes"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

const navItemIcons: Record<string, React.ElementType> = {
  Dashboard: LayoutDashboard,
  Bookings: CalendarCheck,
  Venues: Building2,
  Settings: Settings,
  Help: CircleHelp,
  Support: Headset,
}

function withNavIcons(items: SidebarRouteItem[]): NavItem[] {
  return items.map((item) => ({
    ...item,
    icon: navItemIcons[item.title],
    isActive: item.title === "Dashboard",
  }))
}

export type NavItem = {
  title: string
  url: string
  icon?: React.ElementType
  isActive?: boolean
  items?: { title: string; url: string }[]
}

function isRouteActive(pathname: string, url: string, options?: { exact?: boolean }) {
  if (url === "/") return pathname === "/"

  if (options?.exact) {
    return pathname === url
  }

  return pathname === url || pathname.startsWith(`${url}/`)
}

function AppSidebarMenuItem({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const { state } = useSidebar()

  const isCollapsed = state === "collapsed"
  const hasChildren = !!item.items?.length

  const isRootActive = isRouteActive(pathname, item.url)
  const isChildActive = item.items?.some((subItem) => isRouteActive(pathname, subItem.url)) ?? false
  const isActive = isRootActive || isChildActive
  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          size="md"
          asChild
          tooltip={item.title}
          isActive={isActive ? true : false}
        >
          <Link href={item.url}>
            {item.icon && isCollapsed ? (
              <item.icon className="text-primary" />
            ) : item.icon ? (
              <div className="bg-background rounded-full p-1.5">
                {" "}
                <item.icon className="text-primary" />
              </div>
            ) : null}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // Collapsed state: show submenu in popup
  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="md" tooltip={item.title} isActive={isActive ? true : false}>
              {item.icon && <item.icon className="text-primary" />}

              <span>{item.title}</span>
              <ChevronRight className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            side="right"
            sideOffset={8}
            className="min-w-56 rounded-lg"
          >
            <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={item.url} className={isRootActive ? "font-semibold" : ""}>
                  <span>Open {item.title}</span>
                </Link>
              </DropdownMenuItem>

              {item.items?.map((subItem) => {
                const activeSubItem = isRouteActive(pathname, subItem.url)

                return (
                  <DropdownMenuItem key={subItem.title} asChild>
                    <Link href={subItem.url} className={activeSubItem ? "font-semibold" : ""}>
                      <span>{subItem.title}</span>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    )
  }

  // Expanded state: normal collapsible sidebar behavior
  return (
    <Collapsible
      defaultOpen={isActive || item.isActive ? true : false}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton size="md" tooltip={item.title} isActive={isActive ? true : false}>
            {item.icon && (
              <div className="bg-background rounded-full p-1.5">
                {" "}
                <item.icon className="text-primary" />
              </div>
            )}
            <span className="font-normal">{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent className="py-2">
          <SidebarMenuSub className="gap-2">
            {item.items?.map((subItem) => {
              const activeSubItem = isRouteActive(pathname, subItem.url, { exact: true })

              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton asChild isActive={activeSubItem}>
                    <Link href={subItem.url}>
                      <span>{subItem.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { state } = useSidebar()
  const isExpanded = state === "expanded"
  const { data: user, isFetching, isLoading, isRefetching } = useUser()
  const isUserLoading = Boolean(isLoading || isFetching || isRefetching)
  const defaulSidebarOptions: NavItem[] =
    user?.userType === "venue_owner"
      ? withNavIcons(sidebarRoutesByRole.venue_owner)
      : user?.userType === "rentee"
        ? withNavIcons(sidebarRoutesByRole.rentee)
        : ([] as NavItem[])
  const [sidebarOptions, setSidebarOptions] = React.useState<NavItem[]>([...defaulSidebarOptions])
  React.useEffect(() => {
    if (user?.userType) {
      setSidebarOptions([...defaulSidebarOptions])
    }
  }, [user?.userType])

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b h-14">
          <div className="flex items-center gap-2 w-full">
            <Image
              src="/images/favicon/android-chrome-512x512.png"
              alt="Logo"
              width={40}
              height={40}
            />
            {isExpanded && <span className="text-sm font-bold text-primary">Venue Compass</span>}
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu className="gap-2">
              {isUserLoading
                ? [0, 1, 2, 3, 4]?.map((skel) => (
                    <div key={skel} className="border border-border/30 rounded-md p-1">
                      <SidebarMenuSkeleton showIcon={true} key={skel} />
                    </div>
                  ))
                : sidebarOptions
                    ?.filter((item) => item.title !== "Support" && item.title !== "Help")
                    ?.map((item) => <AppSidebarMenuItem key={item.title} item={item} />)}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarContent>
            <SidebarGroup className="p-0">
              <SidebarMenu className="gap-2">
                {isUserLoading
                  ? [0, 1, 2]?.map((skel) => <SidebarMenuSkeleton showIcon key={skel} />)
                  : sidebarOptions
                      .filter((item: NavItem) => item.title === "Support" || item.title === "Help")
                      ?.map((item: NavItem) => <AppSidebarMenuItem key={item.title} item={item} />)}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          {isUserLoading ? (
            <div className="border border-border rounded-lg p-1">
              <SidebarMenuSkeleton showIcon />
            </div>
          ) : (
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border"
                    >
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={user?.user?.user_metadata?.avatar_url} alt={"vkjab"} />
                        <AvatarFallback className="rounded-lg">
                          {user?.user?.user_metadata?.first_name?.charAt(0)}
                          {user?.user?.user_metadata?.last_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-normal">
                          {user?.user?.user_metadata?.first_name}{" "}
                          {user?.user?.user_metadata?.last_name}
                        </span>
                        {/* <span className="truncate text-xs">{user?.user?.email}</span> */}
                      </div>
                      <ChevronsUpDown className="ml-auto size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                    side="bottom"
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage
                            src={user?.user?.user_metadata?.avatar_url}
                            alt={
                              user?.user?.user_metadata?.first_name +
                              " " +
                              user?.user?.user_metadata?.last_name
                            }
                          />
                          <AvatarFallback className="rounded-lg">
                            {user?.user?.user_metadata?.first_name?.charAt(0)}
                            {user?.user?.user_metadata?.last_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">
                            {user?.user?.user_metadata?.first_name}{" "}
                            {user?.user?.user_metadata?.last_name}
                          </span>
                          <span className="truncate text-xs">{user?.user?.email}</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    {/* <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <Sparkles />
                        Upgrade to Pro
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator /> */}

                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          await getSupabaseBrowserClient()?.auth.signOut()
                          router.push("/login")
                        } catch (error) {
                          toast.error((error as Error).message)
                          console.error(error)
                        }
                      }}
                    >
                      <LogOut />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {children}
    </>
  )
}
