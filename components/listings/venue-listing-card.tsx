"use client"

import {
  formatLocationLine,
  formatShortLocation,
  normalizeAddress,
  primaryImageUrl,
} from "@/app/listings/data"
import { cn } from "@/lib/utils"
import type { VenueWithRelations } from "@/lib/venues/types"
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Star, Store, Zap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"

type Props = {
  venue: VenueWithRelations
  className?: string
  /**
   * True only in owner's /venues page.
   * Shows "Calendar connected" or "Calendar sync" link.
   * Must be false/undefined for public /listings cards.
   */
  isOwnerView?: boolean
  ownerCalendarLinked?: boolean
}

export function VenueListingCard({
  venue,
  className,
  isOwnerView = false,
  ownerCalendarLinked = false,
}: Props) {
  const [activeImageIndex, setActiveImageIndex] = React.useState(0)
  const addr = normalizeAddress(venue)
  const sortedImages = React.useMemo(() => {
    const list = venue.images ?? []
    return [...list].sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
      return a.sort_order - b.sort_order
    })
  }, [venue.images])
  const fallbackImage = primaryImageUrl(venue)
  const previewImages = React.useMemo(() => {
    if (sortedImages.length > 0) {
      return sortedImages.map((im) => ({ id: im.id, url: im.url }))
    }
    if (fallbackImage) {
      return [{ id: "fallback", url: fallbackImage }]
    }
    return []
  }, [sortedImages, fallbackImage])

  React.useEffect(() => {
    setActiveImageIndex(0)
  }, [venue.id])

  const title = venue.name
  const subtitle = formatShortLocation(addr) || formatLocationLine(addr)
  const currentIndex = React.useMemo(() => {
    if (previewImages.length === 0) return 0
    return activeImageIndex % previewImages.length
  }, [activeImageIndex, previewImages.length])

  const canSlide = previewImages.length > 1

  const goPrev = React.useCallback(() => {
    if (!canSlide) return
    setActiveImageIndex((prev) => (prev - 1 + previewImages.length) % previewImages.length)
  }, [canSlide, previewImages.length])

  const goNext = React.useCallback(() => {
    if (!canSlide) return
    setActiveImageIndex((prev) => (prev + 1) % previewImages.length)
  }, [canSlide, previewImages.length])

  const priceLine =
    venue.hourly_rate != null ? `$${venue.hourly_rate.toLocaleString()} USD/hr` : "Request pricing"
  const responseLine = "Responds within a few hours"
  const calendarOk = venue.calendar_sync === "connected"

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-sm border p-2 text-base transition-shadow",
        className
      )}
    >
      <Link href={`/listings/${venue.id}`} className="group flex h-full flex-col">
        <div className="relative h-[140px] sm:h-[180px] md:h-[200px] overflow-hidden rounded">
          {previewImages.length > 0 ? (
            <div
              className="flex h-full w-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {previewImages.map((im) => (
                <div key={im.id} className="relative h-full w-full shrink-0 overflow-hidden">
                  <Image
                    src={im.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="relative h-full w-full overflow-hidden">
              <Image
                src="/venue-placeholder.svg"
                alt="No image available"
                fill
                className="bg-neutral-100 object-contain p-6"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            </div>
          )}

          {canSlide ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  goPrev()
                }}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-xl bg-black/35 p-2 text-white transition-colors hover:bg-black/50"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  goNext()
                }}
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-xl bg-black/35 p-2 text-white transition-colors hover:bg-black/50"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col justify-between space-y-1.5 px-2 pt-2.5 pb-1">
          <h2 className="line-clamp-1 text-sm sm:text-base md:text-[clamp(1.125rem,1vw,1.6rem)] leading-tight font-semibold tracking-tight text-neutral-900">
            <span className="inline-flex items-center gap-1.5">
              <Store className="size-[0.9em] md:size-[1em] text-neutral-700" />
              <span className="line-clamp-1">{title}</span>
            </span>
          </h2>

          <div className="flex flex-wrap items-center gap-x-1 sm:gap-x-2 text-xs sm:text-sm md:text-[clamp(0.80rem,0.82vw,1.02rem)] leading-snug text-neutral-900">
            {venue.rating != null ? (
              <>
                <span className="inline-flex items-center gap-1 font-medium text-neutral-900">
                  <Star className="size-[0.9em] md:size-[0.95em] fill-green-600 text-green-600" />
                  {venue.rating.toFixed(2)}
                </span>
                <span>({Math.max(1, Math.round(venue.rating * 57))})</span>
              </>
            ) : (
              <span className="text-neutral-600">New listing</span>
            )}
            {venue.instabook ? (
              <>
                <span aria-hidden className="hidden sm:inline">
                  ·
                </span>
                <span className="text-neutral-600 inline-flex items-center gap-1">
                  <Zap className="size-[0.9em] md:size-[1em] fill-amber-500" />
                  Instant book
                </span>
              </>
            ) : null}
          </div>

          <div className="space-y-0.5 text-xs sm:text-sm md:text-[clamp(0.80rem,0.82vw,1.02rem)] leading-snug text-neutral-600">
            <span className="block line-clamp-1">{responseLine}</span>
            <div className="flex items-center gap-x-1 sm:gap-x-2">
              <MapPin className="hidden sm:block size-[0.9em] md:size-[1em] text-neutral-700" />
              <span className="line-clamp-1">{subtitle}</span>
            </div>
          </div>

          <p className="pt-1.5 text-sm sm:text-base md:text-[clamp(0.95rem,1.02vw,1.75rem)] leading-none font-semibold text-neutral-950">
            {priceLine}
          </p>
        </div>
      </Link>
      {isOwnerView && (
        <div className="flex items-center justify-between border-t border-neutral-200 px-2 py-2 dark:border-neutral-800">
          {calendarOk ? (
            <a
              href={`/api/cronofy/start-connect?venue_id=${venue.id}`}
              target="_top"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-800 hover:underline dark:text-green-400"
              onClick={(e) => e.stopPropagation()}
            >
              <CalendarDays className="size-3.5" aria-hidden />
              Calendar connected
            </a>
          ) : (
            <a
              href={`/api/cronofy/start-connect?venue_id=${venue.id}`}
              target="_top"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <CalendarDays className="size-3.5" aria-hidden />
              Calendar sync
            </a>
          )}
          <Link
            href={`/venues/${venue.id}/calendar`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Availability Calendar
          </Link>
        </div>
      )}
    </article>
  )
} 


