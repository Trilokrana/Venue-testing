import { useEffect, useRef, useState } from "react"

interface UseGooglePlacesAutocompleteOptions {
  onPlaceSelected: (placeId: string) => void | Promise<void>
  fields?: string[]
  types?: string[]
}

interface UseGooglePlacesAutocompleteResult {
  inputRef: React.RefObject<HTMLInputElement | null>
  isReady: boolean
}

/**
 * Hook to integrate Google Places Autocomplete with an input field.
 *
 * @param options - Configuration options
 * @param options.onPlaceSelected - Callback invoked when a place is selected, receives the place_id
 * @param options.fields - Optional array of fields to request from Places API
 * @param options.types - Optional array of types to restrict autocomplete results
 *
 * @returns Object containing inputRef (to attach to input element) and isReady status
 *
 * @example
 * ```tsx
 * const { inputRef, isReady } = useGooglePlacesAutocomplete({
 *   onPlaceSelected: async (placeId) => {
 *     const details = await fetchPlaceDetails(placeId);
 *     setValue('address', details.address);
 *   }
 * });
 *
 * <input ref={inputRef} />
 * ```
 */

interface GoogleMapsPlaceResult {
  place_id?: string
  formatted_address?: string
  address_components?: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  geometry?: {
    location?: {
      lat(): number
      lng(): number
    }
  }
}

interface GoogleMapsAutocomplete {
  addListener(event: string, handler: () => void): void
  getPlace(): GoogleMapsPlaceResult
}

export function useGooglePlacesAutocomplete(
  options: UseGooglePlacesAutocompleteOptions
): UseGooglePlacesAutocompleteResult {
  const { onPlaceSelected, fields, types } = options

  const inputRef = useRef<HTMLInputElement | null>(null)
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null)
  const [isScriptReady, setIsScriptReady] = useState(false)
  const [isInputMounted, setIsInputMounted] = useState(false)

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === "undefined") return

    // Check if already loaded
    if (window.google?.maps?.places) {
      setIsScriptReady(true)
      return
    }

    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key) {
      console.warn("Google Maps API key is not configured. Address autocomplete will not work.")
      return
    }

    const scriptId = "gmaps-places"

    // Check if script tag already exists
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null
    if (existing) {
      // If the script tag exists but the API isn't ready yet, wait for it.
      const onLoad = () => setIsScriptReady(true)
      existing.addEventListener("load", onLoad)

      // If the script already loaded before we attached the listener, mark ready.
      if (window.google?.maps?.places) {
        setIsScriptReady(true)
      }

      return () => {
        existing.removeEventListener("load", onLoad)
      }
    }

    const script = document.createElement("script")
    script.id = scriptId
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setIsScriptReady(true)
    document.body.appendChild(script)
  }, [])

  // Track when input is mounted
  useEffect(() => {
    if (inputRef.current && !isInputMounted) {
      setIsInputMounted(true)
    }
  }, [inputRef.current, isInputMounted])

  // Initialize autocomplete
  useEffect(() => {
    if (!isScriptReady || !isInputMounted || !inputRef.current || !window.google?.maps?.places) {
      return
    }

    try {
      const defaultFields = ["place_id", "formatted_address", "address_components", "geometry"]
      const defaultTypes = ["address"]

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: fields || defaultFields,
        types: types || defaultTypes,
      })

      autocompleteRef.current.addListener("place_changed", async () => {
        if (!autocompleteRef.current) return

        const place = autocompleteRef.current.getPlace()
        const placeId = place.place_id

        if (!placeId) return

        try {
          await onPlaceSelected(placeId)
        } catch (error) {
          // Error handling is delegated to the consumer
          console.warn("Error in onPlaceSelected callback:", error)
        }
      })
    } catch (error) {
      // Silent fail - autocomplete won't be available
      console.warn("Failed to initialize Google Places Autocomplete:", error)
    }

    // Cleanup function
    return () => {
      if (autocompleteRef.current) {
        if (window.google?.maps?.event) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
        }
        autocompleteRef.current = null
      }
    }
  }, [isScriptReady, isInputMounted, onPlaceSelected, fields, types])

  return {
    inputRef,
    isReady: isScriptReady && isInputMounted,
  }
}
