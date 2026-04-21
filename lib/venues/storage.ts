// import type { SupabaseClient } from "@supabase/supabase-js"

// export const VENUE_IMAGES_BUCKET = "venue-images"

// /**
//  * Image data that may come from either new (storage_path) or legacy (url) format
//  */
// export interface ImageWithPath {
//   storage_path?: string | null
//   url?: string | null
// }

// /**
//  * Derives the public URL for an image from its storage path
//  * @param storagePath - The storage path (e.g., "venues/abc-123/img-456.webp")
//  * @returns The full public URL for the image
//  */
// export function getImagePublicUrl(storagePath: string | null | undefined): string | null {
//   if (!storagePath) return null

//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
//   if (!supabaseUrl) {
//     console.warn("NEXT_PUBLIC_SUPABASE_URL not configured")
//     return null
//   }

//   return `${supabaseUrl}/storage/v1/object/public/${VENUE_IMAGES_BUCKET}/${storagePath}`
// }

// /**
//  * Resolves the public URL for an image, handling both new (storage_path) and legacy (url) formats
//  * Prefers storage_path if available, falls back to url for backward compatibility
//  * @param image - Image data with either storage_path or url
//  * @returns The public URL for the image, or null if neither is available
//  */
// export function resolveImageUrl(image: ImageWithPath | null | undefined): string | null {
//   if (!image) return null

//   // Prefer storage_path if available
//   if (image.storage_path) {
//     return getImagePublicUrl(image.storage_path)
//   }

//   // Fall back to legacy url field
//   return image.url || null
// }

// /**
//  * Extracts the file extension from a filename or path
//  */
// function getFileExtension(filename: string): string {
//   const parts = filename.split(".")
//   return parts.length > 1 ? parts[parts.length - 1] : ""
// }

// /**
//  * Generates the permanent storage path for a venue image
//  * @param venueId - The venue's UUID
//  * @param imageId - The image's UUID
//  * @param extension - The file extension (e.g., "webp", "jpg")
//  * @returns The storage path (e.g., "venues/abc-123/img-456.webp")
//  */
// export function getVenueImagePath(venueId: string, imageId: string, extension: string): string {
//   return `venues/${venueId}/${imageId}.${extension}`
// }

// /**
//  * Generates the staging path for a temporary upload
//  * @param uploadId - Unique identifier for the upload (e.g., nanoid)
//  * @param extension - The file extension
//  * @returns The staging path (e.g., "staging/xyz123.webp")
//  */
// export function getStagingPath(uploadId: string, extension: string): string {
//   return `staging/${uploadId}.${extension}`
// }

// /**
//  * Checks if a path is a staging path
//  */
// export function isStagingPath(path: string): boolean {
//   return path.startsWith("staging/")
// }

// /**
//  * Moves a file from staging to the permanent venue path
//  * @param client - Supabase client with admin privileges
//  * @param stagingPath - The current staging path
//  * @param venueId - The venue's UUID
//  * @param imageId - The image's UUID (will be used in the new path)
//  * @returns The new permanent storage path
//  */
// export async function moveFromStaging(
//   client: SupabaseClient,
//   stagingPath: string,
//   venueId: string,
//   imageId: string
// ): Promise<string> {
//   const bucket = client.storage.from(VENUE_IMAGES_BUCKET)
//   const extension = getFileExtension(stagingPath)
//   const newPath = getVenueImagePath(venueId, imageId, extension)

//   // Copy to new location
//   const { error: copyError } = await bucket.copy(stagingPath, newPath)
//   if (copyError) {
//     console.warn(`Failed to copy ${stagingPath} to ${newPath}:`, copyError)
//     throw new Error(`Failed to move image to permanent storage: ${copyError.message}`)
//   }

//   // Delete the staging file
//   const { error: deleteError } = await bucket.remove([stagingPath])
//   if (deleteError) {
//     // Log but don't fail - the copy succeeded, staging cleanup can happen later
//     console.warn(`Failed to delete staging file ${stagingPath}:`, deleteError)
//   }

//   return newPath
// }

// /**
//  * Deletes a storage object by its path
//  * @param client - Supabase client with admin privileges
//  * @param storagePath - The storage path to delete
//  */
// export async function deleteStorageObject(
//   client: SupabaseClient,
//   storagePath: string
// ): Promise<void> {
//   if (!storagePath) return

//   const bucket = client.storage.from(VENUE_IMAGES_BUCKET)
//   const { error } = await bucket.remove([storagePath])

//   if (error) {
//     console.warn(`Failed to delete storage object ${storagePath}:`, error)
//     // Don't throw - storage cleanup failures shouldn't block DB operations
//   }
// }

