import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        pending: "bg-yellow-200 text-yellow-900 border border-yellow-300 [a]:hover:bg-yellow-200",

        confirmed: "bg-green-200 text-green-900 border border-green-300 [a]:hover:bg-green-200",

        cancelled_by_guest: "bg-red-200 text-red-900 border border-red-300 [a]:hover:bg-red-200",

        cancelled_by_owner:
          "bg-rose-200 text-rose-900 border border-rose-300 [a]:hover:bg-rose-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type BadgeType = VariantProps<typeof badgeVariants>["variant"]
type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    variant?: BadgeType
    asChild?: boolean
  }

function Badge({ className, variant = "default", asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
