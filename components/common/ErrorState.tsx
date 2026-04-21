"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AlertCircle, RefreshCw } from "lucide-react"
import Image from "next/image"

type ErrorStateProps = {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
  showErrorImage?: boolean
  errorImageTitle?: string | React.ReactNode
  errorImageDescription?: string | React.ReactNode
}

const ErrorState = ({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
  className,
  showErrorImage = true,
  errorImageTitle = "404",
  errorImageDescription = "Page not found",
}: ErrorStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center space-y-4 border border-border rounded-xl p-6 bg-card",
        className
      )}
    >
      {/* Icon */}
      <div className="bg-red-100 text-red-600 p-4 rounded-full">
        <AlertCircle className="w-8 h-8" />
      </div>

      {/* Title */}
      {title && <h2 className="text-xl font-semibold">{title}</h2>}

      {/* Description */}
      {description && <p className="text-muted-foreground max-w-md">{description}</p>}

      {/* Image */}
      {showErrorImage && (
        <div>
          {errorImageTitle && <h2 className="text-4xl font-bold">{errorImageTitle}</h2>}
          <Image src="/images/no-data-concept.png" alt="Error" width={200} height={200} />
          {errorImageDescription && (
            <p className="text-muted-foreground">{errorImageDescription}</p>
          )}
        </div>
      )}

      {/* Action */}
      {onRetry && (
        <Button onClick={onRetry} className="mt-2">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try again
        </Button>
      )}
    </div>
  )
}

export default ErrorState
