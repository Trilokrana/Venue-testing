"use client"

import { useJsApiLoader } from "@react-google-maps/api"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { ALL_PLANNING, getTimeSlotOptions } from "@/app/listings/data"
import type { SearchPlace } from "@/components/listings/venue-search-bar"
import { VenueSearchBar } from "@/components/listings/venue-search-bar"

import { Button } from "@/components/ui/button"
import Container from "@/core/ui/Container"
import Heading from "@/core/ui/Heading"
import SubHeading from "@/core/ui/SubHeading"
import { ArrowRightIcon, Building, DollarSign, ShieldCheck } from "lucide-react"

const TIME_OPTIONS = getTimeSlotOptions()

const heroImages = [
  "/images/hero-image-1.jpg",
  "/images/pexels-ichad-windhiagiri.jpg",
  "/images/pexels-quin-bridal.jpg",
]

const heroHeadings = [
  "Find Your Perfect Venue",
  "Discover Creative Spaces",
  "Book Your Dream Event",
]

const featuredVenueCategories = [
  {
    title: "Performance spaces",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=500&w=300&h=200&auto=format&fit=crop",
    type: "theater_auditorium",
  },
  {
    title: "Video shoot locations",
    image:
      "https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=800&auto=format&fit=crop",
    type: "event_space_studio",
  },
  {
    title: "Film shoot locations",
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop",
    type: "warehouse_industrial_space",
  },
  {
    title: "Green screen spaces",
    image:
      "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=800&auto=format&fit=crop",
    type: "event_space_studio",
  },
  {
    title: "Influencer spaces",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop",
    type: "private_estate_mansion",
  },
]

const venueTypes = [
  { value: "banquet_hall", label: "Banquet Halls" },
  { value: "conference_center", label: "Conference Centers" },
  { value: "hotel_resort", label: "Hotels & Resorts" },
  { value: "restaurant_cafe", label: "Restaurants & Cafés" },
  { value: "garden_outdoor_space", label: "Garden & Outdoor Spaces" },
  { value: "theater_auditorium", label: "Theaters & Auditoriums" },
  { value: "loft_rooftop", label: "Lofts & Rooftops" },
  { value: "private_estate_mansion", label: "Private Estates & Mansions" },
]

const LIBRARIES = ["places"] as const


