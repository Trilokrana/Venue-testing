export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return ""

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
    }).format(new Date(date))
  } catch (_err) {
    return ""
  }
}
export function formatDateTime(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return ""
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: opts.month ?? "long",
      day: opts.day ?? "numeric",
      year: opts.year ?? "numeric",
      ...opts,
      hour: opts.hour ?? "numeric",
      minute: opts.minute ?? "numeric",
      second: opts.second ?? "numeric",
    }).format(new Date(date))
  } catch (_err) {
    return ""
  }
}

export function formatTime(time: string) {
  if (!time) return ""

  const [hourStr, minute] = time.split(":")
  let hour = parseInt(hourStr)

  const ampm = hour >= 12 ? "PM" : "AM"
  hour = hour % 12 || 12

  return `${hour}:${minute}${ampm}`
}

export function to24Hour(time?: string) {
  if (!time) return ""

  const match = time.match(/(\d+):(\d+)(AM|PM)/)
  if (!match) return ""

  const [_, h, m, period] = match
  let hour = parseInt(h)

  if (period === "PM" && hour !== 12) hour += 12
  if (period === "AM" && hour === 12) hour = 0

  return `${hour.toString().padStart(2, "0")}:${m}`
}

export function togglePeriod(time: string) {
  if (time.includes("AM")) {
    return time.replace("AM", "PM")
  }

  if (time.includes("PM")) {
    return time.replace("PM", "AM")
  }

  return time
}

export function formatCurrencyINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}
