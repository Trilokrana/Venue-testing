"use client"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SimpleSelect } from "@/components/ui/react-select"
import { OptionObj } from "@/components/ui/react-select/types"
import { AMENITY_GROUPS } from "@/lib/venues/amenities"
import { ChevronDownIcon, Search } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

interface AmenitySelectorProps {
  selectedAmenities: string[]
  onChange: (amenities: string[]) => void
}

function AmenitySelector({ selectedAmenities, onChange }: AmenitySelectorProps) {
  const [groupFilter, setGroupFilter] = useState<string>("")
  const [search, setSearch] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const isSearching = search.trim().length > 0
  const searchLower = search.trim().toLowerCase()

  const groupOptions = useMemo<OptionObj[]>(() => {
    return [
      { label: "All groups", value: "" },
      ...AMENITY_GROUPS.map((group) => ({
        label: group.label,
        value: group.id,
      })),
    ]
  }, [])

  const allAmenityIds = useMemo(() => {
    return AMENITY_GROUPS.flatMap((g) => g.items.map((i) => i.id))
  }, [])

  const isAllSelected = useMemo(() => {
    if (allAmenityIds.length === 0) return false
    const selected = new Set(selectedAmenities)
    return allAmenityIds.every((id) => selected.has(id))
  }, [allAmenityIds, selectedAmenities])

  const filteredGroups = useMemo(() => {
    const byGroup =
      groupFilter.trim().length === 0
        ? AMENITY_GROUPS
        : AMENITY_GROUPS.filter((g) => g.id === groupFilter)

    if (!isSearching) return byGroup

    return byGroup
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.label.toLowerCase().includes(searchLower)),
      }))
      .filter((group) => group.items.length > 0)
  }, [groupFilter, isSearching, searchLower])

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])

  const toggleAmenity = useCallback(
    (amenityId: string) => {
      if (selectedAmenities.includes(amenityId)) {
        onChange(selectedAmenities.filter((id) => id !== amenityId))
      } else {
        onChange([...selectedAmenities, amenityId])
      }
    },
    [selectedAmenities, onChange]
  )

  const selectAllAmenities = useCallback(() => {
    onChange(allAmenityIds)
  }, [allAmenityIds, onChange])

  const clearAllAmenities = useCallback(() => {
    onChange([])
  }, [onChange])

  const isAllSelectedInGroup = useCallback(
    (groupId: string) => {
      const group = AMENITY_GROUPS.find((g) => g.id === groupId)
      if (!group || group.items.length === 0) return false
      const selected = new Set(selectedAmenities)
      return group.items.every((i) => selected.has(i.id))
    },
    [selectedAmenities]
  )

  const toggleSelectAllInGroup = useCallback(
    (groupId: string) => {
      const group = AMENITY_GROUPS.find((g) => g.id === groupId)
      if (!group) return

      const groupIds = group.items.map((i) => i.id)
      const selected = new Set(selectedAmenities)
      const allSelected = groupIds.every((id) => selected.has(id))

      if (allSelected) {
        groupIds.forEach((id) => selected.delete(id))
      } else {
        groupIds.forEach((id) => selected.add(id))
      }

      onChange(Array.from(selected))
    },
    [selectedAmenities, onChange]
  )

  const selectedCountForGroup = useCallback(
    (groupId: string) => {
      const group = AMENITY_GROUPS.find((g) => g.id === groupId)
      if (!group) return 0
      return group.items.filter((item) => selectedAmenities.includes(item.id)).length
    },
    [selectedAmenities]
  )

  function isGroupExpanded(groupId: string) {
    if (isSearching) return true
    return expandedGroups.has(groupId)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Search amenities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:w-[240px] pl-9"
            />
          </div>

          <div className="min-w-[240px]">
            <SimpleSelect
              options={groupOptions}
              value={groupOptions.find((o) => o.value === groupFilter) ?? null}
              onChange={(value) => {
                const selectedOption = value as OptionObj | null
                setGroupFilter(selectedOption?.value ?? "")
              }}
              isClearable
            />
          </div>
        </div>
        {/* <Label className="flex items-center gap-2">
          Select all amenities
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={(checked) => {
              if (checked) selectAllAmenities()
              else clearAllAmenities()
            }}
          />
        </Label> */}
      </div>
      <p className="text-xs text-gray-500">
        {selectedAmenities.length === 0
          ? `No amenities selected`
          : `${selectedAmenities.length} amenity${selectedAmenities.length === 1 ? "" : "ies"} selected`}
      </p>
      <div className="space-y-2 rounded-md border overflow-hidden">
        {filteredGroups.map((group) => {
          const expanded = isGroupExpanded(group.id)
          const count = selectedCountForGroup(group.id)
          const groupAllSelected = isAllSelectedInGroup(group.id)

          const groupSelectId = `amenity-group-select-${group.id}`

          return (
            <div key={group.id}>
              <div className="flex w-full items-center justify-between gap-2 px-3 py-2 bg-gray-50">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left text-sm font-medium"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {group.label}
                    {count > 0 && (
                      <Badge className="ml-1.5 inline-flex items-center rounded-full py-0.5 text-xs font-medium">
                        {count}
                      </Badge>
                    )}
                  </span>
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <Label htmlFor={groupSelectId} className="text-xs text-muted-foreground">
                    Select group
                  </Label>
                  <Checkbox
                    id={groupSelectId}
                    checked={groupAllSelected}
                    onCheckedChange={() => toggleSelectAllInGroup(group.id)}
                  />
                </div>
              </div>

              {expanded && (
                <div className="grid grid-cols-1 gap-1 px-3 pb-3 sm:grid-cols-2">
                  {group.items.map((item) => {
                    const isChecked = selectedAmenities.includes(item.id)
                    return (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleAmenity(item.id)}
                        />
                        <span>{item.label}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {filteredGroups.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-gray-500">
            {`No amenities match your search`}
          </p>
        )}
      </div>
    </div>
  )
}

export default AmenitySelector
