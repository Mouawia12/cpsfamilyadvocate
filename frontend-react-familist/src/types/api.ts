/** Unified API envelope returned by every Familist endpoint. */
export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  errors?: Record<string, string[]>
  meta?: PaginationMeta
}

export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface Paginated<T> {
  items: T[]
  meta: PaginationMeta
}
