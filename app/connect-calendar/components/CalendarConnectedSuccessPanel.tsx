import type { ReactNode } from "react"
import Link from "next/link"
import { CalendarRange, CheckCircle2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

type Props = {
  /** e.g. Venues / … / Calendar sync — nudged upward under the dashboard shell */
  breadcrumb?: ReactNode
  /** When set, shows listing strip + link to this venue’s availability calendar */
  venueId?: string
  venueName?: string
  /** User just returned from OAuth with `?success=1` */
  freshOAuthSuccess: boolean
  /** Optional OAuth / save error code from query string */
  oauthError?: string | null
  className?: string
}

function safeErrorLabel(code: string) {
  try {
    return decodeURIComponent(code)
  } catch {
    return code
  }
}

export function CalendarConnectedSuccessPanel({
  breadcrumb,
  venueId,
  venueName,
  freshOAuthSuccess,
  oauthError,
  className,
}: Props) {
  const isVenue = Boolean(venueId && venueName)
  const title = freshOAuthSuccess ? "Calendar connected successfully" : "Calendar connected"

  return (
    <div className={cn("space-y-6", className)}>
      {breadcrumb ? <div className="-mt-4 mb-0 w-full md:mt-4">{breadcrumb}</div> : null}

      {oauthError ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="text-destructive/90">
            {safeErrorLabel(oauthError)}. Try connecting again
            {isVenue ? " from this page or your venue list." : "."}
          </AlertDescription>
        </Alert>
      ) : null}

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-emerald-500/25",
          "bg-linear-to-br from-emerald-500/12 via-background to-background",
          "p-6 shadow-sm sm:p-8"
        )}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/20"
            aria-hidden
          >
            <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0 space-y-3">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your calendars are linked. Availability can use your linked calendars for accurate
              booking windows.
            </p>
            {isVenue && venueId ? (
              <Link
                href={`/venues/${venueId}/calendar`}
                className="inline-flex items-center gap-2 pt-1 text-sm font-medium text-primary hover:underline"
              >
                <CalendarRange className="size-4 shrink-0" aria-hidden />
                Open availability calendar
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
