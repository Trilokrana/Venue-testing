/**
 * Utility functions for parsing and formatting venue-related errors
 * into user-friendly messages.
 */

interface PostgrestError {
  code?: string
  message?: string
  details?: string
  hint?: string
}

/**
 * Checks if an error is a PostgREST error
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as PostgrestError).code === "string"
  )
}

/**
 * Extracts column name from PostgREST unique violation error
 */
function extractColumnFromUniqueViolation(error: PostgrestError): string | null {
  // PostgREST unique violations typically include the constraint name or column in details/hint
  const details = error.details || error.hint || error.message || ""

  // Try to extract column name from common patterns
  // Pattern: "Key (column_name)=(value) already exists"
  const keyMatch = details.match(/Key \(([^)]+)\)=/)
  if (keyMatch) {
    return keyMatch[1]
  }

  // Pattern: "duplicate key value violates unique constraint \"constraint_name\""
  // For slug, constraint might be "venues_slug_key"
  if (details.includes("slug") || error.message?.includes("slug")) {
    return "slug"
  }

  if (details.includes("name") || error.message?.includes("name")) {
    return "name"
  }

  return null
}

/**
 * Formats a user-friendly error message from a PostgREST unique violation
 */
function formatUniqueViolationMessage(column: string | null): string {
  if (column === "slug") {
    return "A venue with this URL slug already exists. Please choose a different slug."
  }

  if (column === "name") {
    return "A venue with this name already exists. Please choose a different name."
  }

  if (column) {
    return `A venue with this ${column.replace(/_/g, " ")} already exists. Please choose a different value.`
  }

  return "This value already exists. Please choose a different value."
}

/**
 * Formats Zod validation errors into a user-friendly message
 */
function formatZodError(error: unknown): string {
  if (typeof error === "object" && error !== null && "issues" in error) {
    const zodError = error as { issues: Array<{ path: (string | number)[]; message: string }> }
    const firstIssue = zodError.issues[0]

    if (firstIssue) {
      const field = firstIssue.path.join(".")
      return `${field ? `${field}: ` : ""}${firstIssue.message}`
    }
  }

  return "Validation failed. Please check your input and try again."
}

/**
 * Checks if an error is a Zod validation error
 */
function isZodError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown }).issues)
  )
}

/**
 * React Hook Form + Zod nest messages under `id`, `file`, `root`, etc.
 * (especially for unions). Returns the first non-empty `message` found.
 */
export function flattenRhfFieldErrorMessage(error: unknown): string {
  if (error === undefined || error === null) return ""
  if (typeof error === "string") return error.trim()
  if (typeof error !== "object") return ""

  const e = error as Record<string, unknown>
  if (typeof e.message === "string" && e.message.trim().length > 0) {
    return e.message.trim()
  }

  for (const key of Object.keys(e)) {
    if (key === "ref") continue
    const v = e[key]
    if (v && typeof v === "object") {
      const nested = flattenRhfFieldErrorMessage(v)
      if (nested) return nested
    }
  }

  return ""
}

/**
 * Parses various error types and returns a user-friendly error message
 */
export function parseVenueError(error: unknown): string {
  // Handle PostgREST errors
  if (isPostgrestError(error)) {
    // Unique constraint violation
    if (error.code === "23505") {
      const column = extractColumnFromUniqueViolation(error)
      return formatUniqueViolationMessage(column)
    }

    // Foreign key violation
    if (error.code === "23503") {
      return "This operation cannot be completed due to a data relationship conflict."
    }

    // Check constraint violation
    if (error.code === "23514") {
      return "This value does not meet the required constraints."
    }

    // Not null violation
    if (error.code === "23502") {
      return "A required field is missing. Please fill in all required fields."
    }

    // Use the error message if available
    if (error.message) {
      return error.message
    }

    return "A database error occurred. Please try again."
  }

  // Handle Zod validation errors
  if (isZodError(error)) {
    return formatZodError(error)
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return error.message
  }

  // Handle string errors
  if (typeof error === "string") {
    return error
  }

  // Fallback
  return "An unexpected error occurred. Please try again."
}

/**
 * Creates a new Error with a user-friendly message while preserving original error
 */
export function createVenueError(error: unknown): Error {
  const message = parseVenueError(error)
  const newError = new Error(message)

  // Preserve original error for debugging
  if (error instanceof Error) {
    ;(newError as any).originalError = error
  } else {
    ;(newError as any).originalError = error
  }

  return newError
}
