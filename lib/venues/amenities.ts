export interface AmenityItem {
  id: string
  label: string
}

export interface AmenityGroup {
  id: string
  label: string
  items: AmenityItem[]
}

export const AMENITY_GROUPS: AmenityGroup[] = [
  {
    id: "food_beverage",
    label: "Food & Beverage",
    items: [
      { id: "outside_food_allowed", label: "Outside food allowed" },
      { id: "outside_alcohol_byob", label: "Outside alcohol / BYOB allowed" },
      { id: "alcohol_served_on_site", label: "Alcohol served on-site (bar / bartender available)" },
      { id: "catering_allowed", label: "Catering allowed" },
      { id: "prep_area", label: "Prep area" },
      { id: "kitchenette", label: "Kitchenette (sink + mini fridge / light prep)" },
      { id: "full_kitchen", label: "Full kitchen (standard residential)" },
      { id: "commercial_kitchen", label: "Commercial kitchen" },
      { id: "refrigerator", label: "Refrigerator" },
      { id: "freezer", label: "Freezer" },
      { id: "ice_machine", label: "Ice machine" },
      { id: "microwave", label: "Microwave" },
      { id: "oven_stove", label: "Oven / stove" },
      { id: "dishwasher", label: "Dishwasher" },
    ],
  },
  {
    id: "furniture_layout",
    label: "Furniture & Layout",
    items: [
      { id: "tables", label: "Tables" },
      { id: "chairs", label: "Chairs" },
      { id: "bar_seating", label: "Bar seating / high-top tables" },
      { id: "lounge_seating", label: "Lounge seating / sofas" },
      { id: "conference_table", label: "Conference table" },
      { id: "private_rooms", label: "Private rooms / breakout rooms" },
      { id: "dressing_room", label: "Dressing room / green room" },
      { id: "coat_check", label: "Coat rack / coat check area" },
      { id: "storage_area", label: "Storage / holding area" },
    ],
  },
  {
    id: "av_production",
    label: "AV & Production",
    items: [
      { id: "speakers_pa", label: "Speakers / PA system" },
      { id: "microphones", label: "Microphones" },
      { id: "dj_booth", label: "DJ booth / DJ-ready" },
      { id: "projector", label: "Projector" },
      { id: "projector_screen", label: "Projector screen" },
      { id: "large_tv_display", label: "Large TV / display" },
      { id: "hdmi_av_inputs", label: "HDMI / AV inputs available" },
      { id: "event_lighting", label: "Lighting for events (basic)" },
      { id: "stage_lighting", label: "Stage lighting (production)" },
      { id: "dance_floor", label: "Dance floor" },
      { id: "photo_backdrop", label: "Photo-friendly backdrop area" },
      { id: "blackout_capability", label: "Blackout capability (curtains / controlled light)" },
    ],
  },
  {
    id: "connectivity_power",
    label: "Connectivity & Power",
    items: [
      { id: "wifi", label: "Wi-Fi" },
      { id: "high_speed_internet", label: "High-speed internet (100+ Mbps)" },
      { id: "dedicated_work_area", label: "Dedicated work area" },
      { id: "plenty_of_outlets", label: "Plenty of outlets" },
      { id: "extension_cords", label: "Extension cords / power strips available" },
      { id: "ev_charger", label: "EV charger" },
    ],
  },
  {
    id: "climate_comfort",
    label: "Climate & Comfort",
    items: [
      { id: "heating", label: "Heating" },
      { id: "air_conditioning", label: "Air conditioning" },
      { id: "fans_ventilation", label: "Fans / ventilation" },
      { id: "fireplace", label: "Fireplace" },
    ],
  },
  {
    id: "bathrooms_accessibility",
    label: "Bathrooms & Accessibility",
    items: [
      { id: "restrooms_on_site", label: "Restrooms on-site" },
      { id: "accessible_restroom", label: "Accessible restroom (ADA-friendly)" },
      { id: "wheelchair_accessible_entrance", label: "Wheelchair accessible entrance" },
      { id: "elevator", label: "Elevator (if not ground floor)" },
      { id: "baby_changing_station", label: "Family / baby changing station" },
    ],
  },
  {
    id: "parking_loading_access",
    label: "Parking, Loading & Access",
    items: [
      { id: "free_on_site_parking", label: "Free on-site parking" },
      { id: "paid_parking_nearby", label: "Paid parking nearby" },
      { id: "street_parking", label: "Street parking" },
      { id: "loading_zone", label: "Loading zone" },
      { id: "loading_dock", label: "Loading dock" },
      { id: "ground_level_access", label: "Ground-level access" },
      { id: "freight_elevator", label: "Freight elevator" },
    ],
  },
  {
    id: "outdoor_special",
    label: "Outdoor & Special Features",
    items: [
      { id: "outdoor_space_patio", label: "Outdoor space / patio" },
      { id: "yard_lawn", label: "Yard / lawn" },
      { id: "rooftop_access", label: "Rooftop access" },
      { id: "balcony_terrace", label: "Balcony / terrace" },
      { id: "swimming_pool", label: "Swimming pool" },
      { id: "hot_tub", label: "Hot tub" },
      { id: "grill_bbq", label: "Grill / BBQ area" },
      { id: "fire_pit", label: "Fire pit" },
    ],
  },
  {
    id: "policies",
    label: "Policies",
    items: [
      { id: "smoking_allowed", label: "Smoking allowed" },
      { id: "pets_allowed", label: "Pets allowed" },
      { id: "amplified_sound_allowed", label: "Music / amplified sound allowed" },
      { id: "late_night_events_allowed", label: "Late-night events allowed" },
      { id: "kids_allowed", label: "Kids allowed" },
      { id: "security_required", label: "Security required" },
    ],
  },
  {
    id: "services_staffing",
    label: "Services & Staffing",
    items: [
      { id: "on_site_staff", label: "On-site staff" },
      { id: "cleaning_included", label: "Cleaning provided / included" },
      { id: "setup_breakdown_available", label: "Setup / breakdown available" },
      { id: "security_available", label: "Security available" },
      { id: "av_technician_available", label: "AV technician available" },
    ],
  },
]

/**
 * Returns a flat map of amenity id -> { label, groupLabel } for quick lookup.
 * Useful for re-grouping stored amenity IDs on the listing detail page.
 */
export function getAllAmenities(): Map<string, { label: string; groupLabel: string }> {
  const map = new Map<string, { label: string; groupLabel: string }>()
  for (const group of AMENITY_GROUPS) {
    for (const item of group.items) {
      map.set(item.id, { label: item.label, groupLabel: group.label })
    }
  }
  return map
}
