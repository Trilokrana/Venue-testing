import { RATINGS_TABLE, VENUES_TABLE } from "@/lib/db-tables"
import { createServiceSupabaseClient } from "@/lib/supabase/service-client"
// import { CreateReview, CreateVenue, UpdateVenue } from "../entities"
import type { Database } from "@/lib/supabase/database.types"
import { CreateReview, CreateVenue, UpdateVenue } from "@/schemas/venue.schema"
import {
  compressImage,
  deleteStorageObjects,
  deleteVenueImages,
  getImagePublicUrl,
  // deleteStorageObjects,
  // deleteVenueImages,
  // getImagePublicUrl,
  // moveFromStaging,
  uploadImageToStorage,
  VENUE_IMAGES_BUCKET,
} from "../storage"

// Type guard to check if an image is staged (new upload)
function isStagedImage(image: unknown): image is {
  staging_path: string
  width: number
  height: number
  is_featured?: boolean
  sort_order?: number
} {
  return (
    typeof image === "object" &&
    image !== null &&
    "staging_path" in image &&
    typeof (image as { staging_path?: unknown }).staging_path === "string"
  )
}

// Type guard to check if an image is existing (already in permanent storage)
// Note: width/height are optional for backward compatibility with older images
function isExistingImage(image: unknown): image is {
  id: string
  storage_path: string
  width?: number
  height?: number
  is_featured?: boolean
  sort_order?: number
} {
  return typeof image === "object" && image !== null && "storage_path" in image && "id" in image
}

function normalizePhone(phone: unknown): string[] | null | undefined {
  if (phone === undefined) return undefined
  if (phone === null) return null
  if (Array.isArray(phone)) return phone.filter((v): v is string => typeof v === "string")
  if (typeof phone === "string") return phone.length ? [phone] : null
  return undefined
}

export async function createVenue(
  venue: CreateVenue & {
    placeId?: string
    lat?: number
    lng?: number
    formatted_address?: string
  }
) {
  const supabase = createServiceSupabaseClient()

  const { images, address, placeId, lat, lng, formatted_address, ...venueData } = venue

  let venueId: string | null = null
  const uploadedPaths: string[] = []

  try {
    // 1. Create venue
    const venueInsert: Database["public"]["Tables"]["venues"]["Insert"] = {
      ...(venueData as Database["public"]["Tables"]["venues"]["Insert"]),
      phone: normalizePhone((venueData as { phone?: unknown }).phone),
    }

    const { data: venueResult, error: venueError } = await supabase
      .from(VENUES_TABLE)
      .insert(venueInsert)
      .select()
      .single()

    if (venueError) throw venueError
    venueId = venueResult.id

    // 2. Address
    if (placeId) {
      const { error } = await supabase.rpc("upsert_venue_address", {
        p_venue_id: venueId,
        p_street: address.address_line_1,
        p_address_line_2: address.address_line_2 ?? null,
        p_city: address.city,
        p_state: address.state,
        p_zip: address.zip,
        p_country: address.country,
        p_place_id: placeId,
        p_formatted_address: formatted_address ?? null,
        p_lat: lat ?? null,
        p_lng: lng ?? null,
      })
      if (error) throw error
    } else {
      const { error } = await supabase.from("addresses").insert({
        street: address.address_line_1,
        address_line_2: address.address_line_2,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
        venue_id: venueId,
      })
      if (error) throw error
    }

    // 3. Images
    if (images?.length) {
      const imageRows = []

      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        console.log("🚀 ~ createVenue ~ image:", image)
        if (!image?.file) continue

        const imageId = crypto.randomUUID()

        const compressedFile = await compressImage(image.file as File)
        console.log("🚀 ~ createVenue ~ compressedFile:", compressedFile)

        const storagePath = await uploadImageToStorage(supabase, compressedFile, venueId!, imageId)

        // track uploaded file for rollback
        uploadedPaths.push(storagePath)

        const imageUrl = getImagePublicUrl(storagePath)
        if (!imageUrl) throw new Error("Failed to generate image URL")

        if (image.width == null || image.height == null) {
          throw new Error("Image width/height required")
        }

        imageRows.push({
          id: imageId,
          venue_id: venueId,
          storage_path: storagePath,
          url: imageUrl,
          width: image.width,
          height: image.height,
          is_featured: image.is_featured ?? i === 0,
          sort_order: image.sort_order ?? i,
          size: image.file.size,
        })
      }

      if (imageRows.length > 0) {
        const { error } = await supabase.from("images").insert(imageRows)
        if (error) throw error
      }
    }

    return venueId
  } catch (err) {
    console.error("Create venue failed, rolling back...", err)

    // 🔥 ROLLBACK STARTS

    // 1. Delete uploaded images from storage
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(VENUE_IMAGES_BUCKET).remove(uploadedPaths)
    }

    if (venueId) {
      // 2. Delete DB records (order matters if FK constraints exist)

      await supabase.from("images").delete().eq("venue_id", venueId)
      await supabase.from("addresses").delete().eq("venue_id", venueId)
      await supabase.from("venues").delete().eq("id", venueId)
    }

    throw err
  }
}

