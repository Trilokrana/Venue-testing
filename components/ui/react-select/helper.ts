import { cn } from "@/lib/utils"
import { type ClassNamesConfig, type GroupBase, type StylesConfig } from "react-select"
/**
 * styles that aligns with shadcn/ui
 */
const controlStyles = {
  base: cn(
    // === EXACT SAME AS INPUT ===
    "bg-white border placeholder:text-muted-foreground/50",
    "!min-h-10 w-full rounded-sm px-3 py-1 text-base md:text-sm",
    "shadow-xs outline-none transition-[color,box-shadow]",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px] focus-visible:ring-offset-0",
    "dark:bg-input/30 data-invalid:border-destructive data-invalid:ring-destructive/20 data-invalid:ring-offset-destructive",
    // react-select specific
    "flex items-center"
  ),
  focus: "border-ring ring-3 ring-ring/50 ring-offset-0",
  disabled: "opacity-50 cursor-not-allowed",
}

const placeholderStyles = "text-sm text-muted-foreground/50"
const valueContainerStyles = "gap-1"
const multiValueStyles =
  "inline-flex items-center gap-2 rounded-md border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 px-1.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
const indicatorsContainerStyles = "gap-1"
const clearIndicatorStyles = "p-1 rounded-md"
const indicatorSeparatorStyles = "bg-transparent"
const dropdownIndicatorStyles = "p-1 rounded-md"
const menuStyles =
  "mt-1 border bg-popover text-popover-foreground shadow-md rounded-md overflow-hidden text-sm"
const groupHeadingStyles = "text-muted-foreground px-2 py-1.5 text-xs"
const optionStyles = {
  base: "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none",
  focus: "text-accent-foreground",
  disabled: "pointer-events-none opacity-50",
  selected: "bg-accent",
}
const noOptionsMessageStyles =
  "text-accent-foreground p-2 bg-accent border border-dashed border-border rounded-sm"
const loadingIndicatorStyles = "flex items-center justify-center h-4 w-4 opacity-50"
const loadingMessageStyles = "text-accent-foreground p-2 bg-accent"

/**
 * This factory method is used to build custom classNames configuration
 */
export const createClassNames = (classNames: ClassNamesConfig): ClassNamesConfig => {
  return {
    clearIndicator: (state) => cn(clearIndicatorStyles, classNames?.clearIndicator?.(state)),
    container: (state) => cn(classNames?.container?.(state)),
    control: (state) =>
      cn(
        controlStyles.base,
        state.isDisabled && controlStyles.disabled,
        state.isFocused && controlStyles.focus,
        classNames?.control?.(state)
      ),
    dropdownIndicator: (state) =>
      cn(dropdownIndicatorStyles, classNames?.dropdownIndicator?.(state)),
    group: (state) => cn(classNames?.group?.(state)),
    groupHeading: (state) => cn(groupHeadingStyles, classNames?.groupHeading?.(state)),
    indicatorsContainer: (state) =>
      cn(indicatorsContainerStyles, classNames?.indicatorsContainer?.(state)),
    indicatorSeparator: (state) =>
      cn(indicatorSeparatorStyles, classNames?.indicatorSeparator?.(state)),
    input: (state) => cn(classNames?.input?.(state)),
    loadingIndicator: (state) => cn(loadingIndicatorStyles, classNames?.loadingIndicator?.(state)),
    loadingMessage: (state) => cn(loadingMessageStyles, classNames?.loadingMessage?.(state)),
    menu: (state) => cn(menuStyles, classNames?.menu?.(state)),
    menuList: (state) => cn("p-1", classNames?.menuList?.(state)),
    menuPortal: (state) => cn(classNames?.menuPortal?.(state)),
    multiValue: (state) => cn(multiValueStyles, classNames?.multiValue?.(state)),
    multiValueLabel: (state) => cn(classNames?.multiValueLabel?.(state)),
    multiValueRemove: (state) => cn(classNames?.multiValueRemove?.(state)),
    noOptionsMessage: (state) => cn(noOptionsMessageStyles, classNames?.noOptionsMessage?.(state)),
    option: (state) =>
      cn(
        optionStyles.base,
        state.isFocused && optionStyles.focus,
        state.isDisabled && optionStyles.disabled,
        state.isSelected && optionStyles.selected,
        classNames?.option?.(state)
      ),
    placeholder: (state) => cn(placeholderStyles, classNames?.placeholder?.(state)),
    singleValue: (state) => cn(classNames?.singleValue?.(state)),
    valueContainer: (state) => cn(valueContainerStyles, classNames?.valueContainer?.(state)),
  }
}
export const defaultClassNames = createClassNames({})
export const defaultStyles: StylesConfig<unknown, boolean, GroupBase<unknown>> = {
  input: (base) => ({
    ...base,
    "input:focus": {
      boxShadow: "none",
    },
  }),
  multiValueLabel: (base) => ({
    ...base,
    whiteSpace: "normal",
    overflow: "visible",
  }),
  control: (base) => ({
    ...base,
    transition: "none",
    // minHeight: '2.25rem', // we used !min-h-9 instead
  }),
  menuList: (base) => ({
    ...base,
    "::-webkit-scrollbar": {
      background: "transparent",
    },
    "::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "::-webkit-scrollbar-thumb": {
      background: "hsl(var(--border))",
    },
    "::-webkit-scrollbar-thumb:hover": {
      background: "transparent",
    },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menu: (base) => ({ ...base, zIndex: 9999 }),
}
