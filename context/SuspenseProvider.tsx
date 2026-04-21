import { Loader } from "lucide-react"
import { PropsWithChildren, Suspense } from "react"

export function SuspenseProvider({
  children,
  fallback,
}: PropsWithChildren<{ fallback?: React.ReactNode }>) {
  return (
    <Suspense
      fallback={
        fallback ?? (
          <div className="flex items-center justify-center h-full w-full p-6 text-sm text-muted-foreground">
            <Loader className="size-4 animate-spin" />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  )
}

export default SuspenseProvider
