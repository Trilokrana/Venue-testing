"use client"

import { Button } from "@/components/ui/button"
import { FileUploadGallery } from "@/components/ui/file-upload-gallery"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  MultiStepForm,
  useMultiStepFormContext,
  type MultiStepFormStep,
} from "@/components/ui/multi-step-form"
import { MultiStepFormLayout } from "@/components/ui/multi-step-form-layout"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SimpleSelect } from "@/components/ui/react-select"
import { OptionObj } from "@/components/ui/react-select/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useCheckSlugExists } from "@/components/venue-onwer/hooks/useCheckSlug"
import { useEditMyVenue } from "@/components/venue-onwer/hooks/useMyVenues"
import AmenitySelector from "@/form/create-venues/components/AmenitySelector"
import VenueRulesList, { validateUrl } from "@/form/create-venues/components/VenueRulesList"
import { useDebounce } from "@/hooks/use-debounce"
import type { FileMetadata, FileWithPreview } from "@/hooks/use-file-upload"
import { useGooglePlacesAutocomplete } from "@/hooks/use-google-places-autocomplete"
import { useModalControlQuery } from "@/hooks/use-modal-control-query"
import { formatTime, to24Hour, togglePeriod } from "@/lib/format"
import { cn, parseOptionalFloat, parseOptionalInt } from "@/lib/utils"
import { normalizePlaceDetails } from "@/lib/venues/actions"
import { flattenRhfFieldErrorMessage, parseVenueError } from "@/lib/venues/error-utils"
import { getImageDimensions } from "@/lib/venues/storage"
import {
  createVenueSchema,
  eventTypeEnum,
  venueTypeEnum,
  type UpdateVenue,
  type VenueFormImage,
} from "@/schemas/venue.schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { City, Country, State } from "country-state-city"
import { Loader2 } from "lucide-react"
import { ComponentProps, useEffect, useState } from "react"
import { FieldPath, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const venueTypeOptions = venueTypeEnum.options?.map((option) => ({
  label: option
    ?.split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" "),
  value: option,
}))

const eventTypeOptions = eventTypeEnum.options?.map((option) => ({
  label: option
    ?.split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" "),
  value: option,
}))

const indoorOutdoorOptions = [
  { label: "Indoor", value: "indoor" },
  { label: "Outdoor", value: "outdoor" },
  { label: "Both", value: "both" },
]

export function formImagesToGalleryMetadata(
  images: VenueFormImage[] | undefined | null
): FileMetadata[] {
  if (!images?.length) return []
  return images.map((img) => {
    const f = img.file

    if (f instanceof File) {
      return {
        id: img.id,
        name: f.name,
        size: f.size,
        type: f.type,
        url: img.preview ?? "",
      }
    }
    return { id: img.id, name: f.name, size: f.size, type: f.type, url: f.url }
  })
}

export function mergeGalleryFilesIntoFormImages(
  prev: VenueFormImage[] | undefined,
  galleryFiles: FileWithPreview[]
): VenueFormImage[] {
  const prevById = new Map((prev ?? []).map((p) => [p.id, p]))
  return galleryFiles.map((f, i) => {
    if (f.file instanceof File) {
      return {
        id: f.id,
        file: f.file,
        preview: f.preview ?? "",
        width: undefined,
        height: undefined,
        size: f.file.size,
        is_featured: i === 0,
        sort_order: i,
      }
    }
    const meta = f.file as FileMetadata
    const prior = prevById.get(f.id)
    // After step changes / remount, the gallery only has `FileMetadata` (preview URLs), but RHF may
    // still hold the real `File`. Reuse it so create submissions and reorder/remove stay valid.
    if (prior?.file instanceof File) {
      return {
        id: f.id,
        file: prior.file,
        preview: f.preview ?? prior.preview ?? "",
        width: prior.width,
        height: prior.height,
        is_featured: i === 0,
        sort_order: i,
        size: prior.file.size,
      }
    }
    const isExisting = prior && "storage_path" in prior
    return {
      id: f.id,
      storage_path: isExisting ? prior.storage_path : undefined,
      file: meta,
      preview: f.preview ?? meta.url,
      width: isExisting ? prior.width : undefined,
      height: isExisting ? prior.height : undefined,
      is_featured: i === 0,
      sort_order: i,
      size: f.file.size,
    }
  })
}

