"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useModalControlQuery } from "@/hooks/use-modal-control-query"
import { VenueWithRelations } from "@/lib/venues/types"
import SingleVenueView from "../ui/single-venue-view"

interface ViewVenueModalProps {
  venue: VenueWithRelations
  dialogControl: ReturnType<typeof useModalControlQuery>
}

export function ViewVenueModal({ venue, dialogControl }: ViewVenueModalProps) {
  return (
    <Dialog open={dialogControl?.control.open} onOpenChange={dialogControl?.control.onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="
          flex max-h-[95dvh] w-screen flex-col overflow-hidden p-0
          max-w-screen sm:max-w-xl lg:max-w-6xl
          gap-0
        "
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="text-lg font-semibold">View Venue Details</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <SingleVenueView
            venue={venue}
            isLoading={false}
            isError={false}
            errorMessage={undefined}
            showEditButton={false}
            showDeleteButton={false}
          />
        </div>
        <DialogFooter className="shrink-0 border-t px-6 py-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              dialogControl?.set(false)
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
