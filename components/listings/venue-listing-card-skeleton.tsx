import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
}

export function VenueListingCardSkeleton({ className }: Props) {
  return (
    <article className={cn("overflow-hidden rounded-sm border bg-gray-50 p-2", className)}>
      <div className="relative h-[140px] sm:h-[180px] md:h-[200px] overflow-hidden rounded">
        <Skeleton className="h-full w-full rounded" />
      </div>

      <div className="space-y-1.5 px-2 pt-3 pb-1">
        <Skeleton className="h-7 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-8 w-1/2 pt-2" />
      </div>
    </article>
  )
}
