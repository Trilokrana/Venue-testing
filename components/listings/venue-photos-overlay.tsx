"use client"

import Image from "next/image"
import * as React from "react"
import { createPortal } from "react-dom"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

type Img = { id: string; url: string }

type Props = {
  open: boolean
  onClose: () => void
  images: Img[]
}

export function VenuePhotosOverlay({ open, onClose, images }: Props) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!mounted || !open) return null

  const list = images ?? []

  const node = (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="All photos"
    >
      <header className="flex shrink-0 items-center border-b border-neutral-200 bg-white px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          className="gap-2 text-neutral-800 -ml-2"
          onClick={onClose}
        >
          <ChevronLeft className="size-5" />
          Back
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-4 pb-12">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 md:gap-3">
            {list.map((im) => (
              <div
                key={im.id}
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100"
              >
                <Image
                  src={im.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
