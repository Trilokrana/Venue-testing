import { BookingFilters } from "@/schemas/booking.schema"
import { useEditMyBookingMutation, useOwnerBookingsQuery } from "../react-query/bookings-queries"

export const useOwnerBookings = (filters: BookingFilters) => {
  const { data, isError, isLoading, ...rest } = useOwnerBookingsQuery(filters)
  return {
    data: data?.success ? data.data : null,
    isError,
    isLoading,
    ...rest,
  }
}

export const useEditMyBooking = () => {
  const { mutate, mutateAsync, isPending, ...rest } = useEditMyBookingMutation()
  return {
    mutate,
    mutateAsync,
    isPending,
    ...rest,
  }
}
