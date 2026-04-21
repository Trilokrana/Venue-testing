import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { Database } from "@/lib/supabase/database.types"
import getSupabaseClientKeys from "@/lib/supabase/get-supabase-client-keys"

/**
 * @name getSupabaseServerComponentClient
 * @description Get a Supabase client for use in the Server Components
 * @param params
 */
const getSupabaseServerComponentClient = async (
  params = {
    admin: false,
  }
) => {
  const keys = getSupabaseClientKeys()
  const cookiesStrategy = await getCookiesStrategy()

  if (params.admin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      throw new Error("Supabase Service Role Key not provided")
    }

    return createServerClient<Database>(keys.url, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
      cookies: cookiesStrategy,
    })
  }

  return createServerClient<Database>(keys.url, keys.anonKey, {
    cookies: cookiesStrategy,
  })
}

export default getSupabaseServerComponentClient

async function getCookiesStrategy() {
  const cookieStore = await cookies()
  const storeAny = cookieStore as unknown as {
    getAll?: () => Array<{ name: string; value: string }>
    set?: (name: string, value: string, options?: unknown) => void
  }

  return {
    getAll() {
      return storeAny.getAll?.() ?? []
    },
    setAll(cookiesToSet: Array<{ name: string; value: string; options?: unknown }>) {
      cookiesToSet.forEach(({ name, value, options }) => {
        storeAny.set?.(name, value, options)
      })
    },
  }
}
