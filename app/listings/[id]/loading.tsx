import { Skeleton } from "@/components/ui/skeleton"

export default function VenueDetailLoading() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="border-b border-neutral-200 bg-white">
        <div className="w-full px-4 py-3 md:px-6 lg:px-8">
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 md:px-6 md:pt-6">
        <Skeleton className="h-[320px] w-full rounded-xl md:h-[420px]" />

        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>

        <div className="mt-10 flex flex-col-reverse gap-8 lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-10">
          <div className="space-y-8 min-w-0">
            <Skeleton className="h-52 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
