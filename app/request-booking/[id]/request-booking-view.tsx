"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { ArrowRight, ChevronRight, Loader2, MapPin, Star } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { createBooking } from "@/lib/bookings/cronofy-actions"

import { formatLocationLine, normalizeAddress, primaryImageUrl } from "@/app/listings/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { VenueWithRelations } from "@/lib/venues/types"

const step1Schema = z.object({
  activity: z.string().min(1, "Activity is required"),
  castCrew: z.string().min(1, "Cast & Crew count is required"),
  projectName: z.string().min(1, "Project name is required"),
  company: z.string().min(1, "Renter/Company is required"),
  about: z.string().min(10, "Tell us more about your project (min 10 characters)"),
})

const step2Schema = z.object({
  cardNumber: z.string().min(15, "Invalid card number"),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, "Format MM/YY"),
  cvc: z.string().min(3, "Invalid CVC"),
  nameOnCard: z.string().min(1, "Name is required"),
  promoCode: z.string().optional(),
})

const bookingSchema = step1Schema.merge(step2Schema)
type BookingFormValues = z.infer<typeof bookingSchema>

type Props = {
  venue: VenueWithRelations
}

// Re-using pricing logic from venue-booking-widget (simplified)
const GUEST_BUCKETS = [
  { label: "1 – 5 people", value: "5", multiplier: 1 },
  { label: "6 – 20 people", value: "20", multiplier: 1.35 },
  { label: "21 – 50 people", value: "50", multiplier: 1.8 },
  { label: "51 – 100 people", value: "100", multiplier: 2.5 },
  { label: "100+ people", value: "200", multiplier: 3.4 },
] as const

const ACTIVITIES = [
  "Christmas Party",
  "Birthday Party",
  "Wedding",
  "Corporate Event",
  "Photo Shoot",
  "Meeting",
  "Music Video",
  "Party",
  "Seminar",
  "Gala",
  "Concert",
  "Product Launch",
  "Baby Shower",
  "Recreation",
  "Production",
  "Event",
] as const

