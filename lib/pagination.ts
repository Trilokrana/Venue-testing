export type PaginationParams = {
  page?: number
  pageSize?: number
}

export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

export function normalizePagination(pagination?: PaginationParams) {
  const page = Math.max(1, pagination?.page ?? DEFAULT_PAGE)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, pagination?.pageSize ?? DEFAULT_PAGE_SIZE))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  return { page, pageSize, from, to }
}
