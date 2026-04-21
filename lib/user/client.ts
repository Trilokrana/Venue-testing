import api from "@/lib/axios"

export type UpdateUserPayload = {
  accountType?: "venue_owner" | "rentee"
  displayName?: string
  photoUrl?: string | null
}

export const getUser = async () => {
  try {
    const response = await api.get("/api/user")
    return response.data
  } catch (error) {
    console.error("Failed to get user:", error)
    throw error
  }
}

export const updateUser = async (data: UpdateUserPayload) => {
  try {
    const response = await api.post("/api/user/edit", data)
    return response.data
  } catch (error) {
    console.error("Failed to update user:", error)
    throw error
  }
}