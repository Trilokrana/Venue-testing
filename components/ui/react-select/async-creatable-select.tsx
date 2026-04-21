// This example uses the combined async + creatable variant, imported from react-select/async-creatable
import {
  ClearIndicator,
  DropdownIndicator,
  MultiValueRemove,
  Option,
} from "@/components/ui/react-select/components"
import { defaultClassNames, defaultStyles } from "@/components/ui/react-select/helper"
import * as React from "react"
import type { Props } from "react-select"
import AsyncCreatableSelectComponent from "react-select/async-creatable"

const AsyncCreatableSelect = React.forwardRef<
  React.ElementRef<typeof AsyncCreatableSelectComponent>,
  React.ComponentPropsWithoutRef<typeof AsyncCreatableSelectComponent>
>((props: Props, ref) => {
  const {
    value,
    onChange,
    options = [],
    styles = defaultStyles,
    classNames = defaultClassNames,
    components = {},
    menuPlacement = "auto",
    menuPosition = "fixed",
    ...rest
  } = props

  const id = React.useId()

  return (
    <AsyncCreatableSelectComponent
      instanceId={id}
      ref={ref}
      value={value}
      onChange={onChange}
      options={options}
      unstyled
      components={{
        DropdownIndicator,
        ClearIndicator,
        MultiValueRemove,
        Option,
        ...components,
      }}
      styles={styles}
      classNames={classNames}
      menuPosition={menuPosition}
      menuPlacement={menuPlacement}
      {...rest}
    />
  )
})

AsyncCreatableSelect.displayName = "Async Creatable Select"
export default AsyncCreatableSelect
