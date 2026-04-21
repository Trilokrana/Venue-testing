"use client"

import React from "react"
// import { useUser } from "@/hooks/useUser"; // adjust path to your hook
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/hooks/use-user"
import { AlertCircle } from "lucide-react"

export type UserRole = "venue_owner" | "rentee"

interface RoleBasedRendererProps {
  /** Component to render when the user's role is `venue_owner` */
  venueOwnerComponent: React.ReactNode
  /** Component to render when the user's role is `rentee` */
  renteeComponent: React.ReactNode
  /** Optional custom loading UI. Defaults to a Skeleton layout. */
  loadingFallback?: React.ReactNode
  /** Optional custom fallback UI for unknown/missing role. */
  unauthorizedFallback?: React.ReactNode
}

/** Default Skeleton-based loading UI */
const DefaultLoadingUI = () => (
  <Card className="w-full">
    <CardHeader className="space-y-3">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </CardContent>
  </Card>
)

/** Default fallback UI for unrecognised roles */
const DefaultUnauthorizedUI = () => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Access restricted</AlertTitle>
    <AlertDescription>
      Your account doesn’t have a recognised role assigned. Please contact support or try signing in
      again.
    </AlertDescription>
  </Alert>
)

export default function RoleBasedRenderer({
  venueOwnerComponent,
  renteeComponent,
  loadingFallback,
  unauthorizedFallback,
}: RoleBasedRendererProps) {
  const { data: user, isLoading } = useUser()

  // 1. Loading state
  if (isLoading) {
    return <>{loadingFallback ?? <DefaultLoadingUI />}</>
  }

  // 2. Role-based rendering
  switch (user?.userType as UserRole | undefined) {
    case "venue_owner":
      return <>{venueOwnerComponent}</>
    case "rentee":
      return <>{renteeComponent}</>
    default:
      // 3. Fallback for unknown/missing roles
      return <>{unauthorizedFallback ?? <DefaultUnauthorizedUI />}</>
  }
}
