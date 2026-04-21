// hooks.tsx
import React from "react"
import { GroupBase } from "react-select"
import { CreatableProps } from "react-select/creatable"

export const useFormatters = <Option,>() => {
  // For CreatableSelect
  const formatCreateLabel: CreatableProps<Option, false, GroupBase<Option>>["formatCreateLabel"] = (
    label
  ) => (
    <span className="text-sm">
      Add <span className="font-semibold">{` "${label}"`}</span>
    </span>
  )

  // For GroupedOptions
  const formatGroupLabel = (data: GroupBase<Option>): React.ReactNode => (
    <div className="flex items-center justify-between">
      <span>{data.label}</span>
      <span className="rounded-md bg-secondary px-1 text-xs font-normal text-secondary-foreground shadow-sm">
        {data.options.length}
      </span>
    </div>
  )

  return {
    formatCreateLabel,
    formatGroupLabel,
  }
}
