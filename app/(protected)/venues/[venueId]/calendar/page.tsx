import { AvailabilityCalendar } from "@/components/venues/availability-calendar"
import { createVenueBlock, deleteVenueBlock, getVenueCalendar } from "@/lib/venues/calendar-actions"
import { Loader2 } from "lucide-react"
import { Suspense } from "react"

export default async function VenueCalendarPage(props: {
  params: Promise<{ venueId: string }> | { venueId: string }
}) {
  const params = await props.params
  const { venueId } = params
  const data = await getVenueCalendar(venueId)

  if (!data.success) {
    return <div>Failed to load calendar.</div>
  }

  return (
    <div className="container mx-auto max-w-[1400px] px-4 pt-3 pb-8 md:pt-4 md:pb-10">
      <div className="mb-4 md:mb-5">
        <h1 className="text-3xl font-bold tracking-tight">Availability Calendar</h1>
        <p className="text-muted-foreground mt-2">
          Manage when your venue is available for bookings. Select dates to block them out.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        }
      >
        <AvailabilityCalendar
          venueId={venueId}
          initialBlocks={data.blocks || []}
          initialBookings={data.bookings || []}
          initialExternalEvents={data.externalEvents || []}
          hasCronofySync={data.hasCronofySync}
          createBlockAction={createVenueBlock}
          deleteBlockAction={deleteVenueBlock}
        />
      </Suspense>
    </div>
  )
}
