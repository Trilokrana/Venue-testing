"use client"

import { Building2, LayoutGrid } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Img = { id: string; url: string }

type Props = {
  images: Img[]
  onShowAll: () => void
  className?: string
}

export function VenueDetailGallery({ images, onShowAll, className }: Props) {
  const list = images ?? []
  const canOpenGallery = list.length > 1

  if (list.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-[21/9] min-h-[200px] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-400",
          className
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <Building2 className="size-12 opacity-50" />
          <span className="text-sm">No photos yet</span>
        </div>
      </div>
    )
  }

  if (list.length === 1) {
    return (
      <div
        className={cn(
          "relative aspect-[21/9] min-h-[220px] overflow-hidden rounded-xl md:min-h-[320px]",
          className
        )}
      >
        <Image
          src={list[0].url ?? null}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1152px"
        />
      </div>
    )
  }

  if (list.length === 2) {
    return (
      <div
        className={cn("grid grid-cols-1 gap-2 md:grid-cols-2 md:h-[min(400px,50vh)]", className)}
      >
        <div className="relative min-h-[200px] overflow-hidden rounded-xl md:min-h-0">
          <Image
            src={list[0].url ?? null}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        <div className="relative min-h-[200px] overflow-hidden rounded-xl md:min-h-0">
          <Image
            src={list[1].url}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {canOpenGallery ? <ShowAllPhotosButton onClick={onShowAll} extra={0} /> : null}
        </div>
      </div>
    )
  }

  if (list.length === 3) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="hidden gap-2 md:grid md:h-[min(400px,50vh)] md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:grid-rows-2">
          <div className="relative row-span-2 overflow-hidden rounded-xl">
            <Image
              src={list[0].url ?? null}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="66vw"
            />
          </div>
          <div className="relative min-h-0 overflow-hidden rounded-xl">
            <Image src={list[1].url} alt="" fill priority className="object-cover" sizes="33vw" />
          </div>
          <div className="relative min-h-0 overflow-hidden rounded-xl">
            <Image src={list[2].url} alt="" fill priority className="object-cover" sizes="33vw" />
            {canOpenGallery ? <ShowAllPhotosButton onClick={onShowAll} extra={0} /> : null}
          </div>
        </div>
        <div className="md:hidden">
          <div className="relative mb-2 aspect-[4/3] overflow-hidden rounded-xl">
            <Image
              src={list[0].url ?? null}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {list.slice(1).map((im) => (
              <div key={im.id} className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl">
                <Image src={im.url} alt="" fill className="object-cover" sizes="144px" />
              </div>
            ))}
            {canOpenGallery ? (
              <Button
                type="button"
                variant="outline"
                className="h-24 shrink-0 rounded-xl border-neutral-300 bg-white px-3 text-xs font-semibold shadow-sm"
                onClick={onShowAll}
              >
                <LayoutGrid className="mr-1.5 size-4" />
                All photos
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  // 4+ images: large left + 3 stacked right (desktop)
  const main = list[0]
  const r1 = list[1]
  const r2 = list[2]
  const r3 = list[3] ?? list[list.length - 1]
  const extraAfterFour = Math.max(0, list.length - 4)

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="hidden gap-2 md:grid md:h-[min(420px,52vh)] md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:grid-rows-3">
        <div className="relative row-span-3 overflow-hidden rounded-xl">
          <Image src={main.url} alt="" fill priority className="object-cover" sizes="66vw" />
        </div>
        <div className="relative min-h-0 overflow-hidden rounded-xl">
          <Image src={r1.url} alt="" fill priority className="object-cover" sizes="33vw" />
        </div>
        <div className="relative min-h-0 overflow-hidden rounded-xl">
          <Image src={r2.url} alt="" fill priority className="object-cover" sizes="33vw" />
        </div>
        <div className="relative min-h-0 overflow-hidden rounded-xl">
          <Image src={r3.url} alt="" fill priority className="object-cover" sizes="33vw" />
          {canOpenGallery ? (
            <>
              {extraAfterFour > 0 ? (
                <div className="absolute inset-0 bg-black/40" aria-hidden />
              ) : null}
              <ShowAllPhotosButton onClick={onShowAll} extra={extraAfterFour} />
            </>
          ) : null}
        </div>
      </div>

      {/* Mobile: hero + horizontal strip */}
      <div className="md:hidden">
        <div className="relative mb-2 aspect-[4/3] overflow-hidden rounded-xl">
          <Image src={main.url} alt="" fill priority className="object-cover" sizes="100vw" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.slice(1).map((im) => (
            <div key={im.id} className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl">
              <Image src={im.url} alt="" fill className="object-cover" sizes="144px" />
            </div>
          ))}
          {canOpenGallery ? (
            <Button
              type="button"
              variant="outline"
              className="h-24 shrink-0 rounded-xl border-neutral-300 bg-white px-3 text-xs font-semibold shadow-sm"
              onClick={onShowAll}
            >
              <LayoutGrid className="mr-1.5 size-4" />
              All photos
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function ShowAllPhotosButton({ onClick, extra }: { onClick: () => void; extra: number }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="absolute right-3 bottom-3 z-10 gap-2 rounded-xl border border-neutral-900/15 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-md hover:bg-neutral-50"
    >
      <LayoutGrid className="size-4" />
      Show all photos
      {extra > 0 ? <span className="text-neutral-500">+{extra}</span> : null}
    </Button>
  )
}
