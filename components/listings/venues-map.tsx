"use client"

import { GoogleMap, Marker } from "@react-google-maps/api"
import * as React from "react"

import { normalizeAddress } from "@/app/listings/data"
import { cn } from "@/lib/utils"
import type { VenueWithRelations } from "@/lib/venues/types"

const defaultCenter = { lat: 39.8283, lng: -98.5795 }

type MapVenue = {
  id: string
  lat: number
  lng: number
  title: string
}

type Props = {
  venues: VenueWithRelations[]
  searchCenter?: { lat: number; lng: number } | null
  selectedId: string | null
  onMarkerClick: (id: string) => void
  mapsLoaded: boolean
  mapsError?: Error | undefined
  className?: string
}

function toMapVenues(venues: VenueWithRelations[]): MapVenue[] {
  const out: MapVenue[] = []
  for (const v of venues) {
    const a = normalizeAddress(v)
    if (a?.lat != null && a?.lng != null) {
      out.push({ id: v.id, lat: a.lat, lng: a.lng, title: v.name })
    }
  }
  return out
}

export function VenuesMap({ venues, searchCenter, selectedId, onMarkerClick, mapsLoaded, mapsError, className }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const points = React.useMemo(() => toMapVenues(venues), [venues])

  const center = React.useMemo(() => {
    if (searchCenter) return searchCenter
    if (!points.length) return defaultCenter
    let lat = 0
    let lng = 0
    for (const p of points) {
      lat += p.lat
      lng += p.lng
    }
    return { lat: lat / points.length, lng: lng / points.length }
  }, [points, searchCenter])

  const mapRef = React.useRef<google.maps.Map | null>(null)

  const onMapLoad = React.useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map
      if (points.length === 0) {
        if (searchCenter) {
          map.setCenter(searchCenter)
          map.setZoom(10)
        }
        return
      }
      if (points.length === 1 && !searchCenter) {
        map.setCenter({ lat: points[0].lat, lng: points[0].lng })
        map.setZoom(13)
        return
      }
      const bounds = new google.maps.LatLngBounds()
      if (searchCenter) {
        bounds.extend(searchCenter)
      }
      for (const p of points) {
        bounds.extend({ lat: p.lat, lng: p.lng })
      }
      map.fitBounds(bounds, 48)
    },
    [points, searchCenter]
  )

  React.useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (searchCenter && points.length === 0) {
      map.panTo(searchCenter)
      map.setZoom(10)
      return
    }

    if (searchCenter && points.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      bounds.extend(searchCenter)
      for (const p of points) bounds.extend({ lat: p.lat, lng: p.lng })
      map.fitBounds(bounds, 48)
      return
    }

    if (points.length === 0) return

    const selected = points.find((p) => p.id === selectedId)
    if (selected) {
      map.panTo({ lat: selected.lat, lng: selected.lng })
      map.setZoom(14)
    }
  }, [selectedId, points, searchCenter])

  if (!apiKey) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded border border-primary/25 bg-neutral-50 p-8 text-center text-sm text-neutral-600",
          className
        )}
      >
        Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show the map.
      </div>
    )
  }

  if (mapsError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive",
          className
        )}
      >
        Could not load Google Maps.
      </div>
    )
  }

  if (!mapsLoaded) {
    return (
      <div
        className={cn(
          "flex animate-pulse items-center justify-center rounded border border-primary/25 bg-neutral-50 p-8 text-sm text-neutral-600",
          className
        )}
      >
        Loading map…
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative flex h-[350px] w-full min-h-[350px] flex-col overflow-hidden rounded border border-primary/25 lg:h-full lg:min-h-[min(50vh,420px)]",
        className
      )}
    >
      <GoogleMap
        mapContainerClassName="h-full w-full flex-1"
        center={center}
        zoom={points.length ? 11 : 4}
        onLoad={onMapLoad}
        options={{
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {points.map((p) => (
          <Marker
            key={p.id}
            position={{ lat: p.lat, lng: p.lng }}
            title={p.title}
            onClick={() => onMarkerClick(p.id)}
            icon={
              selectedId === p.id
                ? {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: "#111827",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                }
                : undefined
            }
          />
        ))}
      </GoogleMap>
      <SearchAsDragToggle />
    </div>
  )
}

function SearchAsDragToggle() {
  const [on, setOn] = React.useState(true)
  return (
    <label className="pointer-events-auto absolute top-3 left-3 flex cursor-pointer items-center gap-2 rounded border border-primary/20 bg-white/95 px-3 py-2 text-xs font-medium text-neutral-800 shadow-sm backdrop-blur">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
        className="size-3.5 accent-primary"
      />
      Search as I drag the map
    </label>
  )
}