export function RequestBookingView({ venue }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = React.useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // From query
  const dateStr = searchParams.get("date")
  const dateObj = dateStr ? new Date(dateStr) : null
  const startTime = searchParams.get("startTime") || ""
  const endTime = searchParams.get("endTime") || ""
  const guests = searchParams.get("guests") || ""
  const effectiveHours = parseFloat(searchParams.get("hours") || "1")

  // Pricing recalculation
  const baseRate = venue.hourly_rate ?? 0
  const selectedGuestBucket = GUEST_BUCKETS.find((b) => b.value === guests)
  const attendeeMultiplier = selectedGuestBucket?.multiplier ?? 1
  const dynamicHourlyRate = baseRate > 0 ? baseRate * attendeeMultiplier : 0
  const subtotal = dynamicHourlyRate * effectiveHours
  const processing = subtotal * 0.15
  const total = subtotal + processing

  const address = normalizeAddress(venue)
  const heroImage = primaryImageUrl(venue)

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      activity: "",
      castCrew: guests,
      projectName: "",
      company: "",
      about: "",
      cardNumber: "",
      expiry: "",
      cvc: "",
      nameOnCard: "",
      promoCode: "",
    },
    mode: "onChange",
  })

  async function handleNext() {
    const isValid = await form.trigger(["activity", "castCrew", "projectName", "company", "about"])
    if (isValid) setStep(2)
  }

  async function onSubmit(data: BookingFormValues) {
    if (step === 1) return
    if (!dateObj || !startTime || !endTime) {
      toast.error("Please go back and select a date and time.")
      return
    }

    // Convert "10:00 AM" on the selected date to UTC ISO string
    function slotToISO(dateBase: Date, slot: string): string {
      const [timePart, period] = slot.split(" ")
      const [hStr, mStr] = timePart.split(":")
      let h = parseInt(hStr, 10)
      const m = parseInt(mStr, 10)
      if (period === "PM" && h !== 12) h += 12
      if (period === "AM" && h === 12) h = 0
      const d = new Date(dateBase)
      d.setHours(h, m, 0, 0)
      return d.toISOString()
    }

    setIsSubmitting(true)
    try {
      const fullNotes = `Project: ${data.projectName}
Company: ${data.company}
Activity: ${data.activity}
Cast & Crew: ${data.castCrew}

About:
${data.about}

(Payment skipped for now)`

      const result = await createBooking({
        venueId: venue.id,
        startAt: slotToISO(dateObj, startTime),
        endAt: slotToISO(dateObj, endTime),
        notes: fullNotes,
      })

      if (!result.success) {
        toast.error("Booking failed", { description: result.error })
        return
      }

      toast.success("Booking confirmed!", {
        description: result.calendarEventCreated
          ? "A calendar event has been added to the owner's calendar."
          : "Your booking is confirmed.",
      })
      router.push("/bookings")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col-reverse gap-8 lg:grid lg:grid-cols-[1fr_400px] lg:items-start lg:gap-10">
      <div className="min-w-0 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            {step === 1 ? "Request to book" : "Pay for location"}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
            <span className={step >= 1 ? "font-medium text-neutral-900" : ""}>
              1. Project details
            </span>
            <ChevronRight className="size-4" />
            <span className={step >= 2 ? "font-medium text-neutral-900" : ""}>2. Payment</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 text-neutral-900">
            {step === 1 && (
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="activity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activity</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select type of activity" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ACTIVITIES.map((activity) => (
                                <SelectItem key={activity} value={activity}>
                                  {activity}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="castCrew"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cast & Crew (Attendees)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select attendees" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {GUEST_BUCKETS.map((b) => (
                                <SelectItem key={b.value} value={b.value}>
                                  {b.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="projectName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g. Summer Campaign" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renter/Company</FormLabel>
                          <FormControl>
                            <Input placeholder="Company Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="about"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>About your project</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share details with the host..."
                            className="min-h-30"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button type="button" onClick={handleNext} size="lg" className="px-8">
                    Next
                  </Button>
                </CardFooter>
              </Card>
            )}

            {step === 2 && (
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Number</FormLabel>
                        <FormControl>
                          <Input placeholder="0000 0000 0000 0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="expiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiration</FormLabel>
                          <FormControl>
                            <Input placeholder="MM/YY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cvc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CVC</FormLabel>
                          <FormControl>
                            <Input placeholder="123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="nameOnCard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name on Card</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Separator className="my-4" />
                  <FormField
                    control={form.control}
                    name="promoCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Promo Code (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="PROMO20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-25"
                  >
                    Back
                  </Button>
                  <Button
                    size="lg"
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[180px] bg-primary text-primary-foreground"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Confirming…
                      </>
                    ) : (
                      <>
                        Confirm and Pay
                        <ArrowRight className="ml-2 size-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </form>
        </Form>
      </div>

      <div className="mt-8 lg:mt-24 lg:sticky lg:top-8 lg:self-start">
        <Card className="overflow-hidden rounded-2xl border-neutral-200">
          <div className="flex border-b border-neutral-100 p-4 gap-4">
            {heroImage ? (
              <img src={heroImage} alt={venue.name} className="h-24 w-24 rounded-xl object-cover" />
            ) : (
              <div className="h-24 w-24 rounded-xl bg-neutral-200" />
            )}
            <div className="flex flex-col justify-center gap-1 min-w-0">
              <h3 className="font-semibold text-neutral-900 truncate">{venue.name}</h3>
              <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                <Star className="size-3.5 fill-current" />
                <span>{venue.rating || "New"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{formatLocationLine(address)}</span>
              </div>
            </div>
          </div>

          <CardContent className="p-4 space-y-4 text-sm">
            <div className="flex justify-between font-medium text-neutral-900">
              <div>
                <p>{dateObj ? format(dateObj, "MMM d, yyyy") : "No date selected"}</p>
                <p className="text-neutral-500 font-normal">
                  {startTime} – {endTime}
                </p>
              </div>
            </div>

            <Separator />

            <h4 className="font-semibold text-neutral-900">Price Details</h4>

            <div className="flex justify-between text-neutral-600">
              <span>
                ${dynamicHourlyRate.toFixed(2)} USD × {effectiveHours.toFixed(1)} hours
              </span>
              <span className="text-neutral-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Processing Fee</span>
              <span className="text-neutral-900">${processing.toFixed(2)}</span>
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-base text-neutral-900">
              <span>Total (USD)</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
