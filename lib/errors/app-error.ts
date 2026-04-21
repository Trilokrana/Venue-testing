export class AppError extends Error {
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
  ) {
    super(message)
    this.name = "AppError"
    this.statusCode = options?.statusCode ?? 500
    this.code = options?.code
    this.cause = options?.cause
  }
}
