import z from "zod"

// Base venue fields schema
const bookingBaseSchema = z.object({
  venue_id: z.string().uuid(),
  rentee_id: z.string().uuid(),
  owner_id: z.string().uuid(),
  cronofy_event_id: z.string().uuid(),
  start_at: z.date(),
  end_at: z.date(),
  hourly_rate: z.number().positive(),
  total_hours: z.number().positive(),
  total_amount: z.number().positive(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
})

// Create venue schema (without id)
export const createBookingSchema = bookingBaseSchema
export type CreateBooking = z.infer<typeof createBookingSchema>

// Delete venue schema
export const deleteBookingSchema = z.object({
  id: z.string().uuid(),
})

export type DeleteBooking = z.infer<typeof deleteBookingSchema>

// Venue filters schema
export const bookingFiltersSchema = z.object({
  query: z.string().optional().default("").nullable(),
  status: z.string().optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
  sort_column: z.string().optional(),
  created_at: z.string().optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
})

export type BookingFilters = z.infer<typeof bookingFiltersSchema> & {
  page?: number | null
  perPage?: number | null
}
