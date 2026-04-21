"use client"

import BookingsPageSkeleton from "@/components/rentee/skeletons/BookingsPageSkeleton"
import { BookingsToolbar } from "@/components/rentee/ui/BookingsToolbar"
import { PaginationWithLinks } from "@/components/ui/pagination-with-links"
import { useSidebar } from "@/components/ui/sidebar"
import { useDebounce } from "@/hooks/use-debounce"
import { useModalControlQuery } from "@/hooks/use-modal-control-query"
import { BookingWithRelations } from "@/lib/bookings/types"
import { cn } from "@/lib/utils"
import { BookingFilters } from "@/schemas/booking.schema"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { useLayoutEffect, useMemo } from "react"
import BookingCard from "../cards/BookingCard"
import { useRenteeBookings } from "../hooks/useRenteeBookings"

const DEFAULT_META = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

const RenteeBookingsPage = () => {
  const { state } = useSidebar()
  const isSidebarOpen = state === "expanded"
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10))
  const [query, setQuery] = useQueryState("query", parseAsString.withDefault(""))

  const [view, setView] = useQueryState("mode", parseAsString.withDefault("grid"))
  const debouncedQuery = useDebounce(query, 800)

  const viewDialog = useModalControlQuery("view-venue-details")
  const editDialog = useModalControlQuery("edit-venue-details")
  const deleteDialog = useModalControlQuery("delete-venue-details")

  const filters: BookingFilters = useMemo(() => {
    const next: BookingFilters = { query: "" }
    if (debouncedQuery) next.query = debouncedQuery
    if (page != null) next.page = page
    if (perPage != null) next.perPage = perPage
    return next
  }, [page, perPage, debouncedQuery])

  const {
    data,
    isLoading: isInitialLoading,
    isRefetching,
    isError,
    error,
  } = useRenteeBookings(filters)

  const bookings = data?.items ?? []
  const meta = data?.meta ?? DEFAULT_META
  const hasBookings = data?.items?.length ?? 0 > 0
  console.log("🚀 ~ RenteeBookingsPage ~ bookings:", bookings)

  useLayoutEffect(() => {
    viewDialog.set(false)
    editDialog.set(false)
    deleteDialog.set(false)
  }, [])

  return (
    <div className="space-y-3">
      <BookingsToolbar
        isLoading={isInitialLoading || isRefetching}
        onSearch={(value) => {
          setPage(1)
          setQuery(value)
        }}
        onViewChange={(value) => {
          setView(value)
        }}
      />

      <section className="relative min-h-[520px]">
        {isError ? (
          <div className="flex min-h-[520px] items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-destructive">Failed to load Bookings</h3>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Could not load Bookings."}
              </p>
            </div>
          </div>
        ) : isInitialLoading ? (
          <BookingsPageSkeleton />
        ) : !hasBookings ? (
          <div className="flex min-h-[520px] items-center justify-center rounded-xl border border-dashed p-6 text-center">
            <div className="space-y-2">
              <h3 className="text-base font-semibold">No Bookings found</h3>
              <p className="text-sm text-muted-foreground">
                {debouncedQuery
                  ? "Try changing your search or clearing the filter."
                  : "You have not added any Bookings yet."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "grid grid-cols-1 gap-4 py-2 transition-opacity md:grid-cols-3 md:gap-6",
                isRefetching ? "opacity-60" : "opacity-100",
                !isSidebarOpen && "md:grid-cols-3",
                view === "list" &&
                  "grid grid-cols-1 gap-4 py-2 transition-opacity md:grid-cols-2 md:gap-6",
                view === "list" &&
                  !isSidebarOpen &&
                  "grid grid-cols-1 gap-4 py-2 transition-opacity md:grid-cols-2 md:gap-6"
              )}
            >
              {bookings?.map((booking: BookingWithRelations) => (
                <BookingCard key={booking.id} booking={booking} listView={view === "list"} />
              ))}
            </div>

            {isRefetching && (
              <div className="pointer-events-none absolute inset-0 flex items-start justify-center rounded-xl bg-background/30 pt-6 backdrop-blur-[1px]">
                <div className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm">
                  Updating Bookings...
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <PaginationWithLinks
        totalCount={meta.total}
        page={meta.page}
        pageSize={meta.pageSize}
        pageSearchParam="page"
        pageSizeSelectOptions={{
          pageSizeSearchParam: "perPage",
          pageSizeOptions: [10, 20, 50, 100],
        }}
      />
    </div>
  )
}

export default RenteeBookingsPage
