import RoleBasedRenderer from "@/components/common/RoleBasedRenderer"
import RenteeBookingsPage from "@/components/rentee/pages/RenteeBookingsPage"
import OwnerBookingsPage from "@/components/venue-onwer/pages/OwnerBookingsPage"

const Bookings = () => {
  return (
    <RoleBasedRenderer
      venueOwnerComponent={<OwnerBookingsPage />}
      renteeComponent={<RenteeBookingsPage />}
    />
  )
}

export default Bookings
