"use client"

import type React from "react"
import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type InputHTMLAttributes,
} from "react"

export type FileMetadata = {
  name: string
  size: number
  type: string
  url: string
  id: string
}

export type FileWithPreview = {
  file: File | FileMetadata
  id: string
  preview?: string
}

export type FileUploadOptions = {
  maxFiles?: number
  maxSize?: number
  accept?: string
  multiple?: boolean
  initialFiles?: FileMetadata[]
  onFilesChange?: (files: FileWithPreview[]) => void
  onFilesAdded?: (addedFiles: FileWithPreview[]) => void
  onError?: (errors: string[]) => void
  transformFiles?: (files: File[]) => Promise<File[]> | File[]
}

export type FileUploadState = {
  files: FileWithPreview[]
  isDragging: boolean
  errors: string[]
}

export type FileUploadActions = {
  addFiles: (files: FileList | File[]) => Promise<void>
  removeFile: (id: string) => void
  clearFiles: () => void
  clearErrors: () => void
  reorderFiles: (ids: string[]) => void
  handleDragEnter: (e: DragEvent<HTMLElement>) => void
  handleDragLeave: (e: DragEvent<HTMLElement>) => void
  handleDragOver: (e: DragEvent<HTMLElement>) => void
  handleDrop: (e: DragEvent<HTMLElement>) => void
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void
  openFileDialog: () => void
  getInputProps: (
    props?: InputHTMLAttributes<HTMLInputElement>
  ) => InputHTMLAttributes<HTMLInputElement> & {
    ref: React.Ref<HTMLInputElement>
  }
}