export async function updateVenue(
  id: string,
  venue: UpdateVenue & {
    placeId?: string
    lat?: number
    lng?: number
    formatted_address?: string
  }
) {
  const supabase = createServiceSupabaseClient()

  const { images, address, placeId, lat, lng, formatted_address, ...venueData } = venue

  const uploadedPaths: string[] = [] // track new uploads for rollback

  try {
    // 1. Update venue data
    const venueUpdate: Database["public"]["Tables"]["venues"]["Update"] = {
      ...(venueData as Database["public"]["Tables"]["venues"]["Update"]),
      phone: normalizePhone((venueData as { phone?: unknown }).phone),
    }

    const { data: venueResult, error: venueError } = await supabase
      .from("venues")
      .update(venueUpdate)
      .eq("id", id)
      .select()
      .single()

    if (venueError && venueError.code !== "PGRST106") throw venueError

    // 2. Update address if provided
    if (address) {
      if (placeId) {
        const { error: rpcError } = await supabase.rpc("upsert_venue_address", {
          p_venue_id: id,
          p_street: address.address_line_1,
          p_address_line_2: (address.address_line_2 ?? null) as string,
          p_city: address.city,
          p_state: address.state,
          p_zip: address.zip,
          p_country: address.country,
          p_place_id: placeId,
          p_formatted_address: (formatted_address ?? null) as string,
          p_lat: (lat ?? null) as number,
          p_lng: (lng ?? null) as number,
        })
        if (rpcError) throw rpcError
      } else {
        const { error: addressError } = await supabase
          .from("addresses")
          .update({
            street: address.address_line_1,
            address_line_2: address.address_line_2,
            city: address.city,
            state: address.state,
            zip: address.zip,
            country: address.country,
          })
          .eq("venue_id", id)
        if (addressError) throw addressError
      }
    }

    // 3. Update images if provided
    if (images !== undefined) {
      // Fetch current images for this venue
      const { data: currentImages, error: fetchError } = await supabase
        .from("images")
        .select("id, storage_path")
        .eq("venue_id", id)

      if (fetchError) throw fetchError

      // Determine which existing image IDs to keep
      const keepImageIds = new Set(images.filter(isExistingImage).map((img) => img.id))

      // Images not in the new list should be deleted
      const imagesToDelete = (currentImages || []).filter((img) => !keepImageIds.has(img.id))

      if (imagesToDelete.length > 0) {
        // Delete from storage (mirrors createVenue rollback pattern)
        const pathsToDelete = imagesToDelete
          .map((img) => img.storage_path)
          .filter((path): path is string => !!path)

        if (pathsToDelete.length > 0) {
          await supabase.storage.from(VENUE_IMAGES_BUCKET).remove(pathsToDelete)
        }

        // Delete DB rows
        const idsToDelete = imagesToDelete.map((img) => img.id)
        const { error: deleteError } = await supabase.from("images").delete().in("id", idsToDelete)
        if (deleteError) throw deleteError
      }

      // Process each image in the new list
      const newImageRows = []
      const existingImageUpdates = []

      for (let i = 0; i < images.length; i++) {
        const image = images[i]

        if ("file" in image && image.file instanceof File) {
          // Same pattern as createVenue: compress → upload → track path

          const imageId = crypto.randomUUID()

          const compressedFile = await compressImage(image.file)
          console.log("🚀 ~ updateVenue ~ compressedFile:", compressedFile)

          const storagePath = await uploadImageToStorage(supabase, compressedFile, id, imageId)

          // Track for rollback
          uploadedPaths.push(storagePath)

          const imageUrl = getImagePublicUrl(storagePath)
          if (!imageUrl) throw new Error("Failed to generate image URL")

          if (image.width == null || image.height == null) {
            throw new Error("Image width/height required")
          }

          console.log("🚀 ~ updateVenue ~ image.file.size:", image.file.size)
          newImageRows.push({
            id: imageId,
            venue_id: id,
            storage_path: storagePath,
            url: imageUrl,
            width: image.width,
            height: image.height,
            is_featured: image.is_featured ?? i === 0,
            sort_order: image.sort_order ?? i,
            size: image.file.size,
          })
        } else if (isExistingImage(image)) {
          // Only metadata update needed for existing images
          existingImageUpdates.push({
            id: image.id,
            is_featured: image.is_featured ?? i === 0,
            sort_order: image.sort_order ?? i,
          })
        }
      }

      // Bulk insert new images (mirrors createVenue)
      if (newImageRows.length > 0) {
        const { error: insertError } = await supabase.from("images").insert(newImageRows)
        if (insertError) throw insertError
      }

      // Patch existing rows only — do not use `.upsert()` with partial rows: PostgREST still
      // validates the INSERT shape, so NOT NULL columns like `url` can fail (23502).
      if (existingImageUpdates.length > 0) {
        const results = await Promise.all(
          existingImageUpdates.map((row) =>
            supabase
              .from("images")
              .update({
                is_featured: row.is_featured,
                sort_order: row.sort_order,
              })
              .eq("id", row.id)
          )
        )
        for (const res of results) {
          if (res.error) throw res.error
        }
      }
    }

    return venueResult
  } catch (err) {
    console.error("Update venue failed, rolling back new uploads...", err)

    // Rollback: only remove newly uploaded images (existing ones are untouched)
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(VENUE_IMAGES_BUCKET).remove(uploadedPaths)
    }

    throw err
  }
}

