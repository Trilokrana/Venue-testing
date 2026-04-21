"use client"

import * as React from "react"
import { type FieldPath, type FieldValues, type UseFormReturn } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"

export type MultiStepFormStep<TFieldValues extends FieldValues> = {
  /** Stable id used by `<MultiStepForm.Step name={id} />`. */
  id: string
  /** Fields validated when moving forward from this step (`form.trigger`). */
  fields: readonly FieldPath<TFieldValues>[]
}

export type MultiStepFormContextValue<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>
  steps: MultiStepFormStep<TFieldValues>[]
  activeStep: number
  setActiveStep: React.Dispatch<React.SetStateAction<number>>
  goNext: () => Promise<void>
  goBack: () => void
  isFirstStep: boolean
  isLastStep: boolean
  currentStep: MultiStepFormStep<TFieldValues>
}

const MultiStepFormContext = React.createContext<MultiStepFormContextValue<FieldValues> | null>(
  null
)

export function useMultiStepFormContext<
  TFieldValues extends FieldValues = FieldValues,
>(): MultiStepFormContextValue<TFieldValues> {
  const ctx = React.useContext(MultiStepFormContext)
  if (!ctx) {
    throw new Error("MultiStepForm subcomponents must be used within <MultiStepForm>")
  }
  return ctx as MultiStepFormContextValue<TFieldValues>
}

type MultiStepFormRootProps<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>
  steps: MultiStepFormStep<TFieldValues>[]
  children: React.ReactNode
  className?: string
  /**
   * Initial step index (0-based). Only applied on first mount; to re-sync from async props,
   * remount with `key` or call `setActiveStep` from `useMultiStepFormContext`.
   */
  initialStep?: number
  onStepChange?: (stepIndex: number, stepId: string) => void
}

function MultiStepFormRoot<TFieldValues extends FieldValues>({
  form,
  steps,
  children,
  className,
  initialStep = 0,
  onStepChange,
}: MultiStepFormRootProps<TFieldValues>) {
  if (steps.length === 0) {
    throw new Error("MultiStepForm requires at least one step in `steps`")
  }

  const [activeStep, setActiveStepState] = React.useState(() =>
    Math.min(Math.max(initialStep, 0), steps.length - 1)
  )

  // Keep the active index valid if the step list shrinks.
  React.useEffect(() => {
    setActiveStepState((prev) => Math.min(Math.max(prev, 0), steps.length - 1))
  }, [steps.length])

  const setActiveStep = React.useCallback(
    (value: React.SetStateAction<number>) => {
      setActiveStepState((prev) => {
        const raw = typeof value === "function" ? value(prev) : value
        const next = Math.max(0, Math.min(raw, steps.length - 1))
        const step = steps[next]
        if (step) onStepChange?.(next, step.id)
        return next
      })
    },
    [onStepChange, steps]
  )

  const currentStep = steps[activeStep] ?? steps[0]!

  const goNext = React.useCallback(async () => {
    const step = steps[activeStep]
    if (!step) return
    const ok = await form.trigger(step.fields as FieldPath<TFieldValues>[], {
      shouldFocus: true,
    })
    if (!ok) return
    setActiveStep((s) => Math.min(s + 1, steps.length - 1))
  }, [activeStep, form, setActiveStep, steps])

  const goBack = React.useCallback(() => {
    setActiveStep((s) => s - 1)
  }, [setActiveStep])

  const isFirstStep = activeStep === 0
  const isLastStep = activeStep === steps.length - 1

  const value = React.useMemo<MultiStepFormContextValue<TFieldValues>>(
    () => ({
      form,
      steps,
      activeStep,
      setActiveStep,
      goNext,
      goBack,
      isFirstStep,
      isLastStep,
      currentStep,
    }),
    [form, steps, activeStep, setActiveStep, goNext, goBack, isFirstStep, isLastStep, currentStep]
  )

  return (
    <MultiStepFormContext.Provider value={value as MultiStepFormContextValue<FieldValues>}>
      <Form {...form}>
        <div data-slot="multi-step-form" className={cn("flex flex-col gap-6", className)}>
          {children}
        </div>
      </Form>
    </MultiStepFormContext.Provider>
  )
}

