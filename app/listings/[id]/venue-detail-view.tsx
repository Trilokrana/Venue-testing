"use client"

import {
  ArrowLeft,
  Clock,
  Expand,
  ExternalLink,
  Globe2,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import {
  formatLocationLine,
  formatVenueType,
  normalizeAddress,
  primaryImageUrl,
} from "@/app/listings/data"
import { VenueBookingWidget } from "@/components/listings/venue-booking-widget"
import { VenueDetailGallery } from "@/components/listings/venue-detail-gallery"
import { VenueDetailMap } from "@/components/listings/venue-detail-map"
import { VenuePhotosOverlay } from "@/components/listings/venue-photos-overlay"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { VenueWithRelations } from "@/lib/venues/types"
import { Settings } from "lucide-react"

type Props = {
  venue: VenueWithRelations
  /** True when the logged-in user is this venue's owner. */
  isOwner?: boolean
}

export function VenueDetailView({ venue, isOwner = false }: Props) {
  const [photosOpen, setPhotosOpen] = React.useState(false)
  const addr = normalizeAddress(venue)
  const owner = Array.isArray(venue.owner) ? venue.owner[0] : venue.owner
  const hostName = owner?.display_name?.trim() || "Host"
  const hostInitials = hostName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    || "H"
  const imgs = React.useMemo(() => {
    const list = [...(venue.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    return list.map((im) => ({ id: im.id, url: im.url }))
  }, [venue.images])

  const heroFallback = primaryImageUrl(venue)

  const overlayImages = React.useMemo(() => {
    if (imgs.length > 0) return imgs
    if (heroFallback) return [{ id: "hero-fallback", url: heroFallback }]
    return []
  }, [imgs, heroFallback])

  const galleryImages = React.useMemo(() => {
    if (imgs.length > 0) return imgs
    if (heroFallback) return [{ id: "hero-fallback", url: heroFallback }]
    return []
  }, [imgs, heroFallback])

  const socialLinks = React.useMemo(() => {
    const links = (venue.social_media_links ?? []).filter((u): u is string => Boolean(u?.trim()))
    return links.map((raw) => {
      const trimmed = raw.trim()
      const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
      let label = trimmed
      try {
        const host = new URL(href).hostname.replace(/^www\./i, "")
        label = host || trimmed
      } catch {
        label = trimmed
      }
      return { href, label }
    })
  }, [venue.social_media_links])

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="border-b border-neutral-200 bg-white">
        <div className="w-full px-4 py-3 md:px-6 lg:px-8">
          <Button variant="ghost" size="sm" asChild className="gap-2 text-neutral-600">
            <Link href="/listings">
              <ArrowLeft className="size-4" />
              Back to listings
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-8 md:px-6 md:pt-6 md:pb-12">
        <VenueDetailGallery images={galleryImages} onShowAll={() => setPhotosOpen(true)} />

        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              aria-label="Venue type"
              className="rounded-full border border-neutral-300 bg-neutral-100 px-4 py-4 text-sm font-medium text-neutral-800"
            >
              {formatVenueType(venue.venue_type)}
            </Badge>
            {venue.instabook ? (
              <Badge className="gap-1 rounded-full border-0 bg-primary px-4 py-4 text-sm font-medium text-primary-foreground">
                <Zap className="size-3" />
                Instant book
              </Badge>
            ) : null}
          </div>
          <h1 className="wrap-break-word text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">{venue.name}</h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-neutral-600">
            {venue.rating != null ? (
              <span className="font-medium text-neutral-900">★ {venue.rating}</span>
            ) : (
              <span className="text-neutral-500">New listing</span>
            )}
            <span className="inline-flex items-center gap-1 ">
              <MapPin className="size-5 shrink-0" />
              {formatLocationLine(addr)}
            </span>
          </div>
          <div className="border-y border-neutral-200 py-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white">
                  <Clock className="size-5 text-neutral-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-neutral-500">Min booking length</p>
                  <p className="text-xl font-bold text-neutral-900">
                    {venue.min_hours != null ? `${venue.min_hours} hr minimum` : "Ask host"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white">
                  <Users className="size-5 text-neutral-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-neutral-500">Cast & Crew</p>
                  <p className="text-xl font-bold text-neutral-900">
                    {venue.capacity != null
                      ? `${venue.capacity.toLocaleString()} people`
                      : "Ask host"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white">
                  <Expand className="size-5 text-neutral-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-neutral-500">Square footage</p>
                  <p className="text-xl font-bold text-neutral-900">
                    {venue.square_footage != null
                      ? `${venue.square_footage.toLocaleString()} sq/ft`
                      : "Ask host"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col-reverse gap-8 lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-10">
          <div className="min-w-0 space-y-8">
            <Card className="rounded-2xl border-neutral-200 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Sparkles className="size-5 text-amber-500" />
                  About this space
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-neutral-600">
                {venue.description ? (
                  <p>{venue.description}</p>
                ) : (
                  <p className="text-neutral-400">The host has not added a description yet.</p>
                )}
              </CardContent>
            </Card>

            {venue.amenities?.length ? (
              <Card className="rounded-2xl border-neutral-200 bg-white shadow-sm">
                <CardHeader className="">
                  <CardTitle className="text-lg font-semibold">Amenities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-wrap gap-2">
                    {venue.amenities.map((a) => (
                      <li key={a}>
                        <Badge
                          variant="secondary"
                          className="rounded-full p-3 font-normal capitalize text-neutral-800"
                        >
                          {a.replace(/_/g, " ")}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                      <Clock className="size-4 text-neutral-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-md font-semibold text-neutral-900">Hours</p>
                      <p className="mt-0.5 text-sm leading-snug text-neutral-900">
                        {venue.hours_of_operation ?? "Ask the host"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 border-t border-neutral-100 pt-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                      <ShieldCheck className="size-4 text-neutral-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-md font-semibold text-neutral-900">Cancellation</p>
                      <p className="mt-0.5 text-sm leading-snug text-neutral-900">
                        {venue.cancellation_policy ?? "Ask the host"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Avatar className="size-14 border-2 border-white shadow-md ring-2 ring-neutral-100">
                      <AvatarImage src={owner?.photo_url ?? undefined} alt={hostName} />
                      <AvatarFallback className="bg-neutral-100 text-sm font-bold text-neutral-700">
                        {hostInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-neutral-900">
                      Your Host
                    </p>
                    <p className="text-[13px] truncate text-base font-semibold text-neutral-900 ">{hostName}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2">
                    <Star className="size-3.5 fill-neutral-400 text-neutral-400" />
                    <div>
                      <p className="text-[10px] font-medium text-neutral-400">Rating</p>
                      <p className="text-xs font-bold text-neutral-800">Excellent</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2">
                    <MessageCircle className="size-3.5 text-neutral-400" />
                    <div>
                      <p className="text-[10px] font-medium text-neutral-400">Response</p>
                      <p className="text-xs font-bold text-neutral-800">Within a day</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {socialLinks.length > 0 ? (
              <Card className="rounded-2xl border-neutral-200 bg-white shadow-sm">
                <CardHeader className="px-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Globe2 className="size-5" />
                    Social Media
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pt-0 pb-2">
                  <ul className="space-y-1">
                    {socialLinks.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-primary underline-offset-2  hover:underline"
                        >
                          {link.label}
                          <ExternalLink className="size-3.5" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {addr?.lat != null && addr?.lng != null ? (
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <h2 className="border-b border-neutral-100 px-4 py-3 text-base font-semibold text-neutral-900">
                  Location
                </h2>
                <VenueDetailMap
                  lat={addr.lat}
                  lng={addr.lng}
                  title={venue.name}
                  className="rounded-none border-0 border-t-0 shadow-none"
                />
              </div>
            ) : null}
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            {isOwner ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground">This is your venue</p>
                <p className="text-sm text-muted-foreground">
                  You can manage settings, connect your calendar, and view incoming bookings.
                </p>
                <div className="flex flex-col gap-2">
                  <Button asChild className="w-full">
                    <Link href={`/venues/${venue.id}/calendar-sync`}>
                      <Settings className="mr-2 size-4" />
                      Manage calendar sync
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/bookings">View bookings</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <VenueBookingWidget
                  venueId={venue.id}
                  hourlyRate={venue.hourly_rate}
                  minHours={venue.min_hours}
                  capacity={venue.capacity}
                  className="rounded-2xl"
                />
                {venue.phone?.[0] ? (
                  <Button
                    className="mt-4 w-full gap-2 rounded-2xl border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
                    variant="outline"
                    asChild
                  >
                    <a href={`tel:${venue.phone[0]}`}>
                      <Phone className="size-4" />
                      Call {venue.phone[0]}
                    </a>
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <VenuePhotosOverlay
        open={photosOpen}
        onClose={() => setPhotosOpen(false)}
        images={overlayImages}
      />
    </div>
  )
}
