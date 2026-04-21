import { z } from "zod"
import { venueFiltersSchema } from "~/lib/venue/entities"

// Image data as stored in DB and returned from queries
// Note: width/height may be null for older images
export interface VenueImageData {
  id: string
  storage_path: string | null
  width?: number
  height?: number
  is_featured?: boolean
  sort_order?: number
  // url is kept for backward compatibility during migration
  url?: string
}

// data returned for venues
export type VenueType = {
  id: string
  name: string
  slug?: string
  phone: string[] | null
  capacity: number | null
  rating: number | null
  venue_type: string | null
  event_types: string[] | null
  owner_id: string | null
  hourly_rate: number | null
  min_hours: number | null
  instabook: boolean
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
  rules: string[] | null
  is_active: boolean
  created_at: string
  addresses: {
    street?: string
    address_line_2?: string
    city?: string
    state?: string
    country?: string
    zip?: string
    lat?: number
    lng?: number
  } | null
  images: VenueImageData[]
}

// used for creating/updating venues
export type VenueFormData = {
  name: string
  description?: string
  slug?: string
  venue_type: string
  event_types?: string[]
  capacity?: number
  square_footage?: number
  indoor_outdoor?: string
  hourly_rate?: number
  min_hours?: number
  instabook?: boolean
  hours_of_operation?: string
  amenities?: string[]
  accessibility?: string[]
  parking?: string[]
  audio_system?: string[]
  phone?: string[]
  social_media_links?: string[]
  cancellation_policy?: string
  rules?: string[]
  is_active: boolean
}

export type VenueFilters = z.infer<typeof venueFiltersSchema>

export type VenueAddress = {
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  zip: string
  country: string
}

// Staged image data from upload (before venue save)
// Uses staging_path which will be moved to permanent path on save
export interface StagedVenueImage {
  staging_path: string
  width: number
  height: number
  is_featured?: boolean
  sort_order?: number
}

// Image data for create/update operations
// Can be either a staged image (new upload) or existing image (with id and storage_path)
// Note: width/height are optional for existing images for backward compatibility
export type VenueImageInput =
  | StagedVenueImage
  | {
      id: string
      storage_path: string
      width?: number
      height?: number
      is_featured?: boolean
      sort_order?: number
    }

// Legacy type kept for backward compatibility
export type VenueImage = {
  url: string
  width: number
  height: number
  is_featured?: boolean
}[]
