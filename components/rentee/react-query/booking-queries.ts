"use client"
import { getRenteeBookings } from "@/lib/bookings/actions"
import { BookingWithRelations } from "@/lib/bookings/types"
import { PaginatedResult } from "@/lib/supabase/utils"
import { BookingFilters } from "@/schemas/booking.schema"
import { useQuery } from "@tanstack/react-query"

export const useRenteeBookingsQuery = (filters: BookingFilters) => {
  return useQuery<PaginatedResult<BookingWithRelations>>({
    queryKey: ["rentee-bookings", filters],
    queryFn: () => getRenteeBookings(filters),
  })
}