export async function deleteVenue(id: string) {
  const supabase = createServiceSupabaseClient()

  // First, get all image storage paths for this venue
  const { data: venueImages, error: fetchError } = await supabase
    .from("images")
    .select("storage_path")
    .eq("venue_id", id)

  if (fetchError) throw fetchError

  // Delete storage objects for all images
  if (venueImages && venueImages.length > 0) {
    const pathsToDelete = venueImages
      .map((img) => img.storage_path)
      .filter((path): path is string => !!path)

    if (pathsToDelete.length > 0) {
      await deleteStorageObjects(supabase, pathsToDelete)
    }
  }

  // Also attempt to delete by venue prefix (catches any orphaned files)
  await deleteVenueImages(supabase, id)

  // Delete dependent addresses
  const { error: addressError } = await supabase.from("addresses").delete().eq("venue_id", id)

  if (addressError) throw addressError

  // Delete dependent images (DB rows)
  const { error: imagesError } = await supabase.from("images").delete().eq("venue_id", id)

  if (imagesError) throw imagesError

  // Finally delete the venue
  const { error: venueError } = await supabase.from("venues").delete().eq("id", id)

  if (venueError) throw venueError

  return true
}

export async function createVenueReview(userId: string, review: CreateReview) {
  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase
    .from(RATINGS_TABLE)
    .insert({
      venue_id: review.venue_id,
      rating: review.rating,
      review: review.review ?? "",
      user_id: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Update average rating for venue. This is called when a new review is created.
export async function updateVenueRating(venueId: string) {
  const supabase = createServiceSupabaseClient()

  // Get all ratings for the venue
  const { data: ratings, error: ratingsError } = await supabase
    .from(RATINGS_TABLE)
    .select("rating")
    .eq("venue_id", venueId)

  if (ratingsError) throw ratingsError

  // Calculate average rating
  const averageRating =
    ratings.length > 0 ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length : 0

  // Update venue with new average rating
  const { error: updateError } = await supabase
    .from(VENUES_TABLE)
    .update({ rating: averageRating })
    .eq("id", venueId)

  if (updateError) throw updateError
  return averageRating
}

// Update image order for a venue (batch update sort_order values)
export async function updateImageOrder(
  venueId: string,
  imageOrders: Array<{ id: string; sort_order: number; is_featured?: boolean }>
) {
  const supabase = createServiceSupabaseClient()

  // Update each image's sort_order and is_featured
  for (const { id, sort_order, is_featured } of imageOrders) {
    const updateData: { sort_order: number; is_featured?: boolean } = { sort_order }
    if (is_featured !== undefined) {
      updateData.is_featured = is_featured
    }

    const { error } = await supabase
      .from("images")
      .update(updateData)
      .eq("id", id)
      .eq("venue_id", venueId)

    if (error) throw error
  }

  return true
}
