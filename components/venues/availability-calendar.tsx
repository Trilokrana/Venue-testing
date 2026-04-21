"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover"
import type { EventClickArg, EventInput } from "@fullcalendar/core"
import type { DateClickArg } from "@fullcalendar/interaction"
import { addDays, format, isSameDay, startOfDay } from "date-fns"
import { AlignLeft, Calendar, Clock, Loader2, Lock, Trash2, X } from "lucide-react"
import dynamic from "next/dynamic"
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

const VenueFullCalendar = dynamic(
  () => import("./availability-full-calendar").then((m) => m.VenueFullCalendar),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[65vh] w-full items-center justify-center rounded-xl border bg-muted/30">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    ),
  }
)

type ExternalEvent = {
  id: string
  venue_id: string | null
  title: string | null
  start_time: string
  end_time: string
  is_external: boolean | null
  is_booking: boolean | null
  is_blocked: boolean | null
  cronofy_event_id: string | null
}

type AvailabilityCalendarProps = {
  venueId: string
  initialBlocks: any[]
  initialBookings: any[]
  initialExternalEvents?: ExternalEvent[]
  hasCronofySync: boolean
  createBlockAction: (venueId: string, startAt: string, endAt: string) => Promise<any>
  deleteBlockAction: (blockId: string) => Promise<any>
}

type DetailState =
  | {
      kind: "block"
      anchor: { x: number; y: number }
      block: any
    }
  | {
      kind: "booking"
      anchor: { x: number; y: number }
      booking: any
    }
  | {
      kind: "external"
      anchor: { x: number; y: number }
      event: ExternalEvent
    }
  | {
      kind: "day"
      anchor: { x: number; y: number }
      date: Date
    }
  | null

function buildEvents(blocks: any[], bookings: any[], externalEvents: ExternalEvent[] = []): EventInput[] {
  const blockEvents: EventInput[] = blocks.map((b) => {
    const dayStart = startOfDay(new Date(b.start_at))
    const dayStr = format(dayStart, "yyyy-MM-dd")
    const endExclusive = format(addDays(dayStart, 1), "yyyy-MM-dd")
    return {
      id: `block-${b.id}`,
      title: "Blocked",
      start: dayStr,
      end: endExclusive,
      allDay: true,
      display: "block",
      backgroundColor: "var(--destructive)",
      borderColor: "var(--destructive)",
      textColor: "var(--destructive-foreground)",
      extendedProps: { kind: "block" as const, block: b },
    }
  })

  const bookingEvents: EventInput[] = bookings.map((b) => ({
    id: `booking-${b.id}`,
    title: `Booking · ${String(b.status)}`,
    start: b.start_at,
    end: b.end_at,
    display: "block",
    backgroundColor: "var(--primary)",
    borderColor: "var(--primary)",
    textColor: "var(--primary-foreground)",
    extendedProps: { kind: "booking" as const, booking: b },
  }))

  const externalEvts: EventInput[] = externalEvents.map((e) => ({
    id: `ext-${e.id}`,
    title: e.title || "Busy",
    start: e.start_time,
    end: e.end_time,
    display: "block",
    backgroundColor: "#f59e0b",
    borderColor: "#d97706",
    textColor: "#ffffff",
    extendedProps: { kind: "external" as const, event: e },
  }))

  return [...blockEvents, ...bookingEvents, ...externalEvts]
}

