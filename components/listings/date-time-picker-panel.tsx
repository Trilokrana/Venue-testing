"use client"

import * as React from "react"
import { format } from "date-fns"
import { Clock } from "lucide-react"

import { getTimeSlotOptions } from "@/app/listings/data"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TIME_OPTIONS = getTimeSlotOptions()

type Props = {
  date: Date | undefined
  startTime: string
  endTime: string
  onDateChange: (d: Date | undefined) => void
  onStartTimeChange: (t: string) => void
  onEndTimeChange: (t: string) => void
  /** Slot string → display label for busy slots (e.g. "Maintenance", "Booked") */
  busySlots?: Map<string, string>
}

export function DateTimePickerPanel({
  date,
  startTime,
  endTime,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  busySlots,
}: Props) {
  const durationHours = React.useMemo(() => {
    const si = TIME_OPTIONS.indexOf(startTime)
    const ei = TIME_OPTIONS.indexOf(endTime)
    if (si < 0 || ei < 0 || ei <= si) return null
    const minutes = (ei - si) * 30
    return (minutes / 60).toFixed(1)
  }, [startTime, endTime])

  return (
    <div className="flex flex-col gap-0 md:flex-row">
      <div className="border-neutral-200 p-3 md:border-r md:pr-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          className="rounded-xl [--cell-size:--spacing(9)]"
          components={{
            DayButton: (btnProps) => (
              <CalendarDayButton
                {...btnProps}
                className="group-data-[focused=true]/day:border-primary group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-primary/35 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:hover:bg-primary data-[selected-single=true]:hover:text-primary-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground dark:data-[selected-single=true]:bg-primary"
              />
            ),
          }}
        />
      </div>
      <div className="flex min-w-[260px] flex-col gap-3 border-t border-neutral-200 p-4 md:border-t-0">
        {durationHours ? (
          <p className="text-sm font-medium text-primary">{durationHours} hours selected</p>
        ) : (
          <p className="text-sm text-neutral-500">Pick start and end time</p>
        )}
        <div className="space-y-2">
          <Label className="text-neutral-600">Start time</Label>
          <Select value={startTime} onValueChange={onStartTimeChange}>
            <SelectTrigger className="h-12 min-h-12 w-full min-w-[248px] justify-start gap-0 rounded-lg border-primary/25 bg-white py-2.5 focus-visible:border-primary focus-visible:ring-primary/20 [&>svg]:ml-auto">
              <Clock className="mr-2 size-4 shrink-0 text-neutral-400" />
              <SelectValue placeholder="Start" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-primary/25">
              {TIME_OPTIONS.map((t) => {
                const busyLabel = busySlots?.get(t)
                return (
                  <SelectItem key={t} value={t} disabled={!!busyLabel}>
                    <span className={busyLabel ? "text-neutral-400 line-through" : undefined}>{t}</span>
                    {busyLabel ? (
                      <span className="ml-2 text-xs text-neutral-400">{busyLabel}</span>
                    ) : null}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-neutral-600">End time</Label>
          <Select value={endTime} onValueChange={onEndTimeChange}>
            <SelectTrigger className="h-12 min-h-12 w-full min-w-[248px] justify-start gap-0 rounded-lg border-primary/25 bg-white py-2.5 focus-visible:border-primary focus-visible:ring-primary/20 [&>svg]:ml-auto">
              <Clock className="mr-2 size-4 shrink-0 text-neutral-400" />
              <SelectValue placeholder="End" />
            </SelectTrigger>
            <SelectContent className="rounded-lg border-primary/25">
              {TIME_OPTIONS.map((t) => {
                const busyLabel = busySlots?.get(t)
                return (
                  <SelectItem key={`e-${t}`} value={t} disabled={!!busyLabel}>
                    <span className={busyLabel ? "text-neutral-400 line-through" : undefined}>{t}</span>
                    {busyLabel ? (
                      <span className="ml-2 text-xs text-neutral-400">{busyLabel}</span>
                    ) : null}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm font-semibold text-neutral-900">
          {date ? format(date, "MMMM d, yyyy") : "Select a date"}
        </p>
      </div>
    </div>
  )
}