export default function Home() {
  const router = useRouter()

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [headingText, setHeadingText] = useState("")
  const [headingIndex, setHeadingIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length)
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const currentFullText = heroHeadings[headingIndex]
    let typingTimer: NodeJS.Timeout

    const typeSpeed = isDeleting ? 40 : 80 // Speed in ms

    if (!isDeleting && headingText === currentFullText) {
      // Pause at the end of typing before deleting
      typingTimer = setTimeout(() => setIsDeleting(true), 2500)
    } else if (isDeleting && headingText === "") {
      // Move to the next heading after deleting
      setIsDeleting(false)
      setHeadingIndex((prev) => (prev + 1) % heroHeadings.length)
    } else {
      // Type or delete characters
      typingTimer = setTimeout(() => {
        setHeadingText(currentFullText.substring(0, headingText.length + (isDeleting ? -1 : 1)))
      }, typeSpeed)
    }

    return () => clearTimeout(typingTimer)
  }, [headingText, isDeleting, headingIndex])

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    id: "venue-booking-google",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: LIBRARIES as any,
  })

  const [planning, setPlanning] = useState<string>(ALL_PLANNING)
  const [place, setPlace] = useState<SearchPlace | null>(null)
  const [date, setDate] = useState<Date | undefined>()
  const [startTime, setStartTime] = useState(TIME_OPTIONS[4] ?? "")
  const [endTime, setEndTime] = useState(TIME_OPTIONS[14] ?? "")

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (planning && planning !== ALL_PLANNING) params.set("planning", planning)
    if (place) {
      params.set("place", place.label)
      params.set("lat", String(place.lat))
      params.set("lng", String(place.lng))
    }
    if (date) params.set("date", date.toISOString())
    if (startTime) params.set("start", startTime)
    if (endTime) params.set("end", endTime)
    params.set("map", "1")

    router.push(`/listings?${params.toString()}`)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative w-full min-h-[700px] flex items-center justify-center pt-16 overflow-hidden bg-black">
          <div className="absolute inset-0 z-0">
            {heroImages.map((src, index) => (
              <Image
                key={src}
                src={src}
                alt={`Hero image ${index + 1}`}
                fill
                priority={index === 0}
                className={`object-cover brightness-[0.7] transition-opacity duration-1000 ease-in-out ${
                  index === currentImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              />
            ))}
          </div>

          <Container className="relative z-10 flex flex-col items-center justify-center h-full">
            <div className="max-w-5xl mx-auto text-center mb-12">
              <div className="inline-block px-6 py-2 bg-white/20 rounded-full backdrop-blur-sm mb-6">
                <h2 className="text-lg font-medium text-white">Venue Compass</h2>
              </div>
              <div className="h-[120px] md:h-[200px] lg:h-[240px] flex items-center justify-center mb-4">
                <h1 className="text-4xl md:text-7xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
                  {headingText}
                  <span className="inline-block w-[3px] md:w-[6px] h-[40px] md:h-[70px] lg:h-[90px] bg-white ml-2 align-middle -mt-2 opacity-100 animate-pulse"></span>
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
                Discover and book amazing spaces for any event or production
              </p>
            </div>

            {/* Search Components */}
            <div className="w-full max-w-5xl mx-auto relative z-20">
              <VenueSearchBar
                className="shadow-2xl"
                size="md"
                mapsLoaded={mapsLoaded}
                planning={planning}
                onPlanningChange={setPlanning}
                place={place}
                onPlaceChange={setPlace}
                date={date}
                onDateChange={setDate}
                startTime={startTime}
                endTime={endTime}
                onStartTimeChange={setStartTime}
                onEndTimeChange={setEndTime}
                onSearch={handleSearch}
              />
            </div>
          </Container>
        </section>

        {/* Featured Categories Section */}
        <section className="py-20 bg-white">
          <Container>
            <div className="mb-12">
              <Heading type={2} className="text-center mb-4">
                Inspiring Creative Spaces
              </Heading>
              <SubHeading className="text-center mb-10 max-w-3xl mx-auto">
                Unleash your creativity in our curated selection of studios and unique venues.
                Perfect for artists, photographers, and creatives crafting their next masterpiece.
              </SubHeading>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                {featuredVenueCategories.map((category, index) => (
                  <div
                    key={index}
                    className="relative rounded-xl overflow-hidden group cursor-pointer h-80"
                    onClick={() => {
                      router.push(`/listings?venue_type=${category.type}`)
                    }}
                  >
                    <div className="absolute inset-0">
                      <img
                        src={category.image}
                        alt={category.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <h3 className="text-xl font-bold mb-1">{category.title}</h3>
                      <p className="text-sm text-white/80 flex items-center">
                        Explore spaces
                        <ArrowRightIcon className="h-3.5 w-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gray-50">
          <Container>
            <div className="max-w-4xl mx-auto mb-16 text-center">
              <Heading type={2} className="mb-4">
                Why Choose Venue Compass
              </Heading>
              <p className="text-lg text-gray-600">
                We make finding and booking your perfect venue simple, secure, and stress-free.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">The perfect spaces</h3>
                <p className="text-gray-600 font-body">
                  From fully-equipped studios to seaside mansions or abandoned warehouses, you can
                  find your perfect fit.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Simple budgeting</h3>
                <p className="text-gray-600">
                  With clear hourly rates and no surprise fees, you&apos;ll know what you&apos;re
                  paying for, right from the get-go.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Cover your booking</h3>
                <p className="text-gray-600">
                  Things happen. Get the liability and damage protection you need for any event or
                  production.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 bg-white">
          <Container>
            <div className="bg-primary/5 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between">
              <div className="mb-8 md:mb-0 md:mr-8 md:max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to find your perfect venue?
                </h2>
                <p className="text-gray-600 text-lg">
                  Browse thousands of venues for any occasion. From intimate gatherings to
                  large-scale productions, find the space that fits your needs.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => router.push("/listings")}
                className="whitespace-nowrap bg-primary hover:bg-primary-600 text-white py-4 px-8 text-lg font-medium"
              >
                Browse All Venues
              </Button>
            </div>
          </Container>
        </section>
      </main>
    </div>
  )
}
