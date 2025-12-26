import { sql, type SQL } from 'drizzle-orm'
import type { PaginationQuery } from '../types/request.types'

export const calculateOffset = (
  page: number = 1,
  pageSize: number = 10
): number => {
  return (page - 1) * pageSize
}

export function applyPagination<T>(
  query: T,
  pagination: PaginationQuery,
  orderByCustom?: SQL<unknown>
): T {
  const page = pagination.page || 1
  let pageSize = pagination.limit || 10

  if (pageSize > 100) pageSize = 100
  if (pageSize <= 0) pageSize = 10

  const offset = (page - 1) * pageSize

  let paginatedQuery = query as Record<string, unknown>
  paginatedQuery = (paginatedQuery as { offset: (n: number) => unknown }).offset(
    offset
  ) as Record<string, unknown>
  paginatedQuery = (paginatedQuery as { limit: (n: number) => unknown }).limit(
    pageSize
  ) as Record<string, unknown>

  const sortField = pagination.sortBy
  const sortDirection = pagination.sortDir || 'asc'

  if (sortField) {
    let orderByClause = sql`${sql.identifier(sortField)} ${sql.raw(sortDirection)}`
    if (orderByCustom) {
      orderByClause = orderByCustom
    }

    paginatedQuery = (
      paginatedQuery as { orderBy: (clause: SQL<unknown>) => unknown }
    ).orderBy(orderByClause) as Record<string, unknown>
  }

  return paginatedQuery as T
}

export function normalizePaginationQuery(
  query: Record<string, string | undefined>
): PaginationQuery {
  const page = parseInt(query.page || '1') || 1
  let limit = parseInt(query.limit || '10') || 10

  if (limit > 100) limit = 100
  if (limit <= 0) limit = 10

  let direction: 'asc' | 'desc' = 'asc'
  if (query.sortDir) {
    direction = query.sortDir === 'desc' ? 'desc' : 'asc'
  }

  return {
    page,
    limit,
    sortBy: query.sortBy,
    sortDir: direction,
    search: query.search,
  }
}