// /**
//  * Deletes all storage objects for a venue
//  * @param client - Supabase client with admin privileges
//  * @param venueId - The venue's UUID
//  */
// export async function deleteVenueImages(client: SupabaseClient, venueId: string): Promise<void> {
//   const bucket = client.storage.from(VENUE_IMAGES_BUCKET)
//   const prefix = `venues/${venueId}/`

//   // List all files in the venue's folder
//   const { data: files, error: listError } = await bucket.list(prefix.replace(/\/$/, ""), {
//     limit: 1000,
//   })

//   if (listError) {
//     console.warn(`Failed to list files for venue ${venueId}:`, listError)
//     return
//   }

//   if (!files || files.length === 0) {
//     return
//   }

//   // Delete all files
//   const filePaths = files.map((file) => `venues/${venueId}/${file.name}`)
//   const { error: deleteError } = await bucket.remove(filePaths)

//   if (deleteError) {
//     console.warn(`Failed to delete venue images for ${venueId}:`, deleteError)
//   }
// }

// /**
//  * Deletes multiple storage objects by their paths
//  * @param client - Supabase client with admin privileges
//  * @param storagePaths - Array of storage paths to delete
//  */
// export async function deleteStorageObjects(
//   client: SupabaseClient,
//   storagePaths: string[]
// ): Promise<void> {
//   if (!storagePaths.length) return

//   const bucket = client.storage.from(VENUE_IMAGES_BUCKET)
//   const { error } = await bucket.remove(storagePaths)

//   if (error) {
//     console.warn(`Failed to delete storage objects:`, error)
//   }
// }

import { SupabaseClient } from "@supabase/supabase-js"
import imageCompression from "browser-image-compression"

/** Supabase Storage bucket id (not the `venues/` folder inside it). Override if your dashboard name differs, e.g. a space: `NEXT_PUBLIC_SUPABASE_VENUE_IMAGES_BUCKET="venue images"`. */
export const VENUE_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_VENUE_IMAGES_BUCKET?.trim() || "venue-images"

// /**
//  * Derives the public URL for an image from its storage path
//  * @param storagePath - The storage path (e.g., "venues/abc-123/img-456.webp")
//  * @returns The full public URL for the image
//  */
export function getImagePublicUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.warn("NEXT_PUBLIC_SUPABASE_URL not configured")
    return null
  }

  return `${supabaseUrl}/storage/v1/object/public/${VENUE_IMAGES_BUCKET}/${storagePath}`
}

/** Browser-only compression; Server Actions run on Node where that library cannot run. */
export async function compressImage(file: File): Promise<File> {
  if (typeof window === "undefined") {
    return file
  }

  // const imageCompression = (await import("browser-image-compression")).default
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }

  return await imageCompression(file, options)
}

export async function uploadImageToStorage(
  supabase: SupabaseClient,
  file: File,
  venueId: string,
  imageId: string
): Promise<string> {
  const bucket = supabase.storage.from(VENUE_IMAGES_BUCKET)

  const extension = file.name.split(".").pop()
  const filePath = `venues/${venueId}/${imageId}.${extension}`

  const { error } = await bucket.upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  return filePath
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
      URL.revokeObjectURL(objectUrl) // cleanup
    }

    img.onerror = reject

    img.src = objectUrl
  })
}

/**
 * Deletes all storage objects for a venue
 * @param client - Supabase client with admin privileges
 * @param venueId - The venue's UUID
 */
export async function deleteVenueImages(client: SupabaseClient, venueId: string): Promise<void> {
  const bucket = client.storage.from(VENUE_IMAGES_BUCKET)
  const prefix = `venues/${venueId}/`

  // List all files in the venue's folder
  const { data: files, error: listError } = await bucket.list(prefix.replace(/\/$/, ""), {
    limit: 1000,
  })

  if (listError) {
    console.warn(`Failed to list files for venue ${venueId}:`, listError)
    return
  }

  if (!files || files.length === 0) {
    return
  }

  // Delete all files
  const filePaths = files.map((file) => `venues/${venueId}/${file.name}`)
  const { error: deleteError } = await bucket.remove(filePaths)

  if (deleteError) {
    console.warn(`Failed to delete venue images for ${venueId}:`, deleteError)
  }
}

/**
 * Deletes multiple storage objects by their paths
 * @param client - Supabase client with admin privileges
 * @param storagePaths - Array of storage paths to delete
 */
export async function deleteStorageObjects(
  client: SupabaseClient,
  storagePaths: string[]
): Promise<void> {
  if (!storagePaths.length) return

  const bucket = client.storage.from(VENUE_IMAGES_BUCKET)
  const { error } = await bucket.remove(storagePaths)

  if (error) {
    console.warn(`Failed to delete storage objects:`, error)
  }
}
