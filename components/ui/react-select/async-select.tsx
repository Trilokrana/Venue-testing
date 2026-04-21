import {
  ClearIndicator,
  DropdownIndicator,
  MultiValueRemove,
  Option,
} from "@/components/ui/react-select/components"
import { defaultClassNames, defaultStyles } from "@/components/ui/react-select/helper"
import * as React from "react"
import type { Props } from "react-select"
import AsyncSelectComponent from "react-select/async"

const AsyncSelect = React.forwardRef<
  React.ElementRef<typeof AsyncSelectComponent>,
  React.ComponentPropsWithoutRef<typeof AsyncSelectComponent>
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
    <AsyncSelectComponent
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
AsyncSelect.displayName = "Async Select"
export default AsyncSelect