export async function mapImagesForCreateMutation(images: VenueFormImage[]) {
  return Promise.all(
    images.map(async (image, i) => {
      if (!(image.file instanceof File)) {
        throw new Error("Only new file uploads are allowed when creating a venue")
      }
      const { width, height } = await getImageDimensions(image.file)
      return {
        file: image.file,
        id: image.id,
        preview: image.preview,
        width,
        height,
        is_featured: image.is_featured ?? i === 0,
        sort_order: image.sort_order ?? i,
        size: image.file.size,
      }
    })
  )
}

export async function mapImagesForUpdateMutation(images: VenueFormImage[]) {
  return Promise.all(
    images.map(async (image, i) => {
      if (image.file instanceof File) {
        const { width, height } = await getImageDimensions(image.file)
        return {
          file: image.file,
          id: image.id,
          preview: image.preview,
          width,
          height,
          is_featured: image.is_featured ?? i === 0,
          sort_order: image.sort_order ?? i,
          size: image.file.size,
        }
      }
      if (!("storage_path" in image) || image.storage_path == null || image.storage_path === "") {
        throw new Error("Invalid image entry: existing image must include storage_path")
      }
      // Keep full shape for `updateVenueSchema` / server parse (`file` metadata + top-level fields).
      return {
        ...image,
        is_featured: image.is_featured ?? i === 0,
        sort_order: image.sort_order ?? i,
      }
    })
  )
}

/**
 * Zod *input* shape (what the form holds before transforms). Aligns with `zodResolver(createVenueSchema)`.
 * Use `z.infer<typeof createVenueSchema>` / `CreateVenue` for validated submit payloads.
 */
export type FormData = z.input<typeof createVenueSchema>
export type VenueFormOutput = z.infer<typeof createVenueSchema>

/** Stable reference — avoid `steps={[...]}` each render (invalidates callbacks / context). */
const formSteps: MultiStepFormStep<FormData>[] = [
  { id: "basic-information", fields: ["name", "slug", "description", "venue_type", "event_types"] },
  {
    id: "configuration",
    fields: [
      "capacity",
      "square_footage",
      "indoor_outdoor",
      "hourly_rate",
      "min_hours",
      "instabook",
      "hours_of_operation",
      "cancellation_policy",
    ],
  },
  {
    id: "address",
    fields: [
      "address.address_line_1",
      "address.address_line_2",
      "address.city",
      "address.state",
      "address.zip",
      "address.country",
      "phone",
    ],
  },
  { id: "images", fields: ["images"] },
  // { id: "location", fields: ["placeId", "lat", "lng", "formatted_address"] },
  { id: "amenities", fields: ["amenities"] },
  { id: "rules", fields: ["rules", "is_active"] },
  { id: "social-media-links", fields: ["social_media_links"] },
]

/** Last async slug check result — used after `form.trigger` clears manual `setError` on Next. */
type SlugAvailabilityGate = "idle" | "available" | "taken" | "check_failed"

