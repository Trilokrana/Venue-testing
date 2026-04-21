"use client"
import { PaginatedResult } from "@/lib/supabase/utils"
import { deleteVenue, getMyVenueBySlug, getMyVenues, updateVenue } from "@/lib/venues/actions"
import { VenueWithRelations } from "@/lib/venues/types"
import { UpdateVenue, VenueFilters } from "@/schemas/venue.schema"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const useMyVenuesQuery = (filters: VenueFilters) => {
  return useQuery<PaginatedResult<VenueWithRelations>>({
    queryKey: ["venues", filters],
    queryFn: () => getMyVenues(filters),
  })
}

function assertVenueBySlugResult(
  result: Awaited<ReturnType<typeof getMyVenueBySlug>>
): asserts result is { success: true; data: VenueWithRelations; statusCode: number } {
  if (!result.success) {
    const err = new Error(result.error)
    ;(err as Error & { statusCode: number }).statusCode = result.statusCode
    throw err
  }
}

export const useGetVenueBySlugQuery = (slug: string) => {
  const trimmed = slug?.trim() ?? ""
  return useQuery<VenueWithRelations>({
    queryKey: ["single-venue", trimmed],
    queryFn: async () => {
      const result = await getMyVenueBySlug(trimmed)
      assertVenueBySlugResult(result)
      return result.data
    },
    enabled: trimmed.length > 0,
    retry: false,
  })
}

export const useEditMyVenueMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["edit-venue"],
    mutationFn: async ({ id, data }: { id: string; data: Omit<UpdateVenue, "id"> }) => {
      return await updateVenue(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] })
      queryClient.invalidateQueries({ queryKey: ["single-venue"] })
    },
  })
}

export const useDeleteMyVenueMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["delete-venue"],
    mutationFn: async (id: string) => {
      return await deleteVenue(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] })
    },
  })
}
