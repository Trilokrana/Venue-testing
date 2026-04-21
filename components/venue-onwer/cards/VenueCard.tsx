// components/VenueCard.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { VenueAddress, VenueImage, VenueWithRelations } from "@/lib/venues/types"
import {
  CalendarDays,
  Clock,
  DollarSign,
  Eye,
  MapPin,
  Pencil,
  Star,
  Trash,
  Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
// import { VenueEditForm } from "./VenueEditForm";
// import { formatCurrency, formatNumber } from "@/lib/utils";

interface VenueCardProps {
  venue: VenueWithRelations
  onView?: (venue: VenueWithRelations) => void
  onDelete?: (venue: VenueWithRelations) => void
  onEdit?: (venue: VenueWithRelations) => void
  className?: string
  variant?: "default" | "list"
  isOwnerView?: boolean
  ownerCalendarLinked?: boolean
}

function primaryAddress(addresses: VenueWithRelations["addresses"]): VenueAddress | null {
  if (!addresses) return null
  return Array.isArray(addresses) ? (addresses[0] ?? null) : addresses
}

export function VenueCard({
  venue,
  onDelete,
  onEdit,
  onView,
  className,
  variant = "default",
  isOwnerView = true,
  ownerCalendarLinked = false,
}: VenueCardProps) {
  const addr = primaryAddress(venue?.addresses)

  const featuredImage: VenueImage | null = Array.isArray(venue.images)
    ? venue.images.length > 0
      ? venue.images[0]
      : venue.images[0]
    : null

  const isListVarinat = variant === "list"
  const isDefaultVariant = variant === "default"

  const priceLine =
    venue.hourly_rate != null ? `$${venue.hourly_rate.toLocaleString()} USD/hr` : "Request pricing"
  const responseLine = "Responds within a few hours"
  const calendarOk = venue.calendar_sync === "connected"
  const isBooked = venue.is_booked === true

  return (
    <Card
      className={cn(
        "py-0 gap-0 group relative overflow-hidden transition-all duration-300 hover:shadow-xl group/item",
        isListVarinat && "grid grid-cols-2 py-0 pb-0",
        isDefaultVariant &&
          "py-0 gap-0 group relative overflow-hidden transition-all duration-300 hover:shadow-xl group/item",
        className
      )}
    >
      {/* Image Section */}
      <div
        className={cn("relative h-48 w-full overflow-hidden bg-gray-100", isListVarinat && "h-58")}
      >
        {featuredImage ? (
          <Image
            src={featuredImage?.url}
            alt={venue.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <MapPin className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div
          className={cn(
            "group-hover/item:flex group-hover/item:flex-col flex-col gap-2 absolute top-0 right-0 p-2 hidden"
          )}
        >
          {onView && typeof onView === "function" && (
            <Button variant={"outline"} size={"icon-xs"} onClick={() => onView?.(venue)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onEdit && typeof onEdit === "function" && (
            <Button variant={"outline"} size={"icon-xs"} onClick={() => onEdit?.(venue)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && typeof onDelete === "function" && (
            <Button variant={"outline"} size={"icon-xs"} onClick={() => onDelete?.(venue)}>
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <CardContent className="py-4 group-data-[size=sm]/card:py-4 pb-0">
        <div className="space-y-2 mt-2">
          <div className="flex items-start justify-between gap-2">
            {isOwnerView ? (
              <Link
                href={`/venues/${venue.slug}`}
                className="text-xl font-semibold leading-tight line-clamp-1 hover:underline"
              >
                {venue.name}
              </Link>
            ) : (
              <span className="text-xl font-semibold leading-tight line-clamp-1">{venue.name}</span>
            )}
            {isBooked && (
              <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Booked
              </span>
            )}
          </div>
          {/* Description Preview */}
          <p className="text-sm text-muted-foreground line-clamp-1">{venue.description}</p>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{addr?.street ?? "—"}</span>
          </div>
          {venue.rating && (
            <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1">
              <Star className="h-3 w-3 fill-green-600 text-green-600" />
              <span className="text-sm font-medium">{venue.rating}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-sm">
            {venue.capacity && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Up to {venue.capacity}</span>
              </div>
            )}
            {venue.hourly_rate && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>{venue.hourly_rate}/hour</span>
              </div>
            )}
            {venue.min_hours && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Min {venue.min_hours}h</span>
              </div>
            )}
          </div>
        </div>
        {isOwnerView && (
          <CardFooter className="px-0 py-2 w-full align-bottom">
            <div className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-neutral-200 py-2 dark:border-neutral-800">
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
          </CardFooter>
        )}
      </CardContent>
    </Card>
  )
}
