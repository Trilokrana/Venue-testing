import * as React from "react"
import type {
  ClearIndicatorProps,
  DropdownIndicatorProps,
  MultiValueRemoveProps,
  OptionProps,
} from "react-select"
import { components } from "react-select"
import { ChevronDown, X, Check } from "lucide-react"

export const DropdownIndicator = (props: DropdownIndicatorProps) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronDown className={"h-4 w-4 opacity-40 fill:text-muted-foreground/50"} />
    </components.DropdownIndicator>
  )
}

export const ClearIndicator = (props: ClearIndicatorProps) => {
  return (
    <components.ClearIndicator {...props}>
      <X className={"h-3.5 w-3.5 opacity-50"} />
    </components.ClearIndicator>
  )
}

export const MultiValueRemove = (props: MultiValueRemoveProps) => {
  return (
    <components.MultiValueRemove {...props}>
      <X className={"h-3 w-3 opacity-50"} />
    </components.MultiValueRemove>
  )
}

export const Option = (props: OptionProps) => {
  return (
    <components.Option {...props}>
      <div className="flex items-center justify-between">
        {/* TODO: Figure out the type */}
        <div className="w-full">{(props.data as { label: string }).label}</div>
        {props.isSelected && <Check className="h-4 w-4 right-0 top-0 " />}
      </div>
    </components.Option>
  )
}
