import { formatLocationLine } from "@/app/listings/data"
import ErrorState from "@/components/common/ErrorState"
import { VenueDetailGallery } from "@/components/listings/venue-detail-gallery"
import { VenuePhotosOverlay } from "@/components/listings/venue-photos-overlay"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeleteMyVenue } from "@/components/venue-onwer/hooks/useMyVenues"
import { DeleteVenueModal } from "@/components/venue-onwer/modal/DeleteVenueModal"
import { EditVenueModal } from "@/components/venue-onwer/modal/EditVenueModal"
import { VenueFormOutput } from "@/form/update-venues"
import { useModalControlQuery } from "@/hooks/use-modal-control-query"
import { cn } from "@/lib/utils"
import { VenueAddress, VenueWithRelations } from "@/lib/venues/types"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleCheck,
  Clock,
  Expand,
  ExternalLink,
  Globe2,
  MapPin,
  Pencil,
  ShieldCheck,
  Sparkles,
  Trash,
  Users,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Fragment, useState } from "react"
import { toast } from "sonner"

const SingleVenueView = ({
  venue,
  isLoading,
  isError,
  errorMessage,
  showEditButton = true,
  showDeleteButton = true,
  showCalendarButton = true,
  showBackButton = true,
}: {
  venue: VenueWithRelations | null | undefined
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  showEditButton?: boolean
  showDeleteButton?: boolean
  showCalendarButton?: boolean
  showBackButton?: boolean
}) => {
  const { mutateAsync: deleteVenue, isPending: isPendingDeleteVenue } = useDeleteMyVenue()
  const router = useRouter()

  const calendarOk = venue?.calendar_sync === "connected"
  const isBooked = venue?.is_booked === true

  const deleteDialog = useModalControlQuery("delete-venue-details")
  const editDialog = useModalControlQuery("edit-venue-details")

  const [selectedVenue, setSelectedVenue] = useState<VenueWithRelations | null>(null)
  const [photosOpen, setPhotosOpen] = useState(false)

  const galleryImages = venue?.images?.map((image) => ({ id: image.id, url: image.url ?? "" })) ?? [
    { id: "hero-fallback", url: "" },
  ]
  const isSocialMediaLinksAvailable =
    venue?.social_media_links?.length && venue?.social_media_links?.length > 0

  if (isLoading) return <VenueDetailsSkeleton />

  if (isError)
    return (
      <ErrorState
        title="Something went wrong while loading this venue."
        description={errorMessage ?? "Something went wrong while loading this venue."}
      />
    )

  return (
    <Fragment>
      {showBackButton && (
        <Button
          className="sticky top-0 z-50"
          variant="ghost"
          size="sm"
          onClick={() => router.push("/venues")}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
      )}
      <div className="mx-auto space-y-8 w-full max-w-6xl">
        <VenueDetailGallery images={galleryImages} onShowAll={() => setPhotosOpen(true)} />

        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                aria-label="Venue type"
                className="capitalize border p-4 border-border"
              >
                {venue?.venue_type?.split("_").join(" ")}
              </Badge>
              {venue?.instabook ? (
                <Badge className="bg-primary p-4">
                  <Zap className="size-4" />
                  Instant book
                </Badge>
              ) : null}

              <Badge
                variant={venue?.is_active ? "default" : "destructive"}
                className={cn(venue?.is_active ? "bg-green-500 p-4" : "bg-destructive p-4")}
              >
                <CircleCheck className="size-4" />
                {venue?.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {showEditButton && (
                <Button
                  variant={"outline"}
                  size="sm"
                  className="border-green-500"
                  onClick={() => {
                    if (venue) {
                      setSelectedVenue(venue as VenueWithRelations)
                      editDialog.set(true)
                    }
                  }}
                >
                  <Pencil className="h-4 w-4 text-green-500" />
                </Button>
              )}
              {showDeleteButton && (
                <Button
                  variant={"outline"}
                  size="sm"
                  className="border-destructive"
                  onClick={() => {
                    setSelectedVenue(venue as VenueWithRelations)
                    deleteDialog.set(true)
                  }}
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
          <h1 className="wrap-break-word text-2xl font-semibold tracking-tight md:text-3xl">
            {venue?.name}
          </h1>
          <h4 className="wrap-break-word text-md font-medium tracking-tight md:text-lg text-muted-foreground">
            slug : {venue?.slug}
          </h4>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
            {venue?.rating != null ? (
              <span className="font-medium">★ {venue?.rating}</span>
            ) : (
              <span>No Reviews yet.</span>
            )}
            <span className="inline-flex items-center gap-1 ">
              <MapPin className="size-5 shrink-0" />
              {formatLocationLine(venue?.addresses as VenueAddress)}
            </span>
          </div>
          <div className="border-y border-neutral-200 py-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white">
                  <Clock className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Min booking length</p>
                  <p className="text-xl font-bold">
                    {venue?.min_hours != null ? `${venue?.min_hours} hr minimum` : "Ask host"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white">
                  <Users className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Cast & Crew</p>
                  <p className="text-xl font-bold">
                    {venue?.capacity != null
                      ? `${venue?.capacity.toLocaleString()} people`
                      : "Ask host"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white">
                  <Expand className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Square footage</p>
                  <p className="text-xl font-bold">
                    {venue?.square_footage != null
                      ? `${venue?.square_footage.toLocaleString()} sq/ft`
                      : "Ask host"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showCalendarButton && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-5">
            {/* Left: Calendar Status + Action */}
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant={calendarOk ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <a
                  href={`/api/cronofy/start-connect?venue_id=${venue?.id}`}
                  target="_top"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CalendarDays className="size-4" />

                  {calendarOk ? (
                    <>
                      <CheckCircle2 className="size-4 text-green-500" />
                      Connected
                    </>
                  ) : (
                    "Connect Calendar"
                  )}
                </a>
              </Button>

              {/* Status text */}
              <span className="text-xs text-muted-foreground">
                {calendarOk
                  ? "Your calendar is synced"
                  : "Sync your calendar to manage availability"}
              </span>
            </div>

            {/* Right: Availability button */}
            <Button asChild variant="secondary" size="sm">
              <Link href={`/venues/${venue?.id}/calendar`} onClick={(e) => e.stopPropagation()}>
                Availability Calendar
              </Link>
            </Button>
          </div>
        )}

        <Card className="gap-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="size-5 text-amber-500" />
              About this space
            </CardTitle>
          </CardHeader>
          <CardContent className="text-md leading-relaxed">
            {venue?.description ? (
              <p>{venue?.description}</p>
            ) : (
              <p className="text-muted-foreground">The host has not added a description yet.</p>
            )}
          </CardContent>
        </Card>

        {venue?.amenities?.length && venue?.amenities?.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-wrap gap-2">
                {venue?.amenities?.map((a) => (
                  <li key={a}>
                    <Badge
                      variant="secondary"
                      className="rounded-full p-3 font-normal capitalize text-muted-foreground"
                    >
                      {a.replace(/_/g, " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                <Clock className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-md font-semibold text-muted-foreground">Hours</p>
                <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                  {venue?.hours_of_operation ?? "Ask the host"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                <ShieldCheck className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-md font-semibold text-muted-foreground">Cancellation</p>
                <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                  {venue?.cancellation_policy ?? "Ask the host"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isSocialMediaLinksAvailable ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Globe2 className="size-5" />
                Social Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {venue?.social_media_links?.map((link: string, index: number) => (
                  <li key={index}>
                    <Link
                      href={link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {link}
                      <ExternalLink className="size-4 text-blue-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>
      {photosOpen && (
        <VenuePhotosOverlay
          open={photosOpen}
          onClose={() => setPhotosOpen(false)}
          images={galleryImages}
        />
      )}
      {deleteDialog.state && (
        <DeleteVenueModal
          isLoading={isPendingDeleteVenue}
          venue={selectedVenue as VenueWithRelations}
          dialogControl={deleteDialog}
          onConfirm={async (id) => {
            const result = await deleteVenue(id as string)

            if (result) {
              deleteDialog.set(false)
              toast.success("Venue deleted successfully")
              router.push("/venues")
              router.refresh()
            } else {
              toast.error("Failed to delete venue")
            }
          }}
        />
      )}

      {editDialog?.state && (
        <EditVenueModal
          venue={selectedVenue as VenueWithRelations}
          dialogControl={editDialog}
          onSuccess={(data: VenueFormOutput) => {
            if (data.slug !== venue?.slug) {
              setTimeout(() => {
                router.replace(`/venues/${data.slug}`)
              }, 100)
            }
          }}
        />
      )}
    </Fragment>
  )
}

export default SingleVenueView

const VenueDetailsSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Image / Banner */}
      <Skeleton className="w-full h-[300px] rounded-xl" />

      {/* Title + badges */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>

        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-40" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>

      {/* About section */}
      <div className="space-y-3 border rounded-xl p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Amenities */}
      <div className="space-y-3 border rounded-xl p-4">
        <Skeleton className="h-5 w-32" />

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Hours + Cancellation */}
      <div className="space-y-3 border rounded-xl p-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-40" />

        <Skeleton className="h-5 w-32 mt-4" />
        <Skeleton className="h-4 w-52" />
      </div>
    </div>
  )
}
