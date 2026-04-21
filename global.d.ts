export {}

declare global {
  class AppError extends Error {
    statusCode: number
    code?: string
    cause?: unknown

    constructor(
      message: string,
      options?: {
        statusCode?: number
        code?: string
        cause?: unknown
      }
    )
  }
}