export const useFileUpload = (
  options: FileUploadOptions = {}
): [FileUploadState, FileUploadActions] => {
  const {
    maxFiles = Number.POSITIVE_INFINITY,
    maxSize = Number.POSITIVE_INFINITY,
    accept = "*",
    multiple = false,
    initialFiles = [],
    onFilesChange,
    onFilesAdded,
    onError,
    transformFiles,
  } = options

  const [state, setState] = useState<FileUploadState>({
    files: initialFiles.map((file) => ({
      file,
      id: file.id,
      preview: file.url,
    })),
    isDragging: false,
    errors: [],
  })

  const inputRef = useRef<HTMLInputElement>(null)

  /** Defer so React Hook Form / parents are not updated during `useFileUpload` state updaters (avoids "Cannot update Controller while rendering"). */
  const scheduleFilesChange = useCallback(
    (files: FileWithPreview[]) => {
      queueMicrotask(() => {
        onFilesChange?.(files)
      })
    },
    [onFilesChange]
  )

  const validateFile = useCallback(
    (file: File | FileMetadata): string | null => {
      if (file.size > maxSize) {
        return `File "${file.name}" exceeds the maximum size of ${formatBytes(maxSize)}.`
      }

      if (accept !== "*") {
        const acceptedTypes = accept.split(",").map((type) => type.trim())
        const fileType = file.type || ""
        const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
        const fileExtension = extension ? `.${extension}` : ""

        const isAccepted = acceptedTypes.some((type) => {
          if (type.startsWith(".")) {
            return fileExtension === type.toLowerCase()
          }

          if (type.endsWith("/*")) {
            const baseType = type.split("/")[0]
            return fileType.startsWith(`${baseType}/`)
          }

          return fileType === type
        })

        if (!isAccepted) {
          return `File "${file.name}" is not an accepted file type.`
        }
      }

      return null
    },
    [accept, maxSize]
  )

  const createPreview = useCallback((file: File | FileMetadata): string | undefined => {
    if (file instanceof File) {
      return URL.createObjectURL(file)
    }

    return file.url
  }, [])

  const generateUniqueId = useCallback((file: File | FileMetadata): string => {
    if (file instanceof File) {
      return `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    }

    return file.id
  }, [])

  const clearFiles = useCallback(() => {
    setState((prev) => {
      for (const file of prev.files) {
        if (file.preview && file.file instanceof File && file.file.type.startsWith("image/")) {
          URL.revokeObjectURL(file.preview)
        }
      }

      if (inputRef.current) {
        inputRef.current.value = ""
      }

      const newState = {
        ...prev,
        files: [],
        errors: [],
      }

      scheduleFilesChange(newState.files)
      return newState
    })
  }, [scheduleFilesChange])

  const addFiles = useCallback(
    async (incomingFiles: FileList | File[]) => {
      if (!incomingFiles || incomingFiles.length === 0) return

      const rawFiles = Array.from(incomingFiles)

      setState((prev) => ({ ...prev, errors: [] }))

      const processedFiles = transformFiles ? await transformFiles(rawFiles) : rawFiles
      const errors: string[] = []

      setState((prev) => {
        const existingFiles = multiple ? prev.files : []
        const existingSignatures = new Set(
          existingFiles
            .filter((item) => item.file instanceof File)
            .map((item) => `${item.file.name}-${item.file.size}`)
        )

        const batchSignatures = new Set<string>()
        const validFiles: FileWithPreview[] = []

        if (
          multiple &&
          maxFiles !== Number.POSITIVE_INFINITY &&
          existingFiles.length + processedFiles.length > maxFiles
        ) {
          const nextState = {
            ...prev,
            errors: [`You can only upload a maximum of ${maxFiles} files.`],
          }
          onError?.(nextState.errors)
          return nextState
        }

        for (const file of processedFiles) {
          const signature = `${file.name}-${file.size}`

          if (multiple) {
            const isDuplicate = existingSignatures.has(signature) || batchSignatures.has(signature)

            if (isDuplicate) {
              continue
            }
          }

          const error = validateFile(file)
          if (error) {
            errors.push(error)
            continue
          }

          batchSignatures.add(signature)

          validFiles.push({
            file,
            id: generateUniqueId(file),
            preview: createPreview(file),
          })
        }

        if (validFiles.length === 0) {
          const nextState = {
            ...prev,
            errors,
          }

          if (errors.length > 0) {
            onError?.(errors)
          }

          if (inputRef.current) {
            inputRef.current.value = ""
          }

          return nextState
        }

        const nextFiles = multiple ? [...existingFiles, ...validFiles] : validFiles

        onFilesAdded?.(validFiles)
        scheduleFilesChange(nextFiles)

        if (inputRef.current) {
          inputRef.current.value = ""
        }

        return {
          ...prev,
          files: nextFiles,
          errors,
        }
      })
    },
    [
      transformFiles,
      multiple,
      maxFiles,
      validateFile,
      generateUniqueId,
      createPreview,
      onError,
      onFilesAdded,
      scheduleFilesChange,
    ]
  )

  const removeFile = useCallback(
    (id: string) => {
      setState((prev) => {
        const fileToRemove = prev.files.find((file) => file.id === id)

        if (
          fileToRemove &&
          fileToRemove.preview &&
          fileToRemove.file instanceof File &&
          fileToRemove.file.type.startsWith("image/")
        ) {
          URL.revokeObjectURL(fileToRemove.preview)
        }

        const newFiles = prev.files.filter((file) => file.id !== id)
        scheduleFilesChange(newFiles)

        return {
          ...prev,
          files: newFiles,
          errors: [],
        }
      })
    },
    [scheduleFilesChange]
  )

  const reorderFiles = useCallback(
    (ids: string[]) => {
      setState((prev) => {
        const fileMap = new Map(prev.files.map((file) => [file.id, file]))
        const reordered = ids.map((id) => fileMap.get(id)).filter(Boolean) as FileWithPreview[]

        if (reordered.length !== prev.files.length) {
          return prev
        }

        scheduleFilesChange(reordered)

        return {
          ...prev,
          files: reordered,
        }
      })
    },
    [scheduleFilesChange]
  )

  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errors: [],
    }))
  }, [])

  const handleDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setState((prev) => ({ ...prev, isDragging: true }))
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return
    }

    setState((prev) => ({ ...prev, isDragging: false }))
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setState((prev) => ({ ...prev, isDragging: false }))

      if (inputRef.current?.disabled) {
        return
      }

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        if (!multiple) {
          void addFiles([e.dataTransfer.files[0]])
        } else {
          void addFiles(e.dataTransfer.files)
        }
      }
    },
    [addFiles, multiple]
  )

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        void addFiles(e.target.files)
      }
    },
    [addFiles]
  )

  const openFileDialog = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click()
    }
  }, [])

  const getInputProps = useCallback(
    (props: InputHTMLAttributes<HTMLInputElement> = {}) => {
      return {
        ...props,
        type: "file" as const,
        onChange: handleFileChange,
        accept: props.accept || accept,
        multiple: props.multiple !== undefined ? props.multiple : multiple,
        ref: inputRef,
      }
    },
    [accept, multiple, handleFileChange]
  )

  return [
    state,
    {
      addFiles,
      removeFile,
      clearFiles,
      clearErrors,
      reorderFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleFileChange,
      openFileDialog,
      getInputProps,
    },
  ]
}

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / k ** i).toFixed(dm)) + sizes[i]
}
