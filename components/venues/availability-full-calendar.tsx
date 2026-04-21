"use client"

import type { EventClickArg, EventInput } from "@fullcalendar/core"
import type { DateClickArg } from "@fullcalendar/interaction"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import { cn } from "@/lib/utils"
import "./availability-calendar.css"

type VenueFullCalendarProps = {
  events: EventInput[]
  onEventClick: (arg: EventClickArg) => void
  onDateClick: (arg: DateClickArg) => void
  className?: string
}

export function VenueFullCalendar({ events, onEventClick, onDateClick, className }: VenueFullCalendarProps) {
  return (
    <div className={cn("venue-fc w-full rounded-xl border bg-card text-card-foreground shadow-sm", className)}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        buttonText={{
          today: "Today",
          month: "Month",
          week: "Week",
          day: "Day",
        }}
        height="auto"
        contentHeight="65vh"
        expandRows
        nowIndicator
        editable={false}
        selectable={false}
        dayMaxEvents={4}
        firstDay={1}
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        scrollTime="09:00:00"
        allDaySlot
        events={events}
        eventClick={onEventClick}
        dateClick={onDateClick}
        eventDisplay="block"
      />
    </div>
  )
}
