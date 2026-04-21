"use client"
import { deleteBooking, getOwnerBookings, updateBooking } from "@/lib/bookings/actions"
import { BookingWithRelations } from "@/lib/bookings/types"
import { PaginatedResult } from "@/lib/supabase/utils"
import { BookingFilters, CreateBooking } from "@/schemas/booking.schema"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type MyBookingsQueryData = Awaited<ReturnType<typeof getOwnerBookings>>

export const useOwnerBookingsQuery = (filters: BookingFilters) => {
  return useQuery<PaginatedResult<BookingWithRelations>>({
    queryKey: ["owner-bookings", filters],
    queryFn: () => getOwnerBookings(filters),
  })
}

export const useEditMyBookingMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["edit-booking"],
    mutationFn: async ({ id, data }: { id: string; data: Omit<CreateBooking, "id"> }) => {
      return await updateBooking(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
    },
  })
}

export const useDeleteMyVenueMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["delete-venue"],
    mutationFn: async (id: string) => {
      return await deleteBooking(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] })
    },
  })
}