function UpdateVenueNextButton({
  slugGate,
  children = "Next",
  className,
  onClick,
  disabled,
  ...props
}: Omit<ComponentProps<typeof Button>, "type"> & {
  slugGate: SlugAvailabilityGate
}) {
  const { form, steps, activeStep, setActiveStep, isLastStep } = useMultiStepFormContext<FormData>()
  if (isLastStep) return null
  return (
    <Button
      type="button"
      className={cn("cursor-pointer px-6", className)}
      onClick={async (e) => {
        onClick?.(e)
        const step = steps[activeStep]
        if (!step) return
        const ok = await form.trigger(step.fields as FieldPath<FormData>[], {
          shouldFocus: true,
        })
        if (!ok) return
        if (step.id === "basic-information") {
          if (slugGate === "taken") {
            form.setError("slug", {
              type: "manual",
              message: "Slug is already taken",
            })
            return
          }
          if (slugGate === "check_failed") {
            form.setError("slug", {
              type: "manual",
              message: "Failed to check slug",
            })
            return
          }
        }
        setActiveStep((s) => Math.min(s + 1, steps.length - 1))
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  )
}

/**
 * Example: `MultiStepForm` + `MultiStepFormLayout` (card header / content / footer).
 */
export function UpdateVenueForm({
  defaultValues,
  venueId,
  onSuccess,
}: {
  defaultValues?: FormData
  /** When set (e.g. edit modal), images hydrate from `defaultValues` then stay in RHF state; submits call `updateVenue`. */
  venueId: string
  onSuccess?: (data: VenueFormOutput) => void
}) {
  const { mutateAsync: checkSlugExists, isPending: isCheckingSlug } = useCheckSlugExists()
  const [slugGate, setSlugGate] = useState<SlugAvailabilityGate>("idle")

  const editDialog = useModalControlQuery("edit-venue-details")
  const { mutateAsync: editMyVenue, isPending: isPendingEditMyVenue } = useEditMyVenue()

  const form = useForm<FormData, unknown, VenueFormOutput>({
    resolver: zodResolver(createVenueSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      slug: defaultValues?.slug ?? "",
      venue_type: defaultValues?.venue_type ?? undefined,
      event_types: defaultValues?.event_types ?? [],
      capacity: defaultValues?.capacity ?? null,
      square_footage: defaultValues?.square_footage,
      indoor_outdoor: defaultValues?.indoor_outdoor ?? undefined,
      hourly_rate: defaultValues?.hourly_rate ?? null,
      min_hours: defaultValues?.min_hours ?? null,
      instabook: defaultValues?.instabook ?? false,
      hours_of_operation: defaultValues?.hours_of_operation ?? "",
      cancellation_policy: defaultValues?.cancellation_policy ?? "",
      is_active: defaultValues?.is_active ?? false,
      social_media_links: defaultValues?.social_media_links ?? [],
      amenities: defaultValues?.amenities ?? [],
      phone: defaultValues?.phone ?? "",
      rules: defaultValues?.rules ?? [],
      address: {
        address_line_1: defaultValues?.address?.address_line_1 ?? "",
        address_line_2: defaultValues?.address?.address_line_2 ?? "",
        city: defaultValues?.address?.city ?? "",
        state: defaultValues?.address?.state ?? "",
        zip: defaultValues?.address?.zip ?? "",
        country: defaultValues?.address?.country ?? "",
      },
      placeId: defaultValues?.placeId ?? "",
      lat: defaultValues?.lat ?? (undefined as unknown as number),
      lng: defaultValues?.lng ?? (undefined as unknown as number),
      formatted_address: defaultValues?.formatted_address ?? "",
      images: defaultValues?.images ?? [],
    },
    mode: "onTouched",
    shouldUnregister: false,
  })

  const {
    formState: { errors, isSubmitting },

    setValue,
  } = form
  // Google Places Autocomplete
  const { inputRef } = useGooglePlacesAutocomplete({
    onPlaceSelected: async (placeId: string) => {
      try {
        const address = await normalizePlaceDetails(placeId)

        setValue("placeId", placeId)
        setValue("address.address_line_1", address.street)
        setValue("address.address_line_2", address.address_line_2 || "")
        setValue("address.city", address.city)
        setValue("address.state", address.state)
        setValue("address.zip", address.zip)
        setValue("address.country", address.country)
        setValue("lat", address.lat)
        setValue("lng", address.lng)
        setValue("formatted_address", address.formatted_address)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed fetching place details"
        toast.error(message)
      }
    },
  })

  async function onSubmit(data: VenueFormOutput) {
    const venueMessages = {
      create: {
        loading: "Creating venue...",
        success: "Venue successfully created",
        error: "Error creating venue",
      },
      update: {
        loading: "Updating venue...",
        success: "Venue successfully updated",
        error: "Error updating venue",
      },
      delete: {
        loading: "Deleting venue...",
        success: "Venue successfully deleted",
        error: "Error deleting venue",
      },
    }

    try {
      const { address, placeId, lat, lng, formatted_address, ...rest } = data
      const { address_line_2, ...addressRest } = address
      const transformedAddress = {
        ...addressRest,
        state: address.state.toUpperCase(),
        ...(address_line_2?.trim() ? { address_line_2 } : {}),
      }

      const imagesForMutation = await mapImagesForUpdateMutation(data.images ?? [])

      const transformedData: Record<string, unknown> = {
        ...rest,
        address: transformedAddress,
        images: imagesForMutation,
      }

      if (placeId) transformedData.placeId = placeId
      if (lat !== undefined) transformedData.lat = lat
      if (lng !== undefined) transformedData.lng = lng
      if (formatted_address) transformedData.formatted_address = formatted_address

      if (venueId) {
        // const result = await updateVenue(venueId, transformedData as Omit<UpdateVenue, "id">)
        const result = await editMyVenue({
          id: venueId,
          data: transformedData as Omit<UpdateVenue, "id">,
        })

        if (result?.success) {
          editDialog.set(false)
          toast.success(venueMessages.update.success)
          if (onSuccess) onSuccess?.(result?.data)
        } else {
          toast.error(result?.error ?? "Failed to update venue")
        }
      }
    } catch (error) {
      const errorMessage = parseVenueError(error)
      toast.error(errorMessage)
      // Re-throw error so parent components know it failed
      throw error
    }
  }

  const countries = Country.getAllCountries()

  const updatedCountries = countries.map((country) => ({
    label: country.name,
    value: country.isoCode,
    ...country,
  }))

  const updatedStates = (countryId?: string) => {
    if (!countryId) return []
    return State.getStatesOfCountry(countryId).map((state) => ({
      label: state.name,
      value: state.isoCode,
      ...state,
    }))
  }

  const updatedCities = (countryId?: string, stateId?: string) => {
    if (!countryId || !stateId) return []
    return City.getCitiesOfState(countryId, stateId).map((city) => ({
      label: city.name,
      value: city.name,
      ...city,
    }))
  }

  const slug = form.watch("slug")
  const debouncedSlug = useDebounce(slug ?? "", 500)

  useEffect(() => {
    setSlugGate("idle")
  }, [slug])

  useEffect(() => {
    if (!debouncedSlug) {
      setSlugGate("idle")
      return
    }

    let toastId: string | number | undefined

    const checkSlug = async () => {
      try {
        toastId = toast.loading("Checking slug...", {
          position: "top-right",
        })

        const res = await checkSlugExists(debouncedSlug)

        if (res.data) {
          setSlugGate("taken")
          form.setError("slug", {
            type: "manual",
            message: "Slug is already taken",
          })
          toast.error(`(${debouncedSlug}) is already taken`, {
            id: toastId,
          })
        } else {
          setSlugGate("available")
          form.clearErrors("slug")
          toast.success(`(${debouncedSlug}) is available`, {
            id: toastId,
          })
        }
      } catch (err) {
        setSlugGate("check_failed")
        form.setError("slug", {
          type: "manual",
          message: "Failed to check slug",
        })
        toast.error("Failed to check slug", { id: toastId })
      }
    }

    if (form.watch("slug") !== defaultValues?.slug) checkSlug()
  }, [debouncedSlug, checkSlugExists, form])

  return (
    <MultiStepForm<FormData> form={form} steps={formSteps} initialStep={0}>
      <MultiStepFormLayout>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <MultiStepFormLayout.Header>
            <MultiStepForm.Header />
            <MultiStepForm.Progress />
          </MultiStepFormLayout.Header>

          <MultiStepFormLayout.Content>
            {isPendingEditMyVenue ? (
              <div className="flex-1 h-full space-y-4 p-4">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((el, i) => (
                  <div key={el} className="">
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <MultiStepForm.Step name="basic-information">
                  <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Ada Lovelace" autoComplete="name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <div className="relative">
                              {isCheckingSlug && (
                                <Loader2 className="size-4 animate-spin absolute right-2 top-1/2 -translate-y-1/2" />
                              )}

                              <Input placeholder="ada-lovelace" autoComplete="slug" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Description"
                            autoComplete="description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="venue_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue Type</FormLabel>
                        <FormControl>
                          <SimpleSelect
                            options={venueTypeOptions}
                            {...field}
                            value={venueTypeOptions?.find((option) => option.value === field.value)}
                            onChange={(value) => {
                              const selectedOption = value as OptionObj
                              field.onChange(selectedOption?.value)
                            }}
                          />
                        </FormControl>
                        <FormMessage className="break-all" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="event_types"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Types</FormLabel>
                        <FormControl>
                          <SimpleSelect
                            isMulti
                            options={eventTypeOptions}
                            {...field}
                            value={eventTypeOptions?.filter(
                              (option) => field.value?.includes(option.value) ?? false
                            )}
                            onChange={(value) => {
                              const selectedOption = value as OptionObj[]
                              if (selectedOption?.length > 5) {
                                toast.error("You can only select up to 5 event types")
                                return
                              } else {
                                field.onChange(
                                  selectedOption?.map((option: OptionObj) => option.value) ?? []
                                )
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </MultiStepForm.Step>

                <MultiStepForm.Step name="configuration">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacity</FormLabel>
                          <FormControl>
                            <Input
                              className="w-full"
                              placeholder="Capacity"
                              autoComplete="capacity"
                              type="number"
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value
                                if (!val) {
                                  field.onChange(null as unknown as number)
                                  return
                                }

                                field.onChange(parseOptionalInt(val))
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="square_footage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Square Footage</FormLabel>
                          <FormControl>
                            <Input
                              className="w-full"
                              placeholder="Square Footage"
                              autoComplete="square_footage"
                              type="number"
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value
                                if (!val) {
                                  field.onChange(null as unknown as number)
                                  return
                                }

                                field.onChange(parseOptionalInt(val))
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="indoor_outdoor"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2 lg:col-span-1">
                          <FormLabel>Indoor/Outdoor</FormLabel>
                          <FormControl>
                            <RadioGroup
                              {...field}
                              value={
                                indoorOutdoorOptions?.find((option) => option.value === field.value)
                                  ?.value
                              }
                              onValueChange={(value) => field.onChange(value)}
                              className="flex flex-col sm:flex-row gap-4 border rounded-sm p-4 py-3"
                            >
                              {indoorOutdoorOptions.map((option) => (
                                <div key={option.value} className="flex items-center gap-2">
                                  <RadioGroupItem value={option.value} id={option.value} />
                                  <Label htmlFor={option.value}>{option.label}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="instabook"
                      render={({ field }) => (
                        <FormItem className="flex flex-col justify-between">
                          <FormLabel>Instabook</FormLabel>
                          <FormControl>
                            <div className="border rounded-sm p-2 py-2 flex items-center h-10">
                              <Switch
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                                className="border-border"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hourly_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hourly Rate</FormLabel>
                          <FormControl>
                            <Input
                              className="w-full"
                              placeholder="Hourly Rate"
                              autoComplete="hourly_rate"
                              type="number"
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value
                                if (!val) {
                                  field.onChange(null as unknown as number)
                                  return
                                }

                                field.onChange(parseOptionalFloat(val))
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="min_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Hours</FormLabel>
                          <FormControl>
                            <Input
                              className="w-full"
                              placeholder="Min Hours"
                              autoComplete="min_hours"
                              type="number"
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = e.target.value
                                if (!val) {
                                  field.onChange(null as unknown as number)
                                  return
                                }

                                field.onChange(parseOptionalInt(val))
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hours_of_operation"
                      render={({ field }) => (
                        <FormItem className="col-span-1 sm:col-span-2 lg:col-span-3">
                          <FormControl>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                              <div className="w-full space-y-2">
                                <Label>Hours of Operation From</Label>
                                <Input
                                  type="time"
                                  step={60}
                                  value={to24Hour(field.value?.split(" - ")[0])}
                                  onChange={(e) => {
                                    const from = formatTime(e.target.value)
                                    const [, toRaw] = field.value?.split(" - ") || []
                                    const to = toRaw || togglePeriod(from)
                                    field.onChange(`${from} - ${to}`)
                                  }}
                                  className="w-full bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                                />
                              </div>

                              <div className="w-full space-y-2">
                                <Label>Hours of Operation To</Label>
                                <Input
                                  type="time"
                                  step={60}
                                  value={to24Hour(field.value?.split(" - ")[1])}
                                  onChange={(e) => {
                                    const to = formatTime(e.target.value)
                                    const [fromRaw] = field.value?.split(" - ") || []
                                    const from = fromRaw || togglePeriod(to)
                                    field.onChange(`${from} - ${to}`)
                                  }}
                                  className="w-full bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                                />
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cancellation_policy"
                      render={({ field }) => (
                        <FormItem className="col-span-1 sm:col-span-2 lg:col-span-3">
                          <FormLabel>Cancellation Policy</FormLabel>
                          <FormControl>
                            <Textarea
                              className="w-full"
                              placeholder="Cancellation Policy"
                              autoComplete="cancellation_policy"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </MultiStepForm.Step>

                <MultiStepForm.Step name="address">
                  <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="address.address_line_1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Address Line 1"
                              autoComplete="address_line_1"
                              type="text"
                              name={field.name}
                              ref={(e) => {
                                form.register("address.address_line_1").ref(e)
                                if (e) {
                                  ;(
                                    inputRef as React.MutableRefObject<HTMLInputElement | null>
                                  ).current = e
                                }
                              }}
                              onBlur={field.onBlur}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.address_line_2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Address Line 2"
                              autoComplete="address_line_2"
                              type="text"
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <SimpleSelect
                              options={updatedCountries}
                              {...field}
                              value={
                                updatedCountries?.find((option) => option.value === field.value) ||
                                null
                              }
                              onChange={(value) => {
                                const selectedOption = value as OptionObj
                                const nextCountry = selectedOption?.value ?? ""
                                field.onChange(nextCountry)
                                form.setValue("address.state", "", {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                                form.setValue("address.city", "", {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <SimpleSelect
                              options={updatedStates(form.watch("address.country"))}
                              {...field}
                              value={
                                updatedStates(form.watch("address.country"))?.find(
                                  (option) => option.value === field.value
                                ) || null
                              }
                              onChange={(value) => {
                                const selectedOption = value as OptionObj
                                const nextState = selectedOption?.value ?? ""
                                field.onChange(nextState)
                                form.setValue("address.city", "", {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <SimpleSelect
                              options={updatedCities(
                                form.watch("address.country"),
                                form.watch("address.state")
                              )}
                              {...field}
                              value={
                                updatedCities(
                                  form.watch("address.country"),
                                  form.watch("address.state")
                                )?.find((option) => option.value === field.value) || null
                              }
                              onChange={(value) => {
                                const selectedOption = value as OptionObj
                                field.onChange(selectedOption?.value ?? "")
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address.zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Zip"
                              autoComplete="zip"
                              type="number"
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Phone"
                              type="tel"
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </MultiStepForm.Step>

                <MultiStepForm.Step name="images">
                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Images ({field.value?.length ?? 0})</FormLabel>
                        <FormControl>
                          <FileUploadGallery
                            key={venueId ?? "update-venue-gallery"}
                            maxFiles={10}
                            maxSize={5 * 1024 * 1024}
                            accept="image/*"
                            multiple={true}
                            onFilesChange={(files) => {
                              field.onChange(
                                mergeGalleryFilesIntoFormImages(form.getValues("images"), files)
                              )
                            }}
                            initialFiles={formImagesToGalleryMetadata(field.value)}
                          />
                        </FormControl>
                        {Array.isArray(errors?.images) &&
                          (errors?.images || [])?.length > 0 &&
                          (errors?.images || [])?.map((error, index) => {
                            if (!error) return null
                            const img = field.value?.[index]
                            const fileLabel =
                              img?.file instanceof File
                                ? img.file.name
                                : img?.file && typeof img.file === "object" && "name" in img.file
                                  ? (img.file as FileMetadata).name
                                  : "Unknown"
                            const msg =
                              flattenRhfFieldErrorMessage(error) ||
                              "Does not match the required image format."
                            return (
                              <p key={`${fileLabel}-${String(index)}`} className="text-sm">
                                <span className="text-destructive">{fileLabel}</span>
                                {": "}
                                {msg}
                              </p>
                            )
                          })}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </MultiStepForm.Step>

                <MultiStepForm.Step name="amenities">
                  <FormField
                    control={form.control}
                    name="amenities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amenities</FormLabel>
                        <AmenitySelector
                          selectedAmenities={field.value ?? []}
                          onChange={(amenities) => field.onChange(amenities)}
                        />
                      </FormItem>
                    )}
                  />
                </MultiStepForm.Step>

                <MultiStepForm.Step name="rules">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Is Active</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rules"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rules</FormLabel>
                        <FormControl>
                          <VenueRulesList
                            label="Rules"
                            items={field.value ?? []}
                            onChange={(rules: string[]) => field.onChange(rules)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </MultiStepForm.Step>

                <MultiStepForm.Step name="social-media-links">
                  <FormField
                    control={form.control}
                    name="social_media_links"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Media Links</FormLabel>
                        <FormControl>
                          <VenueRulesList
                            validate={validateUrl}
                            label="Social Media Links"
                            items={field.value ?? []}
                            onChange={(socialMediaLinks: string[]) =>
                              field.onChange(socialMediaLinks)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </MultiStepForm.Step>
              </>
            )}
          </MultiStepFormLayout.Content>

          <MultiStepFormLayout.Footer>
            <MultiStepForm.Actions>
              <MultiStepForm.Back disabled={isSubmitting} />
              <div className="ml-auto flex gap-2">
                <UpdateVenueNextButton
                  slugGate={slugGate}
                  disabled={isSubmitting || isCheckingSlug}
                />
                <MultiStepForm.Submit disabled={isSubmitting || isCheckingSlug}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    "Submit"
                  )}
                </MultiStepForm.Submit>
                <QuickSubmit isSubmitting={isSubmitting || isCheckingSlug} />
              </div>
            </MultiStepForm.Actions>
          </MultiStepFormLayout.Footer>
        </form>
      </MultiStepFormLayout>
    </MultiStepForm>
  )
}

const QuickSubmit = ({ isSubmitting }: { isSubmitting: boolean }) => {
  const { currentStep } = useMultiStepFormContext()

  return (
    currentStep?.id !== formSteps[formSteps.length - 1].id && (
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Submitting...</span>
          </>
        ) : (
          "Submit"
        )}
      </Button>
    )
  )
}

export default UpdateVenueForm
