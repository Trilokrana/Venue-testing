"use client"

import { useGetVenueBySlug } from "@/components/venue-onwer/hooks/useMyVenues"
import SingleVenueView from "@/components/venue-onwer/ui/single-venue-view"
import { useParams } from "next/navigation"

const SingleVenuePage = () => {
  const { venueId } = useParams()
  const {
    data: venue,
    isError,
    isLoading,
    apiError,
  } = useGetVenueBySlug(venueId as string)
  return (
    <SingleVenueView
      venue={venue}
      isLoading={isLoading}
      isError={isError}
      errorMessage={apiError ?? undefined}
    />
  )
}

export default SingleVenuePage
