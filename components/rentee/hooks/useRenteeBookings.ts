import { BookingFilters } from "@/schemas/booking.schema"
import { useRenteeBookingsQuery } from "../react-query/booking-queries"

export const useRenteeBookings = (filters: BookingFilters) => {
  const { data, isError, isLoading, ...rest } = useRenteeBookingsQuery(filters)
  return {
    data: data?.success ? data.data : null,
    isError,
    isLoading,
    ...rest,
  }
}
