import { Car, Coffee, Music, Wifi } from "lucide-react"

export const getAmenityIcon = (amenity: string) => {
  const icons: Record<string, any> = {
    wifi: Wifi,
    parking: Car,
    catering_allowed: Coffee,
    outside_food_allowed: Coffee,
    alcohol_served_on_site: Coffee,
    audio_system: Music,
  }
  const Icon = icons[amenity]
  return Icon ? <Icon className="h-3 w-3" /> : null
}
