import { Database } from "@/lib/supabase/database.types"
import { VenueWithRelations } from "../venues/types"

export type Booking = Database["public"]["Tables"]["bookings"]["Row"]

export type BookingWithRelations = Booking & {
  venue: VenueWithRelations
  rentee: Database["public"]["Tables"]["users"]["Row"]
  owner: Database["public"]["Tables"]["users"]["Row"]
}
