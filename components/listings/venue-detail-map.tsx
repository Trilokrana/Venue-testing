"use client"

import * as React from "react"
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"

import { cn } from "@/lib/utils"

const LIBRARIES = ["places"] as const

type Props = {
  lat: number
  lng: number
  title: string
  className?: string
}

export function VenueDetailMap({ lat, lng, title, className }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const { isLoaded, loadError } = useJsApiLoader({
    id: "venue-booking-google",
    googleMapsApiKey: apiKey ?? "",
    libraries: LIBRARIES as any,
  })

  const center = React.useMemo(() => ({ lat, lng }), [lat, lng])

  if (!apiKey || loadError) {
    return (
      <div
        className={cn(
          "flex min-h-[220px] items-center justify-center rounded-xl border border-primary/25 bg-muted text-sm text-muted-foreground",
          className
        )}
      >
        Map unavailable.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex min-h-[220px] animate-pulse items-center justify-center rounded-xl border border-primary/25 bg-muted text-sm",
          className
        )}
      >
        Loading map…
      </div>
    )
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-primary/25", className)}>
      <GoogleMap
        mapContainerClassName="h-[280px] w-full md:h-[320px]"
        center={center}
        zoom={14}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        <Marker position={center} title={title} />
      </GoogleMap>
    </div>
  )
}
