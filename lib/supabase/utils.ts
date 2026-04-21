import { AppError } from "@/lib/errors/app-error"
import { PostgrestError } from "@supabase/supabase-js"

export function mapSupabaseError(error: PostgrestError, fallbackMessage: string) {
  return new AppError(error.message || fallbackMessage, {
    statusCode: 500,
    code: error.code,
    cause: error,
  })
}

// base
export type ActionResult<T> =
  | { success: true; data: T; statusCode: number }
  | { success: false; error: string; statusCode: number }

export interface Meta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// reusable pagination
export type Paginated<T> = {
  items: T[]
  meta: Meta
}

// combo
export type PaginatedResult<T> = ActionResult<Paginated<T>>
