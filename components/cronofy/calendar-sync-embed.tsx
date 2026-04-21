"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"

type CalendarSyncAuthorization = {
  client_id: string
  redirect_uri: string
  scope: string
  state: string
}

declare global {
  interface Window {
    CronofyElements?: {
      CalendarSync: (opts: {
        target_id: string
        data_center?: string
        element_token?: string
        authorization: CalendarSyncAuthorization
        styles?: { prefix?: string }
        callback?: (data: unknown) => void
      }) => { refresh?: () => void; update?: (opts: unknown) => void }
    }
  }
}

export type CalendarSyncEmbedProps = {
  scriptUrl: string
  dataCenter: "us" | "uk" | "sg" | "de" | "ca" | "au"
  authorization: CalendarSyncAuthorization
  hasExistingCredentials: boolean
  /** DOM id for Cronofy mount target (must be unique per page). */
  targetId: string
  /** URL query key for success, e.g. `success` or `cronofy_success` */
  successQueryKey?: string
  errorQueryKey?: string
  hintQueryKey?: string
  className?: string
}

type TokenState = string | "loading" | "none"

function isCronofyElementToken(t: TokenState): t is string {
  return t !== "loading" && t !== "none" && t.length > 0
}

export function CalendarSyncEmbed({
  scriptUrl,
  dataCenter,
  authorization,
  hasExistingCredentials,
  targetId,
  successQueryKey = "success",
  errorQueryKey = "error",
  hintQueryKey = "hint",
  className,
}: CalendarSyncEmbedProps) {
  const [scriptReady, setScriptReady] = useState(false)
  const [elementToken, setElementToken] = useState<TokenState>(
    hasExistingCredentials ? "loading" : "none"
  )
  const [message, setMessage] = useState<"success" | "error" | null>(null)
  const [errorHint, setErrorHint] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
    const successVal = params.get(successQueryKey)
    if (successVal === "1" || successVal === "true") setMessage("success")
    if (params.get(errorQueryKey)) {
      setMessage("error")
      const hint = params.get(hintQueryKey)
      if (hint === "run_sql_migration") {
        setErrorHint(
          "Database table missing: create `cronofy_credentials` in Supabase (SQL Editor / migrations)."
        )
      } else if (hint === "add_service_role") {
        setErrorHint(
          "Add SUPABASE_SERVICE_ROLE_KEY to your env, restart the dev server, then connect again."
        )
      } else if (params.get(errorQueryKey) === "save_failed") {
        setErrorHint(
          "Could not save tokens. Ensure `cronofy_credentials` exists and service role is configured."
        )
      }
    }
  }, [successQueryKey, errorQueryKey, hintQueryKey])

  useEffect(() => {
    if (!hasExistingCredentials) {
      setElementToken("none")
      return
    }
    let cancelled = false
    setElementToken("loading")
    fetch("/api/cronofy/element-token")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        setElementToken(data?.token ?? "none")
      })
      .catch(() => {
        if (!cancelled) setElementToken("none")
      })
    return () => {
      cancelled = true
    }
  }, [hasExistingCredentials])

  const canInit =
    scriptReady &&
    containerRef.current &&
    window.CronofyElements &&
    (elementToken !== "loading" || !hasExistingCredentials)

  useEffect(() => {
    if (!canInit) return

    const opts: Parameters<NonNullable<Window["CronofyElements"]>["CalendarSync"]>[0] = {
      target_id: targetId,
      data_center: dataCenter,
      authorization,
      styles: { prefix: "CalendarSync" },
      callback: (data: unknown) => {
        const notif = (data as { notification?: { type: string } })?.notification
        if (notif?.type === "error") setMessage("error")
      },
    }
    if (isCronofyElementToken(elementToken)) {
      opts.element_token = elementToken
    }

    window.CronofyElements!.CalendarSync(opts)
  }, [canInit, authorization, elementToken, dataCenter, targetId])

  return (
    <div className={className}>
      {message === "success" && (
        <p className="mb-4 rounded-md bg-green-100 px-3 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
          Calendar connected successfully.
        </p>
      )}
      {message === "error" && (
        <div className="mb-4 space-y-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <p>Something went wrong. Try connecting again.</p>
          {errorHint && <p className="text-foreground/90">{errorHint}</p>}
        </div>
      )}
      {elementToken === "loading" && (
        <p className="mb-4 text-sm text-muted-foreground">Loading calendar status…</p>
      )}
      <div
        id={targetId}
        ref={containerRef}
        className="min-h-[220px] rounded-lg border border-border bg-muted/20 p-2"
      />
      <Script src={scriptUrl} strategy="afterInteractive" onLoad={() => setScriptReady(true)} />
    </div>
  )
}

// Cronofy connect + post-OAuth message + element token flow
