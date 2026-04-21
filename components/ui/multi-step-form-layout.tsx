"use client"

import * as React from "react"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type MultiStepFormLayoutRootProps = React.ComponentProps<typeof Card>

function MultiStepFormLayoutRoot({ className, ...props }: MultiStepFormLayoutRootProps) {
  return (
    <Card data-slot="multi-step-form-layout" className={cn("w-full py-0", className)} {...props} />
  )
}

type MultiStepFormLayoutHeaderProps = React.ComponentProps<typeof CardHeader>

function MultiStepFormLayoutHeader({ className, ...props }: MultiStepFormLayoutHeaderProps) {
  return (
    <CardHeader
      data-slot="multi-step-form-layout-header"
      className={cn("border-b space-y-2 py-3 [.border-b]:pb-3", className)}
      {...props}
    />
  )
}

type MultiStepFormLayoutContentProps = React.ComponentProps<typeof CardContent>

function MultiStepFormLayoutContent({ className, ...props }: MultiStepFormLayoutContentProps) {
  return (
    <CardContent
      data-slot="multi-step-form-layout-content"
      className={cn("h-[56dvh] overflow-y-auto pb-2", className)}
      {...props}
    />
  )
}

type MultiStepFormLayoutFooterProps = React.ComponentProps<typeof CardFooter>

function MultiStepFormLayoutFooter({ className, ...props }: MultiStepFormLayoutFooterProps) {
  return (
    <CardFooter
      data-slot="multi-step-form-layout-footer"
      className={cn(
        "justify-end border-t px-6 group-data-[size=sm]/card:px-2 [.border-t]:py-2 group-data-[size=sm]/card:[.border-t]:pt-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * Opinionated card shell for {@link MultiStepForm}: header (progress + titles), body, footer.
 * Compose with `MultiStepForm.Progress`, `MultiStepForm.Header`, step fields, and actions.
 */
export const MultiStepFormLayout = Object.assign(MultiStepFormLayoutRoot, {
  Header: MultiStepFormLayoutHeader,
  Content: MultiStepFormLayoutContent,
  Footer: MultiStepFormLayoutFooter,
})
