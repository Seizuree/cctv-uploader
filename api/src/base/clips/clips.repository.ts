import { eq, count, ilike, or, and, type SQL, sql } from 'drizzle-orm'
import { db } from '../../connection/db'
import {
  miniClips,
  cameras,
  packingItems,
  type NewMiniClip,
} from '../../connection/db/schemas'
import type { PaginationQuery } from '../../types/request.types'
import { applyPagination } from '../../utils/pagination'

export interface ClipQueryModel {
  select?: {}
  id?: number
  packing_item_id?: number
  camera_id?: number
  pagination?: PaginationQuery
  search?: string
}

export class ClipRepository {
  async create(data: NewMiniClip) {
    const [result] = await db.insert(miniClips).values(data).returning()
    return result
  }

  async get(query: ClipQueryModel) {
    const select = query.select || miniClips

    const [result] = await db
      .select(select)
      .from(miniClips)
      .leftJoin(cameras, eq(miniClips.camera_id, cameras.id))
      .leftJoin(packingItems, eq(miniClips.packing_item_id, packingItems.id))
      .where(this.buildWhereConditions(query))
      .limit(1)
    return result
  }

  async gets(query: ClipQueryModel) {
    const [countResult] = await db
      .select({ count: count() })
      .from(miniClips)
      .leftJoin(cameras, eq(miniClips.camera_id, cameras.id))
      .leftJoin(packingItems, eq(miniClips.packing_item_id, packingItems.id))
      .where(this.buildWhereConditions(query))

    let baseQuery = db
      .select(query.select || miniClips)
      .from(miniClips)
      .leftJoin(cameras, eq(miniClips.camera_id, cameras.id))
      .leftJoin(packingItems, eq(miniClips.packing_item_id, packingItems.id))
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

  private buildWhereConditions(query: ClipQueryModel): SQL | undefined {
    const conditions: SQL[] = []

    if (query.id) {
      conditions.push(eq(miniClips.id, query.id))
    }

    if (query.packing_item_id) {
      conditions.push(eq(miniClips.packing_item_id, query.packing_item_id))
    }

    if (query.camera_id) {
      conditions.push(eq(miniClips.camera_id, query.camera_id))
    }

    if (query.search) {
      conditions.push(
        or(
          ilike(packingItems.barcode, `%${query.search}%`),
          ilike(cameras.name, `%${query.search}%`),
          ilike(miniClips.storage_path, `%${query.search}%`)
        )!
      )
    }

    return conditions.length ? and(...conditions) : undefined
  }

  private getOrderByColumn(sortBy?: string, sortDir: string = 'desc') {
    const direction = sortDir.toLowerCase() === 'asc' ? 'asc' : 'desc'

    switch (sortBy) {
      case 'generated_at':
        return direction === 'asc'
          ? sql`${miniClips.generated_at} asc`
          : sql`${miniClips.generated_at} desc`
      case 'barcode':
        return direction === 'asc'
          ? sql`${packingItems.barcode} asc`
          : sql`${packingItems.barcode} desc`
      default:
        return direction === 'asc'
          ? sql`${miniClips.generated_at} asc`
          : sql`${miniClips.generated_at} desc`
    }
  }
}

export default new ClipRepository()
