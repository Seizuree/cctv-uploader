import type { PaginationQuery } from './request.types'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export interface ApiResponse<T = any> {
  statusCode: ContentfulStatusCode
  message: string
  data?: T
}

export interface Meta {
  current_page: number
  has_next: boolean
  has_prev: boolean
  next_page: number
  per_page: number
  prev_page: number
  total_items: number
  total_pages: number
}

export interface PaginationResult<T = any> {
  data: T[]
  meta: Meta
}

export interface PaginationApiResponse<T = any> extends ApiResponse {
  data: PaginationResult<T>
}

export const createSuccessResponse = <T>(
  data: T,
  message: string = 'Success',
  statusCode: ContentfulStatusCode = 200
): ApiResponse<T> => ({
  statusCode,
  message,
  data,
})

export const createErrorResponse = (
  message: string = 'An error occurred',
  statusCode: ContentfulStatusCode = 500
): ApiResponse => ({
  statusCode,
  message,
})

export function createPaginationResponse<T>(
  data: T[],
  totalCount: number,
  pagination: PaginationQuery,
  message: string,
  statusCode: ContentfulStatusCode
): PaginationApiResponse<T> {
  const current_page = pagination.page || 1
  const per_page = pagination.limit || 10
  const total_pages = Math.ceil(totalCount / per_page)
  const has_next = current_page < total_pages
  const has_prev = current_page > 1
  const next_page = has_next ? current_page + 1 : 0
  const prev_page = has_prev ? current_page - 1 : 0

  return {
    message,
    statusCode,
    data: {
      data,
      meta: {
        current_page,
        has_next,
        has_prev,
        next_page,
        per_page,
        prev_page,
        total_pages,
        total_items: totalCount,
      },
    },
  }
}
