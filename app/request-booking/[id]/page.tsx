import { notFound } from "next/navigation"
import { fetchVenueById } from "@/lib/venues/queries"
import { RequestBookingView } from "./request-booking-view"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function RequestBookingPage({ params }: PageProps) {
  const { id } = await params
  const venue = await fetchVenueById(id)

  if (!venue) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <RequestBookingView venue={venue} />
      </div>
    </div>
  )
}