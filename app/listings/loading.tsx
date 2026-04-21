import { VenueListingCardSkeleton } from "@/components/listings/venue-listing-card-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function ListingsLoading() {
  return (
    <div className="min-h-screen bg-background text-base">
      <nav className="sticky top-0 z-40 border-b border-primary/15 bg-gray-50 shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl justify-center px-4 py-3 md:px-6 lg:px-8">
          <Skeleton className="h-[58px] w-full max-w-4xl rounded-2xl" />
        </div>
      </nav>

      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-4 flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <Skeleton className="h-5 w-[320px]" />
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-4 sm:gap-5">
            <Skeleton className="h-10 w-40 rounded-xl" />
            <Skeleton className="h-10 w-56 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
          <div className="min-h-0 min-w-0 flex-1 basis-0 lg:min-w-0">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <VenueListingCardSkeleton key={i} />
              ))}
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-col lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:max-h-[calc(100vh-6rem)] lg:w-[min(100%,360px)] lg:max-w-[360px] lg:shrink-0 lg:self-start">
            <Skeleton className="h-[360px] w-full flex-1 rounded-xl lg:min-h-0" />
          </div>
        </div>
      </div>
    </div>
  )
}
