import type { Metadata } from "next"

import { fetchActiveVenues } from "@/lib/venues/queries"

import { ListingsPageClient } from "./listings-page-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Venue listings",
  description:
    "Search venues by event type, location, and time. Compare spaces side by side with the map.",
}

export default async function ListingsPage() {
  const venues = await fetchActiveVenues()
  return <ListingsPageClient venues={venues} />
}
