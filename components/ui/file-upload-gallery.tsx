"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Sortable, SortableItem, SortableItemHandle } from "@/components/reui/sortable"
import {
  formatBytes,
  useFileUpload,
  type FileMetadata,
  type FileWithPreview,
} from "@/hooks/use-file-upload"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import {
  CircleAlertIcon,
  CloudUploadIcon,
  GripVerticalIcon,
  ImageIcon,
  UploadIcon,
  XIcon,
  ZoomInIcon,
} from "lucide-react"

type UploadStatus = "idle" | "uploading" | "completed" | "error"
type UploadItem = { progress: number; status: UploadStatus; error?: string }

interface FileUploadProps {
  maxFiles?: number
  maxSize?: number
  accept?: string
  multiple?: boolean
  className?: string
  onFilesChange?: (files: FileWithPreview[]) => void
  initialFiles?: FileMetadata[]
  compressImage?: boolean
}

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Failed to load image: ${file.name}`))
    }

    img.src = objectUrl
  })

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to generate compressed image blob"))
          return
        }
        resolve(blob)
      },
      type,
      quality
    )
  })

async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file

  // Keep gif/svg untouched to avoid animation/vector issues
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return file
  }

  try {
    const img = await loadImage(file)

    const maxDimension = 1920
    let { width, height } = img

    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    }

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")
    if (!ctx) return file

    ctx.drawImage(img, 0, 0, width, height)

    // const outputType = file.type === "image/png" ? "image/jpeg" : file.type || "image/jpeg"
    const outputType = file.type || "image/jpeg"
    const quality = outputType === "image/jpeg" || outputType === "image/webp" ? 0.82 : 0.9

    const blob = await canvasToBlob(canvas, outputType, quality)

    // Only replace if compression actually helps
    if (blob.size >= file.size) {
      return file
    }

    const nextName =
      outputType === "image/jpeg" && file.name.toLowerCase().endsWith(".png")
        ? file.name.replace(/\.png$/i, ".jpg")
        : file.name

    return new File([blob], nextName, {
      type: outputType,
      lastModified: Date.now(),
    })
  } catch {
    return file
  }
}

export function FileUploadGallery({
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  accept = "image/*",
  multiple = true,
  className,
  onFilesChange,
  initialFiles,
  compressImage = true,
}: FileUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [upload, setUpload] = useState<Record<string, UploadItem>>({})
  const [orderedIds, setOrderedIds] = useState<string[]>([])
  const uploadTimersRef = useRef<Record<string, number>>({})

  const defaultImages: FileMetadata[] = [
    // {
    //   id: "default-1",
    //   name: "default-1.jpg",
    //   size: 42144,
    //   type: "image/jpeg",
    //   url: "https://picsum.photos/1000/800?grayscale&random=6",
    // },
  ]

  const [
    { files, isDragging, errors },
    {
      removeFile,
      clearFiles,
      reorderFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles,
    maxSize,
    accept,
    multiple,
    initialFiles: initialFiles || defaultImages,
    onFilesChange,
    transformFiles: async (incomingFiles) => {
      if (!compressImage) return incomingFiles

      return Promise.all(
        incomingFiles.map(async (file) => {
          if (!file.type.startsWith("image/")) return file
          return compressImageFile(file)
        })
      )
    },
    onFilesAdded: (added) => {
      for (const f of added) {
        if (f.file instanceof File) {
          setUpload((prev) => ({
            ...prev,
            [f.id]: { progress: 0, status: "idle" },
          }))
        } else {
          setUpload((prev) => ({
            ...prev,
            [f.id]: { progress: 100, status: "completed" },
          }))
        }
      }
    },
  })

  useEffect(() => {
    setUpload((prev) => {
      const next = { ...prev }
      for (const f of files) {
        if (!next[f.id] && !(f.file instanceof File)) {
          next[f.id] = { progress: 100, status: "completed" }
        }
      }
      return next
    })
  }, [files])

  useEffect(() => {
    setOrderedIds((prev) => {
      const existing = prev.filter((id) => files.some((f) => f.id === id))
      const additions = files.map((f) => f.id).filter((id) => !existing.includes(id))
      return [...existing, ...additions]
    })
  }, [files])

  const filesById = useMemo(() => new Map(files.map((f) => [f.id, f])), [files])

  const orderedFiles = useMemo(
    () => orderedIds.map((id) => filesById.get(id)).filter(Boolean) as FileWithPreview[],
    [orderedIds, filesById]
  )

  const handleRemove = useCallback(
    (id: string) => {
      const t = uploadTimersRef.current[id]
      if (t) {
        window.clearInterval(t)
        delete uploadTimersRef.current[id]
      }

      setUpload((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })

      removeFile(id)
    },
    [removeFile]
  )

  const handleClearAll = useCallback(() => {
    for (const t of Object.values(uploadTimersRef.current)) {
      window.clearInterval(t)
    }

    uploadTimersRef.current = {}
    setUpload({})
    setOrderedIds([])
    clearFiles()
  }, [clearFiles])

  useEffect(() => {
    const liveIds = new Set(orderedFiles.map((f) => f.id))

    for (const [id, t] of Object.entries(uploadTimersRef.current)) {
      if (!liveIds.has(id)) {
        window.clearInterval(t)
        delete uploadTimersRef.current[id]
      }
    }

    for (const f of orderedFiles) {
      if (!(f.file instanceof File)) continue
      if (uploadTimersRef.current[f.id]) continue

      const current = upload[f.id]
      if (current?.status === "completed") continue

      setUpload((prev) => ({
        ...prev,
        [f.id]: { progress: prev[f.id]?.progress ?? 0, status: "uploading" },
      }))

      const t = window.setInterval(() => {
        setUpload((prev) => {
          const cur = prev[f.id]
          if (!cur || cur.status !== "uploading") return prev

          const nextProgress = Math.min(100, cur.progress + 8 + Math.random() * 10)
          const nextStatus: UploadStatus = nextProgress >= 100 ? "completed" : "uploading"

          const next = {
            ...prev,
            [f.id]: { ...cur, progress: nextProgress, status: nextStatus },
          }

          if (nextStatus === "completed") {
            const timer = uploadTimersRef.current[f.id]
            if (timer) {
              window.clearInterval(timer)
              delete uploadTimersRef.current[f.id]
            }
          }

          return next
        })
      }, 180)

      uploadTimersRef.current[f.id] = t
    }
  }, [orderedFiles, upload])

  const isImage = (file: File | FileMetadata) => {
    const type = file.type
    return type.startsWith("image/")
  }

  return (
    <div className={cn("w-full", className)}>
      <Card
        className={cn(
          "rounded-md border-dashed shadow-none transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="text-center">
          <input {...getInputProps()} className="sr-only" />
          <div className="border-border mx-auto mb-3 flex size-[32px] items-center justify-center rounded-full border">
            <CloudUploadIcon className="size-4" />
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl text-foreground mb-0.5 font-medium">
              Upload Images to Gallery
            </h3>
            <p>Drag and drop images here or click to browse</p>

            <span className="text-secondary-foreground mb-3 block text-xs font-normal">
              PNG, JPG, GIF up to 5MB each (max 10 files)
            </span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button type="button" size="sm" onClick={openFileDialog}>
              <UploadIcon className="h-4 w-4" />
              Browse File
            </Button>

            {orderedFiles.length > 0 && (
              <Button type="button" size="sm" variant="outline" onClick={handleClearAll}>
                Clear all
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Sortable
          value={orderedIds}
          onValueChange={(ids) => {
            setOrderedIds(ids)
            reorderFiles(ids)
          }}
          getItemValue={(item) => item}
          strategy="grid"
          className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          {orderedFiles.map((fileItem) => {
            const meta = upload[fileItem.id]
            const status = meta?.status ?? (fileItem.file instanceof File ? "idle" : "completed")
            const progress = meta?.progress ?? (status === "completed" ? 100 : 0)

            return (
              <SortableItem key={fileItem.id} value={fileItem.id} className="space-y-4">
                <div className="bg-background group/item border-border hover:bg-accent/70 rounded-md relative flex aspect-square shrink-0 items-center justify-center border shadow-none transition-all duration-200 hover:z-10 data-[dragging=true]:z-50">
                  {isImage(fileItem.file) && fileItem.preview ? (
                    <img
                      src={fileItem.preview}
                      className="rounded-md pointer-events-none h-full w-full object-cover"
                      alt={fileItem.file.name}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="text-muted-foreground size-6" />
                    </div>
                  )}

                  <SortableItemHandle className="absolute inset-s-2 top-2 cursor-grab opacity-0 group-hover/item:opacity-100 active:cursor-grabbing">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-6 rounded-full dark:bg-zinc-800 hover:dark:bg-zinc-700"
                    >
                      <GripVerticalIcon className="size-3.5" />
                    </Button>
                  </SortableItemHandle>

                  {fileItem.preview && (
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedImage(fileItem.preview!)
                        setIsPreviewLoading(true)
                      }}
                      variant="outline"
                      size="icon"
                      className="absolute inset-e-10 top-2 size-6 rounded-full opacity-0 shadow-sm group-hover/item:opacity-100 dark:bg-zinc-800 hover:dark:bg-zinc-700"
                    >
                      <ZoomInIcon className="size-3.5" />
                    </Button>
                  )}

                  <Button
                    type="button"
                    onClick={() => handleRemove(fileItem.id)}
                    variant="outline"
                    size="icon"
                    className="absolute inset-e-2 top-2 size-6 rounded-full opacity-0 shadow-sm group-hover/item:opacity-100 dark:bg-zinc-800 hover:dark:bg-zinc-700"
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </div>

                {progress > 0 && progress < 100 && (
                  <Progress
                    value={progress}
                    className={cn(
                      "h-1 transition-all duration-300",
                      "[&>div]:bg-zinc-950 dark:[&>div]:bg-zinc-50"
                    )}
                  />
                )}

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-foreground text-xs leading-none font-medium break-all">
                      {fileItem.file.name}
                    </span>
                    <span className="text-muted-foreground text-xs leading-none font-normal">
                      {formatBytes(fileItem.file.size)}
                    </span>
                  </div>

                  {status === "uploading" && (
                    <p className="text-muted-foreground text-xs">
                      Uploading... {Math.round(progress)}%
                    </p>
                  )}
                </div>
              </SortableItem>
            )
          })}
        </Sortable>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive" className="mt-5">
          <CircleAlertIcon />
          <AlertTitle>File upload error(s)</AlertTitle>
          <AlertDescription>
            {errors.map((error, index) => (
              <p key={index} className="last:mb-0">
                {error}
              </p>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="**:data-[slot=dialog-close]:text-muted-foreground **:data-[slot=dialog-close]:hover:text-foreground **:data-[slot=dialog-close]:bg-background w-full border-none bg-background p-0 shadow-none sm:max-w-xl **:data-[slot=dialog-close]:-inset-e-7 **:data-[slot=dialog-close]:-top-7 **:data-[slot=dialog-close]:size-7 **:data-[slot=dialog-close]:rounded-full">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-center">
            {selectedImage && (
              <>
                {isPreviewLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Spinner className="size-8 text-white" />
                  </div>
                )}
                <img
                  src={selectedImage}
                  alt="Preview"
                  onLoad={() => setIsPreviewLoading(false)}
                  className={cn(
                    "rounded-lg h-full w-auto object-contain transition-opacity duration-300",
                    isPreviewLoading ? "opacity-0" : "opacity-100"
                  )}
                />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
