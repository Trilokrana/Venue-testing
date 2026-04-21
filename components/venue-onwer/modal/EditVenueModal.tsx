"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import UpdateVenueForm, { VenueFormOutput } from "@/form/update-venues"
import { useModalControlQuery } from "@/hooks/use-modal-control-query"
import { mapVenueToCreateFormDefaults } from "@/lib/venues/map-venue-to-form-defaults"
import { VenueWithRelations } from "@/lib/venues/types"
import { Loader2 } from "lucide-react"

interface EditVenueModalProps {
  venue: VenueWithRelations
  dialogControl: ReturnType<typeof useModalControlQuery>
  isLoading?: boolean
  onSuccess?: (data: VenueFormOutput) => void
}

export function EditVenueModal({
  venue,
  dialogControl,
  isLoading = false,
  onSuccess,
}: EditVenueModalProps) {
  return (
    <Dialog open={dialogControl?.control.open} onOpenChange={dialogControl?.control.onOpenChange}>
      <DialogContent
        showCloseButton={!isLoading}
        className="
          flex max-h-dvh w-screen flex-col overflow-hidden p-0
          max-w-screen sm:max-w-xl lg:max-w-6xl
          gap-0
        "
        onInteractOutside={(e) => isLoading && e.preventDefault()}
        onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="text-lg font-semibold">
            Edit Venue Details of {venue?.name} {isLoading ? "Loading..." : ""}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <UpdateVenueForm
                venueId={venue?.id}
                defaultValues={mapVenueToCreateFormDefaults(venue)}
                onSuccess={onSuccess}
                // className="p-6"
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
