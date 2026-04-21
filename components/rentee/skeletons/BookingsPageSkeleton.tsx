import BookingCardSkeleton from "@/components/rentee/skeletons/BookingCardSkeleton"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const BookingsPageSkeleton = ({ className, count = 9 }: { className?: string; count?: number }) => {
  const isSidebarOpen = useSidebar()
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6",
        !isSidebarOpen && "md:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <BookingCardSkeleton key={index} />
      ))}
    </div>
  )
}

export default BookingsPageSkeleton
