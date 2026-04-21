import {
  ClearIndicator,
  DropdownIndicator,
  MultiValueRemove,
  Option,
} from "@/components/ui/react-select/components"
import { defaultClassNames, defaultStyles } from "@/components/ui/react-select/helper"
import * as React from "react"
import type { Props } from "react-select"
import SelectComponent from "react-select"

const SimpleSelect = React.forwardRef<
  React.ElementRef<typeof SelectComponent>,
  React.ComponentPropsWithoutRef<typeof SelectComponent>
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
    <SelectComponent
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
SimpleSelect.displayName = "SimpleSelect"
export default SimpleSelect
