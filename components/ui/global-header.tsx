"use client"

import { ArrowLeft, Menu } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/hooks/use-user"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Listings", href: "/listings" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Connect Calendar", href: "/connect-calendar" },
]

export function GlobalHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { data, isLoading } = useUser()
  const user = data?.user

  // Checkout flow minimal header
  if (pathname?.startsWith("/request-booking")) {
    return (
      <header className="border-b border-primary/20 bg-header text-header-foreground">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 md:px-6 lg:px-8 gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 text-neutral-600 hover:text-neutral-900 border-r border-neutral-200 rounded pr-4"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-display text-xl font-semibold tracking-tight"
          >
            <span className="inline-block size-2.5 rounded-full bg-primary" aria-hidden />
            <span>Venue Compass</span>
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b border-primary/20 bg-header text-header-foreground">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display text-xl font-semibold tracking-tight"
        >
          <span className="inline-block size-2.5 rounded-full bg-primary" aria-hidden />
          <span>Venue Compass</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-primary/10 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {/* <ModeToggle /> */}
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-24" />
            </>
          ) : user ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" size="sm" className="border-primary/25">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Open navigation menu"
                className="border-primary/25"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-l border-primary/20">
              <SheetHeader className="px-5 pt-6">
                <SheetTitle className="font-display text-lg">Navigation</SheetTitle>
                <SheetDescription>Explore listings and manage your account.</SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-2 px-5 pb-4">
                {navLinks.map((link) => (
                  <SheetClose key={link.href} asChild>
                    <Link
                      href={link.href}
                      className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-primary/10 hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </div>

              <div className="mt-auto grid gap-2 px-5 pb-6">
                {isLoading ? (
                  <>
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </>
                ) : user ? (
                  <SheetClose asChild>
                    <Button asChild className="w-full">
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                  </SheetClose>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="w-full border-primary/25">
                        <Link href="/login">Login</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild className="w-full">
                        <Link href="/register">Get Started</Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
