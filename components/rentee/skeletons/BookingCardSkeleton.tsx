import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
const BookingCardSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("space-y-3 rounded-xl border bg-background p-3", className)}>
      <Skeleton className="aspect-16/10 w-full rounded-lg" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  )
}

export default BookingCardSkeleton