export function AvailabilityCalendar({
  venueId,
  initialBlocks,
  initialBookings,
  initialExternalEvents = [],
  hasCronofySync,
  createBlockAction,
  deleteBlockAction,
}: AvailabilityCalendarProps) {
  const [blocks, setBlocks] = useState(initialBlocks)
  const [bookings] = useState(initialBookings)
  const [externalEvents] = useState(initialExternalEvents)
  const [detail, setDetail] = useState<DetailState>(null)
  const [isSaving, setIsSaving] = useState(false)
  const anchorRef = useRef<HTMLDivElement | null>(null)

  const events = useMemo(
    () => buildEvents(blocks, bookings, externalEvents),
    [blocks, bookings, externalEvents]
  )

  const positionAnchor = useCallback((x: number, y: number) => {
    const el = anchorRef.current
    if (!el) return
    const w = 360
    const h = 420
    const left = Math.max(8, Math.min(x, window.innerWidth - w - 8))
    const top = Math.max(8, Math.min(y, window.innerHeight - h - 8))
    el.style.position = "fixed"
    el.style.left = `${left}px`
    el.style.top = `${top}px`
    el.style.width = "1px"
    el.style.height = "1px"
    el.style.pointerEvents = "none"
  }, [])

  useLayoutEffect(() => {
    if (!detail) return
    positionAnchor(detail.anchor.x, detail.anchor.y)
  }, [detail, positionAnchor])

  const closeDetail = useCallback(() => setDetail(null), [])

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      info.jsEvent.preventDefault()
      const k = info.event.extendedProps?.kind
      const { clientX, clientY } = info.jsEvent
      if (k === "block") {
        setDetail({ kind: "block", anchor: { x: clientX, y: clientY }, block: info.event.extendedProps.block })
      } else if (k === "booking") {
        setDetail({
          kind: "booking",
          anchor: { x: clientX, y: clientY },
          booking: info.event.extendedProps.booking,
        })
      } else if (k === "external") {
        setDetail({
          kind: "external",
          anchor: { x: clientX, y: clientY },
          event: info.event.extendedProps.event,
        })
      }
    },
    []
  )

  const handleDateClick = useCallback((info: DateClickArg) => {
    const { clientX, clientY } = info.jsEvent
    setDetail({ kind: "day", anchor: { x: clientX, y: clientY }, date: info.date })
  }, [])

  const toggleBlockForDate = async (selectedDate: Date) => {
    const existingBlock = blocks.find((b) => isSameDay(new Date(b.start_at), selectedDate))

    setIsSaving(true)
    try {
      if (existingBlock) {
        const res = await deleteBlockAction(existingBlock.id)
        if (res?.success) {
          setBlocks(blocks.filter((b) => b.id !== existingBlock.id))
          toast.success("Block removed successfully")
          closeDetail()
        } else {
          throw new Error(res?.error || "Failed to remove block")
        }
      } else {
        const startAt = new Date(selectedDate)
        startAt.setHours(0, 0, 0, 0)
        const endAt = new Date(selectedDate)
        endAt.setHours(23, 59, 59, 999)

        const res = await createBlockAction(venueId, startAt.toISOString(), endAt.toISOString())
        if (res?.success) {
          setBlocks([...blocks, res.data])
          toast.success("Date blocked successfully")
          closeDetail()
        } else {
          throw new Error(res?.error || "Failed to add block")
        }
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedDate = detail?.kind === "day" ? detail.date : null
  const isBlocked = Boolean(
    selectedDate && blocks.some((b) => isSameDay(new Date(b.start_at), selectedDate))
  )
  const isBooked = Boolean(
    selectedDate && bookings.some((b) => isSameDay(new Date(b.start_at), selectedDate))
  )
  const dayExternalEvents = selectedDate
    ? externalEvents.filter((e) => isSameDay(new Date(e.start_time), selectedDate))
    : []
  const hasExternalBusy = dayExternalEvents.length > 0

  return (
    <div className="space-y-6">
      <VenueFullCalendar events={events} onEventClick={handleEventClick} onDateClick={handleDateClick} />

      <Popover
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) closeDetail()
        }}
      >
        <PopoverAnchor asChild>
          <div ref={anchorRef} aria-hidden className="size-px" />
        </PopoverAnchor>
        <PopoverContent
          className="w-[min(92vw,380px)] gap-0 overflow-hidden p-0 shadow-lg ring-1 ring-foreground/10"
          align="start"
          side="bottom"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {detail?.kind === "block" && (
            <div className="flex flex-col">
              <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-destructive size-3 shrink-0 rounded-sm" />
                    <PopoverTitle className="text-base font-semibold leading-tight">Blocked</PopoverTitle>
                  </div>
                  <PopoverDescription className="mt-1 text-sm">
                    {format(new Date(detail.block.start_at), "EEEE, d MMMM yyyy")}
                  </PopoverDescription>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground h-8 w-8"
                    disabled={isSaving}
                    onClick={() => toggleBlockForDate(new Date(detail.block.start_at))}
                    aria-label="Unblock date"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground h-8 w-8"
                    onClick={closeDetail}
                    aria-label="Close"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3 px-4 py-3 text-sm">
                <div className="flex gap-3">
                  <Clock className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Availability
                    </p>
                    <p>This day is blocked for new bookings on Supernova.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Calendar className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Calendar
                    </p>
                    <p>Venue availability</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Lock className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      Visibility
                    </p>
                    <p>Owners &amp; guests see blocked days</p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/40 border-t px-4 py-3">
                <Button
                  variant="outline"
                  className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
                  disabled={isSaving}
                  onClick={() => toggleBlockForDate(new Date(detail.block.start_at))}
                >
                  {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
                  Unblock date
                </Button>
              </div>
            </div>
          )}

          {detail?.kind === "booking" && (
            <div className="flex flex-col">
              <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary size-3 shrink-0 rounded-sm" />
                    <PopoverTitle className="text-base font-semibold leading-tight">Booking</PopoverTitle>
                  </div>
                  <PopoverDescription className="mt-1 text-sm">
                    {format(new Date(detail.booking.start_at), "EEEE, d MMMM yyyy")}
                  </PopoverDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground h-8 w-8 shrink-0"
                  onClick={closeDetail}
                  aria-label="Close"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="space-y-3 px-4 py-3 text-sm">
                <div className="flex gap-3">
                  <Clock className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Time</p>
                    <p>
                      {format(new Date(detail.booking.start_at), "h:mm a")} –{" "}
                      {format(new Date(detail.booking.end_at), "h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Calendar className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Status</p>
                    <p className="capitalize">{String(detail.booking.status).replace(/_/g, " ")}</p>
                  </div>
                </div>
                {detail.booking.notes ? (
                  <div className="flex gap-3">
                    <AlignLeft className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <div>
                      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Note</p>
                      <p>{detail.booking.notes}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {detail?.kind === "external" && (
            <div className="flex flex-col">
              <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="size-3 shrink-0 rounded-sm bg-amber-500" />
                    <PopoverTitle className="text-base font-semibold leading-tight">
                      {detail.event.title || "Busy"}
                    </PopoverTitle>
                  </div>
                  <PopoverDescription className="mt-1 text-sm">
                    Google Calendar Event
                  </PopoverDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground h-8 w-8 shrink-0"
                  onClick={closeDetail}
                  aria-label="Close"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="space-y-3 px-4 py-3 text-sm">
                <div className="flex gap-3">
                  <Clock className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Time</p>
                    <p>
                      {format(new Date(detail.event.start_time), "h:mm a")} –{" "}
                      {format(new Date(detail.event.end_time), "h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Calendar className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Date</p>
                    <p>{format(new Date(detail.event.start_time), "EEEE, d MMMM yyyy")}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Lock className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Source</p>
                    <p>Synced from your Google Calendar — bookings are blocked during this time.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {detail?.kind === "day" && (
            <div className="flex flex-col">
              <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
                <PopoverHeader className="p-0">
                  <PopoverTitle className="text-base font-semibold">
                    {format(detail.date, "EEEE, d MMMM yyyy")}
                  </PopoverTitle>
                  <PopoverDescription>
                    {isBlocked
                      ? "This date is blocked."
                      : isBooked && hasExternalBusy
                        ? "This date has bookings and Google Calendar events."
                        : isBooked
                          ? "There is a booking on this date."
                          : hasExternalBusy
                            ? "This date has events from Google Calendar."
                            : "This date is available."}
                  </PopoverDescription>
                </PopoverHeader>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground h-8 w-8 shrink-0"
                  onClick={closeDetail}
                  aria-label="Close"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="space-y-4 px-4 py-4">
                {isBooked && (
                  <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <AlertTitle className="text-blue-900 dark:text-blue-100">Venue booked</AlertTitle>
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      {bookings
                        .filter((b) => isSameDay(new Date(b.start_at), detail.date))
                        .map(
                          (b) =>
                            `${format(new Date(b.start_at), "h:mm a")} – ${format(new Date(b.end_at), "h:mm a")}`
                        )
                        .join(", ")}
                    </AlertDescription>
                  </Alert>
                )}

                {hasExternalBusy && (
                  <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                    <AlertTitle className="text-amber-900 dark:text-amber-100">Google Calendar</AlertTitle>
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      {dayExternalEvents.map((e) => (
                        <span key={e.id} className="block">
                          {e.title || "Busy"}: {format(new Date(e.start_time), "h:mm a")} –{" "}
                          {format(new Date(e.end_time), "h:mm a")}
                        </span>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}

                {isBlocked ? (
                  <Button
                    variant="outline"
                    className="w-full border-destructive/40 text-destructive"
                    disabled={isSaving}
                    onClick={() => toggleBlockForDate(detail.date)}
                  >
                    {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
                    Unblock date
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={isSaving || isBooked}
                    onClick={() => toggleBlockForDate(detail.date)}
                  >
                    {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Block date
                  </Button>
                )}

                {!hasCronofySync && (
                  <Alert>
                    <AlertDescription className="text-xs">
                      No external calendar synced for this venue. Blocks apply on Supernova only — use Calendar Sync
                      to connect Google or Outlook.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
