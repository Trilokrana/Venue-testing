"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useModalControlQuery } from "@/hooks/use-modal-control-query"
import { VenueWithRelations } from "@/lib/venues/types"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { VenueCard } from "../cards/VenueCard"

interface DeleteVenueModalProps {
  venue: VenueWithRelations
  dialogControl: ReturnType<typeof useModalControlQuery>
  onConfirm: (id: string) => Promise<void>
  isLoading: boolean
}

export function DeleteVenueModal({
  venue,
  dialogControl,
  onConfirm,
  isLoading,
}: DeleteVenueModalProps) {
  const [value, setValue] = useState<string>("")
  useEffect(() => {
    if (!dialogControl?.control.open) {
      setTimeout(() => {
        setValue("")
      }, 100)
    }
  }, [dialogControl?.control.open])
  return (
    <AlertDialog
      open={dialogControl?.control.open}
      onOpenChange={dialogControl?.control.onOpenChange}
    >
      <AlertDialogContent
        onEscapeKeyDown={(e) => {
          e.preventDefault()
        }}
        className="flex max-h-[min(600px,90dvh)] flex-col sm:max-w-md"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            This action cannot be undone. This will permanently delete the venue from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ScrollArea className="flex max-h-full flex-col overflow-hidden">
          <div className="mb-4">
            <p className="text-sm">
              Please Type <span className="text-destructive">{venue?.name}</span> to confirm
            </p>
            <Input
              type="text"
              placeholder="Enter the name of the venue to delete"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-2"
            />
          </div>
          <VenueCard venue={venue} />
        </ScrollArea>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={async (e) => {
              e.preventDefault() // 🚀 STOP auto close
              if (value !== venue?.name) {
                toast.error("Please enter the correct name")
                return
              }
              await onConfirm(venue.id)
            }}
            disabled={isLoading || value !== venue?.name}
          >
            {isLoading ? (
              <>
                Deleting...
                <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : (
              "Delete Venue"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
