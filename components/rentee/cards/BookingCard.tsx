import { formatLocationLine } from "@/app/listings/data"
import { Card, CardContent } from "@/components/ui/card"
import { BookingWithRelations } from "@/lib/bookings/types"
import { cn } from "@/lib/utils"
import { VenueAddress, VenueImage } from "@/lib/venues/types"
import { format } from "date-fns"
import { Calendar, Clock, MapPin, Star } from "lucide-react"
import Image from "next/image"

/* -------------------------------------------------------------------------- */
/*  Status styling                                                             */
/* -------------------------------------------------------------------------- */

type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed" | string

const STATUS_STYLES: Record<string, string> = {
  confirmed:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/30",
  pending:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/30",
  cancelled:
    "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-400/30",
  completed:
    "bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-400/30",
}

function getStatusStyle(status: BookingStatus): string {
  return STATUS_STYLES[status] ?? "bg-muted text-muted-foreground ring-border"
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface BookingCardProps {
  booking: BookingWithRelations
  className?: string
  /** Render the card as a horizontal row instead of a vertical card. */
  listView?: boolean
}

const BookingCard = ({ booking, className, listView = false }: BookingCardProps) => {
  const featuredImage: VenueImage | null = Array.isArray(booking.venue.images)
    ? (booking.venue.images.find((img) => img?.is_featured) ?? booking.venue.images[0] ?? null)
    : null

  const startDate = booking.start_at ? new Date(booking.start_at) : null
  const endDate = booking.end_at ? new Date(booking.end_at) : null

  const dateLabel = startDate ? format(startDate, "EEE, MMM d, yyyy") : null
  const timeLabel =
    startDate && endDate ? `${format(startDate, "h:mm a")} – ${format(endDate, "h:mm a")}` : null

  /* ------------------------------ Sub-elements ------------------------------ */

  const StatusBadge = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-xs font-medium ring-1 ring-inset capitalize backdrop-blur-sm",
        getStatusStyle(booking.status)
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {booking.status}
    </span>
  )

  const RatingBadge = booking.venue.rating != null && (
    <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
      <Star className="size-3 fill-amber-500 text-amber-500" />
      {Number(booking.venue.rating).toFixed(1)}
    </span>
  )

  const ImageBlock = (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        listView
          ? "aspect-square w-40 shrink-0 sm:w-52 md:w-60 md:aspect-auto md:h-full"
          : "aspect-[16/10] w-full"
      )}
    >
      {featuredImage ? (
        <Image
          src={featuredImage.url}
          alt={booking.venue.name}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          sizes={
            listView
              ? "(max-width: 768px) 160px, 240px"
              : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          }
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/40">
          <MapPin className="h-10 w-10 text-muted-foreground/40" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-transparent" />

      {/* Status — top right (only show on image in grid view; in list view we move it to the body) */}
      <div className="absolute top-3 right-3">{StatusBadge}</div>

      {/* Rating — top left */}
      {RatingBadge && <div className="absolute top-3 left-3">{RatingBadge}</div>}
    </div>
  )

  /* ---------------------------------- Card ---------------------------------- */

  return (
    <Card
      className={cn(
        "group relative gap-0 overflow-hidden p-0",
        "border-border/60 bg-card transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-lg hover:border-border",
        listView ? "flex h-auto w-full flex-row" : "h-full",
        className
      )}
    >
      {ImageBlock}

      <CardContent
        className={cn("flex flex-1 flex-col gap-4", listView ? "min-w-0 p-4 sm:p-5" : "p-5")}
      >
        {/* Title row — in list view we put status next to title since it's not on the image */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <h3 className="text-lg font-semibold leading-tight tracking-tight line-clamp-1">
              {booking.venue.name?.trim()}
            </h3>
            {booking.venue.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {booking.venue.description}
              </p>
            )}
          </div>
          {/* {listView && <div className="shrink-0">{StatusBadge}</div>} */}
        </div>

        {/* Location */}
        {booking?.venue?.addresses && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <span className="line-clamp-1">
              {formatLocationLine(booking?.venue?.addresses as VenueAddress | null)}
            </span>
          </div>
        )}

        {/* Date + Time + Footer.
            In list view we keep everything on a single horizontal row at the bottom
            so the layout reads left-to-right. In grid view we stack as before. */}
        {listView ? (
          <div className="mt-auto flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-t border-border/60 pt-4">
            {/* Schedule */}
            {(dateLabel || timeLabel) && (
              <div className="flex flex-col gap-1">
                {dateLabel && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{dateLabel}</span>
                  </div>
                )}
                {timeLabel && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{timeLabel}</span>
                  </div>
                )}
              </div>
            )}

            {/* Pricing */}
            <div className="flex flex-col items-end text-right">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Total</span>
              <span className="text-xl font-semibold tracking-tight text-foreground">
                ${Number(booking.total_amount ?? 0).toLocaleString()}
                <span className="ml-1 text-xs font-normal text-muted-foreground">USD</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {booking.total_hours}h × ${booking.hourly_rate}/hr
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Date + Time row (grid view) */}
            {(dateLabel || timeLabel) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5">
                {dateLabel && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{dateLabel}</span>
                  </div>
                )}
                {timeLabel && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{timeLabel}</span>
                  </div>
                )}
              </div>
            )}

            {/* Pricing footer (grid view) */}
            <div className="mt-auto flex items-end justify-between border-t border-border/60 pt-4">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Total</span>
                <span className="text-xl font-semibold tracking-tight text-foreground">
                  ${Number(booking.total_amount ?? 0).toLocaleString()}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">USD</span>
                </span>
              </div>

              <div className="flex flex-col items-end text-right">
                <span className="text-xs text-muted-foreground">
                  {booking.total_hours}h × ${booking?.hourly_rate}/hr
                </span>
                {booking.venue.capacity && (
                  <span className="text-xs text-muted-foreground">
                    Up to {booking?.venue?.capacity} guests
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default BookingCard