function MultiStepFormStep<TFieldValues extends FieldValues>({
  name,
  children,
  className,
}: {
  name: string
  children: React.ReactNode
  className?: string
}) {
  const { steps, activeStep } = useMultiStepFormContext<TFieldValues>()
  const index = steps.findIndex((s) => s.id === name)
  if (index === -1) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[MultiStepForm.Step] Unknown step id "${name}"`)
    }
    return null
  }
  if (index !== activeStep) return null
  return (
    <div
      data-slot="multi-step-form-step"
      data-step={name}
      className={cn("flex flex-col gap-4", className)}
    >
      {children}
    </div>
  )
}

function MultiStepFormProgress({ className }: { className?: string }) {
  const { activeStep, steps } = useMultiStepFormContext()
  const value = ((activeStep + 1) / steps.length) * 100
  return <Progress value={value} className={className} />
}

function MultiStepFormHeader({
  className,
  title,
  description,
}: {
  className?: string
  title?: React.ReactNode
  description?: React.ReactNode
}) {
  const { activeStep, steps, currentStep } = useMultiStepFormContext()
  return (
    <div data-slot="multi-step-form-header" className={cn("space-y-1", className)}>
      <p className="text-muted-foreground text-sm">
        Step {activeStep + 1} of {steps.length}
        {currentStep?.id ? (
          <Badge variant="outline" className="ml-2 capitalize">
            {currentStep.id.split("-").join(" ")}
          </Badge>
        ) : null}
      </p>
      {title != null ? <div className="text-base font-medium">{title}</div> : null}
      {description != null ? <p className="text-muted-foreground text-sm">{description}</p> : null}
    </div>
  )
}

function MultiStepFormActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="multi-step-form-actions"
      className={cn("flex flex-wrap items-center justify-between gap-2", className)}
      {...props}
    />
  )
}

function MultiStepFormBack({
  children = "Back",
  className,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "type">) {
  const { goBack, isFirstStep } = useMultiStepFormContext()
  if (isFirstStep) return null
  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={(e) => {
        onClick?.(e)
        goBack()
      }}
      {...props}
    >
      {children}
    </Button>
  )
}

function MultiStepFormNext({
  children = "Next",
  className,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "type">) {
  const { goNext, isLastStep } = useMultiStepFormContext()
  if (isLastStep) return null
  return (
    <Button
      type="button"
      className={cn("cursor-pointer px-6", className)}
      onClick={(e) => {
        onClick?.(e)
        void goNext()
      }}
      {...props}
    >
      {children}
    </Button>
  )
}

function MultiStepFormSubmit({
  children = "Submit",
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "type">) {
  const { isLastStep } = useMultiStepFormContext()
  if (!isLastStep) return null
  return (
    <Button type="submit" className={className} {...props}>
      {children}
    </Button>
  )
}

/**
 * Compound multi-step form: wraps `react-hook-form` (`FormProvider`) and tracks the active step.
 * Pair with a single Zod object schema + `zodResolver` on `useForm`; use `steps[].fields` to
 * validate each step before advancing.
 *
 * Place a native `<form onSubmit={form.handleSubmit(...)}>` inside and use shadcn `Form*` fields as usual
 * (this root wraps the same `Form` / `FormProvider` pattern as `@/components/ui/form`).
 */
export const MultiStepForm = Object.assign(MultiStepFormRoot, {
  Step: MultiStepFormStep,
  Progress: MultiStepFormProgress,
  Header: MultiStepFormHeader,
  Actions: MultiStepFormActions,
  Back: MultiStepFormBack,
  Next: MultiStepFormNext,
  Submit: MultiStepFormSubmit,
})
