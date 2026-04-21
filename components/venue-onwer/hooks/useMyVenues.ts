import {
  useDeleteMyVenueMutation,
  useEditMyVenueMutation,
  useGetVenueBySlugQuery,
  useMyVenuesQuery,
} from "@/components/venue-onwer/react-query/venue-queries"
import { VenueFilters } from "@/schemas/venue.schema"

export const useMyVenues = (filters: VenueFilters) => {
  const { data, isError, isLoading, ...rest } = useMyVenuesQuery(filters)
  return {
    data: data?.success ? data.data : null,
    isError,
    isLoading,
    ...rest,
  }
}

export const useGetVenueBySlug = (slug: string) => {
  const { data, isError, isLoading, error, ...rest } = useGetVenueBySlugQuery(slug as string)
  return {
    data: data ?? null,
    isError,
    isLoading,
    apiError: isError && error instanceof Error ? error.message : null,
    error,
    ...rest,
  }
}

export const useEditMyVenue = () => {
  const { mutate, mutateAsync, isPending, ...rest } = useEditMyVenueMutation()
  return {
    mutate,
    mutateAsync,
    isPending,
    ...rest,
  }
}

export const useDeleteMyVenue = () => {
  const { mutate, mutateAsync, isPending, ...rest } = useDeleteMyVenueMutation()
  return {
    mutate,
    mutateAsync,
    isPending,
    ...rest,
  }
}
