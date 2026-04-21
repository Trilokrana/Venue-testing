export type VenueType =
  | "event_space_studio"
  | "banquet_hall"
  | "bar_nightclub"
  | "conference_center"
  | string

export type VenueAddress = {
  id: string
  venue_id: string
  street: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  address_line_2: string | null
  place_id: string | null
  formatted_address: string | null
  lat: number | null
  lng: number | null
  created_at: string
}

export type VenueImage = {
  id: string
  venue_id: string
  url: string
  width: number | null
  height: number | null
  is_featured: boolean
  sort_order: number
  created_at: string
  storage_path: string | null
  size?: number | null | undefined
}

export type VenueOwner = {
  id: string
  display_name: string | null
  photo_url: string | null
}

export type VenueRow = {
  id: string
  name: string
  phone: string[] | null
  capacity: number | null
  rating: number | null
  venue_type: VenueType
  owner_id: string | null
  indoor_outdoor: string | null
  square_footage: number | null
  description: string | null
  amenities: string[] | null
  parking: string[] | null
  accessibility: string[] | null
  audio_system: string[] | null
  hours_of_operation: string | null
  cancellation_policy: string | null
  social_media_links: string[] | null
  is_active: boolean
  created_at: string
  slug: string | null
  event_types: string[] | null
  rules: string[] | null
  instabook: boolean
  hourly_rate: number | null
  min_hours: number | null
  /** Set when owner has linked Cronofy / calendar sync for this venue */
  calendar_sync?: "not_connected" | "connected" | null
  /** True when venue has at least one active booking (pending/confirmed, not ended). */
  is_booked?: boolean
}

export type VenueWithRelations = VenueRow & {
  addresses: VenueAddress | VenueAddress[] | null
  images: VenueImage[] | null
  owner?: VenueOwner | VenueOwner[] | null
}
