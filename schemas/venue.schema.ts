import { Database } from "@/lib/supabase/database.types"
import { z } from "zod"

type VenueType = Database["public"]["Enums"]["venue_type"]
type IndoorOutdoor = Database["public"]["Enums"]["indoor_outdoor"]

export const venueTypeEnum = z.enum([
  "banquet_hall",
  "conference_center",
  "hotel_resort",
  "restaurant_cafe",
  "bar_nightclub",
  "event_space_studio",
  "ballroom",
  "country_club",
  "garden_outdoor_space",
  "art_gallery_museum",
  "historic_building_landmark",
  "warehouse_industrial_space",
  "theater_auditorium",
  "vineyard_winery",
  "loft_rooftop",
  "beachfront_waterfront",
  "barn_farm",
  "private_estate_mansion",
  "community_center",
  "sports_facility_gym",
] as [VenueType, ...VenueType[]])

export const eventTypeEnum = z.enum([
  "wedding",
  "corporate_meeting",
  "conference",
  "seminar",
  "party",
  "gala",
  "exhibition",
  "trade_show",
  "concert",
  "workshop",
  "product_launch",
  "networking_event",
  "anniversary",
  "birthday",
] as [string, ...string[]])

export const indoorOutdoorEnum = z.enum(["indoor", "outdoor", "both"] as [
  IndoorOutdoor,
  ...IndoorOutdoor[],
])

const addressSchema = z.object({
  address_line_1: z.string().min(1).max(100),
  address_line_2: z.string().min(1).max(100).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zip: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
})

// Schema for staged images (new uploads waiting to be moved to permanent storage)
const stagedImageSchema = z.object({
  staging_path: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().int().nonnegative().optional(),
})

const uploadedImageSchema = z.object({
  file: z.instanceof(File),
  id: z.string(),
  preview: z.string(),
  size: z.number(),
  /** Set client-side (e.g. after `getImageDimensions`) before calling the server action */
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().int().nonnegative().optional(),
})

/** Matches `FileMetadata` from `use-file-upload` for persisted images shown in the gallery (no `File`). */
const fileMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  url: z.string(),
})

/** Existing venue images loaded into the form (preview via URL; optional `storage_path` for updates). */
const existingVenueFormImageSchema = z.object({
  /** DB rows use UUIDs; allow any non-empty string so union fallback does not reject new-upload ids (`name-timestamp-…`). */
  id: z.string().min(1),
  storage_path: z.string().nullable().optional(),
  file: fileMetadataSchema,
  preview: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().int().nonnegative().optional(),
  size: z.number().nullable(),
})

/**
 * New uploads (`File`) match `uploadedImageSchema` first. Persisted rows (URL metadata + uuid id)
 * fail the first branch and match `existingVenueFormImageSchema`.
 */
const venueFormImageSchema = z.union([uploadedImageSchema, existingVenueFormImageSchema])

export type VenueFormImage = z.infer<typeof venueFormImageSchema>

// Schema for existing images (already in permanent storage)
// Note: width/height are optional for backward compatibility with older images
const existingImageSchema = z.object({
  id: z.string().uuid(),
  storage_path: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().int().nonnegative().optional(),
})

// Image input can be either staged (new) or existing
const imageSchema = z.union([stagedImageSchema, existingImageSchema])

const hoursOfOperationFormatMessage =
  "Hours of operation must be in the format of Example : '10:00AM - 10:00PM'"

/** Field-level refine so errors map to `hours_of_operation` (RHF + `trigger(step.fields)`). Object-level `.refine()` attaches to root and often does not show on `FormMessage`. */
const hoursOfOperationFieldSchema = z
  .string()
  .min(1, { message: "Hours of operation is required" })
  .refine(
    (val) => {
      const [from, to] = val.split(" - ")
      return Boolean(from && to)
    },
    { message: hoursOfOperationFormatMessage }
  )

// Base venue fields (object-level `.refine` avoided for hours — see `hoursOfOperationFieldSchema`)
const venueBaseObjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(1000).optional(),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug must contain only lowercase letters, numbers, and hyphens",
    })
    .optional(),
  venue_type: venueTypeEnum,
  event_types: z.array(eventTypeEnum).max(5).optional(),
  capacity: z.number().int().positive().nullable().optional(),
  square_footage: z.number().int().positive().nullable().optional(),
  indoor_outdoor: indoorOutdoorEnum.optional(),
  hourly_rate: z.number().positive().nullable().optional(),
  min_hours: z.number().int().positive().nullable().optional(),
  instabook: z.boolean().default(false),
  hours_of_operation: hoursOfOperationFieldSchema,
  amenities: z.array(z.string()).optional(),
  phone: z.string().optional(),
  social_media_links: z.array(z.string().url()).optional(),
  cancellation_policy: z.string().optional(),
  rules: z.array(z.string()).optional(),
  is_active: z.boolean().default(false),
  address: addressSchema,
  images: z.array(venueFormImageSchema).optional(),
  // Google Places geo data for map display
  placeId: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  formatted_address: z.string().optional(),
})

// Create venue schema (without id)
export const createVenueSchema = venueBaseObjectSchema
export type CreateVenue = z.infer<typeof createVenueSchema>

// Update venue schema (all fields optional except id)
export const updateVenueSchema = venueBaseObjectSchema.partial().extend({
  id: z.string().uuid(),
})

export type UpdateVenue = z.infer<typeof updateVenueSchema>

// Delete venue schema
export const deleteVenueSchema = z.object({
  id: z.string().uuid(),
})

export type DeleteVenue = z.infer<typeof deleteVenueSchema>

// Venue filters schema
export const venueFiltersSchema = z
  .object({
    query: z.string().optional(),
    venue_type: venueTypeEnum.optional(),
    event_types: z.array(eventTypeEnum).optional(),
    city: z.string().optional(),
    min_capacity: z.number().int().positive().optional(),
    max_capacity: z.number().int().positive().optional(),
    max_hourly_rate: z.number().positive().optional(),
    max_min_hours: z.number().int().positive().optional(),
    amenities: z.array(z.string()).optional(),
    indoor_outdoor: indoorOutdoorEnum.optional(),
    instabook: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.min_capacity && data.max_capacity) {
        return data.max_capacity >= data.min_capacity
      }
      return true
    },
    {
      message: "Maximum capacity must be greater than minimum capacity",
      path: ["max_capacity"],
    }
  )

export type VenueFilters = z.infer<typeof venueFiltersSchema> & {
  page?: number | null
  perPage?: number | null
}

// Review schema
export const createReviewSchema = z.object({
  venue_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  review: z.string().min(10).max(500).optional(),
})

export type CreateReview = z.infer<typeof createReviewSchema>
