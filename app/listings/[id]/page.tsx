import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { fetchVenueById } from "@/lib/venues/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server-client"

import { VenueDetailView } from "./venue-detail-view"

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const venue = await fetchVenueById(id)
  if (!venue) {
    return { title: "Venue not found" }
  }
  return {
    title: `${venue.name} · Venues`,
    description: venue.description?.slice(0, 160) ?? `Book ${venue.name} for your next event.`,
  }
}

export default async function VenueDetailPage({ params }: PageProps) {
  const { id } = await params
  const venue = await fetchVenueById(id)
  if (!venue) {
    notFound()
  }

  // Check if the logged-in user is this venue's owner
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = Boolean(user && venue.owner_id === user.id)

  return <VenueDetailView venue={venue} isOwner={isOwner} />
}