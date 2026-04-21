import { createVenueSchema, type VenueFormImage } from "@/schemas/venue.schema"
import type { z } from "zod"
import type { VenueImage, VenueWithRelations } from "./types"

export type CreateVenueFormInput = z.input<typeof createVenueSchema>

/** Maps DB images to form/gallery shape (`File` uploads vs `FileMetadata` for existing URLs). */
export function mapVenueImagesToFormDefaults(
  images: VenueImage[] | null | undefined
): VenueFormImage[] {
  if (!images?.length) return []
  return images.map((img) => {
    const url = img.url || ""
    const filename = url.split("/").pop() || `image-${img.id}`
    const ext = (filename.includes(".") ? filename.split(".").pop() : "") || "jpeg"
    const safeExt = ext.replace(/[^a-z0-9]/gi, "") || "jpeg"
    return {
      id: img.id,
      storage_path: img.storage_path,
      file: {
        id: img.id,
        name: filename,
        size: img.size ?? 0,
        type: `image/${safeExt}`,
        url,
      },
      preview: url,
      width: img.width ?? undefined,
      height: img.height ?? undefined,
      is_featured: img.is_featured,
      sort_order: img.sort_order,
      /** Required by `existingVenueFormImageSchema` (union validates after uploaded branch). */
      size: img.size ?? null,
    }
  })
}

function primaryAddress(venue: VenueWithRelations) {
  const a = venue?.addresses
  if (!a) return null
  return Array.isArray(a) ? (a[0] ?? null) : a
}

/** Maps API/DB venue shape to create-venue form default values (nested `address`, flat geo on form). */
export function mapVenueToCreateFormDefaults(venue: VenueWithRelations): CreateVenueFormInput {
  const addr = primaryAddress(venue)
  return {
    name: venue?.name ?? "",
    description: venue?.description ?? undefined,
    slug: venue?.slug ?? undefined,
    venue_type: venue?.venue_type as CreateVenueFormInput["venue_type"],
    event_types: (venue?.event_types ?? []) as CreateVenueFormInput["event_types"],
    capacity: venue?.capacity ?? undefined,
    square_footage: venue?.square_footage ?? undefined,
    indoor_outdoor: venue?.indoor_outdoor as CreateVenueFormInput["indoor_outdoor"],
    hourly_rate: venue?.hourly_rate ?? undefined,
    min_hours: venue?.min_hours ?? undefined,
    instabook: venue?.instabook,
    hours_of_operation: venue?.hours_of_operation ?? "",
    cancellation_policy: venue?.cancellation_policy ?? undefined,
    is_active: venue?.is_active,
    social_media_links: (venue?.social_media_links ??
      []) as CreateVenueFormInput["social_media_links"],
    amenities: venue?.amenities ?? undefined,
    phone: venue?.phone?.[0] ?? "",
    rules: venue?.rules ?? undefined,
    address: {
      address_line_1: addr?.street ?? "",
      address_line_2: addr?.address_line_2 ?? "",
      city: addr?.city ?? "",
      state: addr?.state ?? "",
      zip: addr?.zip ?? "",
      country: addr?.country ?? "US",
    },
    placeId: addr?.place_id ?? "",
    lat: addr?.lat ?? 0,
    lng: addr?.lng ?? 0,
    formatted_address: addr?.formatted_address ?? "",
    images: mapVenueImagesToFormDefaults(venue?.images),
  }
}
