"use client"

import { getUser, updateUser, type UpdateUserPayload } from "@/lib/user/client"
import { User } from "@supabase/supabase-js"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

type UserType = "venue_owner" | "rentee" | null

interface UseUserResult {
  user: User | null
  userType: UserType
  displayName: string | null
  photoUrl: string | null
}

export function useUser() {
  return useQuery<UseUserResult>({
    queryKey: ["user"], // Unique key for caching
    queryFn: getUser,
    staleTime: Infinity, // Never refetch automatically (unless you tell it to)
    retry: false, // Don't retry if 401 (not logged in)
    refetchOnWindowFocus: "always",
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] })
    },
    onError: (error) => {
      console.error("Failed to update user:", error)
    },
  })
}
