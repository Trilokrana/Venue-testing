import { getCronofyConfig } from "./config"

type UserInfoJson = {
  sub?: string
  "cronofy.data"?: {
    profiles?: Array<{ profile_id: string; profile_connected?: boolean }>
  }
}

/** First connected Cronofy profile_id (for create-calendar API). */
export async function getCronofyPrimaryProfileId(accessToken: string): Promise<string | null> {
  const { apiUrl } = getCronofyConfig()
  const res = await fetch(`${apiUrl}/v1/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  const data = (await res.json()) as UserInfoJson
  const profiles = data["cronofy.data"]?.profiles ?? []
  const connected = profiles.find((p) => p.profile_connected !== false) ?? profiles[0]
  return connected?.profile_id ?? null
}
