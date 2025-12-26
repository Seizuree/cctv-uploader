import { eq, count, ilike, or, and, type SQL, sql } from 'drizzle-orm'
import { db } from '../../connection/db'
import { cameras } from '../../connection/db/schemas'
import type { PaginationQuery } from '../../types/request.types'
import { applyPagination } from '../../utils/pagination'
import type { CreateCameraRequest, UpdateCameraRequest, DeleteCameraRequest } from './cameras.types'

export interface CameraQueryModel {
  select?: {}
  id?: string
  name?: string
  base_url?: string
  pagination?: PaginationQuery
  search?: string
}

export class CameraRepository {
  async create(data: CreateCameraRequest) {
    const [result] = await db.insert(cameras).values(data).returning()
    return result
  }

  async update(id: string, data: Partial<UpdateCameraRequest>) {
    const [result] = await db
      .update(cameras)
      .set(data)
      .where(eq(cameras.id, id))
      .returning()
    return result
  }

  async delete(data: DeleteCameraRequest) {
    const [result] = await db
      .delete(cameras)
      .where(eq(cameras.id, data.id))
      .returning()
    return result
  }

  async get(query: CameraQueryModel) {
    const select = query.select || cameras

    const [result] = await db
      .select(select)
      .from(cameras)
      .where(this.buildWhereConditions(query))
      .limit(1)
    return result
  }

  async gets(query: CameraQueryModel) {
    const [countResult] = await db
      .select({ count: count() })
      .from(cameras)
      .where(this.buildWhereConditions(query))

    let baseQuery = db
      .select(query.select || cameras)
      .from(cameras)
      .where(this.buildWhereConditions(query))
      .$dynamic()

    if (query.pagination) {
      baseQuery = applyPagination(
        baseQuery,
        query.pagination,
        this.getOrderByColumn(query.pagination.sortBy, query.pagination.sortDir)
      )
    }

    const data = await baseQuery

    return {
      data,
      count: Number(countResult?.count || 0),
    }
  }

  private buildWhereConditions(query: CameraQueryModel): SQL | undefined {
    const conditions: SQL[] = []

    if (query.id) {
      conditions.push(eq(cameras.id, query.id))
    }

    if (query.name) {
      conditions.push(eq(cameras.name, query.name))
    }

    if (query.base_url) {
      conditions.push(eq(cameras.base_url, query.base_url))
    }

    if (query.search) {
      conditions.push(
        or(
          ilike(cameras.name, `%${query.search}%`),
          ilike(cameras.base_url, `%${query.search}%`)
        )!
      )
    }

    return conditions.length ? and(...conditions) : undefined
  }

  private getOrderByColumn(sortBy?: string, sortDir: string = 'asc') {
    const direction = sortDir.toLowerCase() === 'asc' ? 'asc' : 'desc'

    switch (sortBy) {
      case 'name':
        return direction === 'asc'
          ? sql`${cameras.name} asc`
          : sql`${cameras.name} desc`
      case 'base_url':
        return direction === 'asc'
          ? sql`${cameras.base_url} asc`
          : sql`${cameras.base_url} desc`
      default:
        return direction === 'asc'
          ? sql`${cameras.name} asc`
          : sql`${cameras.name} desc`
    }
  }
}

export default new CameraRepository()
