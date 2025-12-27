import { eq, count, ilike, or, and, type SQL, sql } from 'drizzle-orm'
import { db } from '../../connection/db'
import { packingItems, users, workstations } from '../../connection/db/schemas'
import type { PaginationQuery } from '../../types/request.types'
import { applyPagination } from '../../utils/pagination'
import type { PackingItemsRequest, PackingStatus } from './packing.types'

export interface PackingQueryModel {
  select?: {}
  id?: string
  barcode?: string
  operator_id?: string
  workstation_id?: string
  status?: PackingStatus
  pagination?: PaginationQuery
  search?: string
}

export class PackingRepository {
  async create(data: PackingItemsRequest) {
    const [result] = await db.insert(packingItems).values(data).returning()
    return result
  }

  async update(id: string, data: Partial<PackingItemsRequest>) {
    const [result] = await db
      .update(packingItems)
      .set(data)
      .where(eq(packingItems.id, id))
      .returning()
    return result
  }

  async get(query: PackingQueryModel) {
    const select = query.select || packingItems

    const [result] = await db
      .select(select)
      .from(packingItems)
      .leftJoin(users, eq(packingItems.operator_id, users.id))
      .leftJoin(workstations, eq(packingItems.workstation_id, workstations.id))
      .where(this.buildWhereConditions(query))
      .limit(1)
    return result
  }

  async getReadyForBatch(limit: number) {
    return db
      .select()
      .from(packingItems)
      .where(eq(packingItems.status, 'READY_FOR_BATCH'))
      .orderBy(packingItems.created_at)
      .limit(limit)
  }

  async gets(query: PackingQueryModel) {
    const [countResult] = await db
      .select({ count: count() })
      .from(packingItems)
      .leftJoin(users, eq(packingItems.operator_id, users.id))
      .leftJoin(workstations, eq(packingItems.workstation_id, workstations.id))
      .where(this.buildWhereConditions(query))

    let baseQuery = db
      .select(query.select || packingItems)
      .from(packingItems)
      .leftJoin(users, eq(packingItems.operator_id, users.id))
      .leftJoin(workstations, eq(packingItems.workstation_id, workstations.id))
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

  private buildWhereConditions(query: PackingQueryModel): SQL | undefined {
    const conditions: SQL[] = []

    if (query.id) {
      conditions.push(eq(packingItems.id, query.id))
    }

    if (query.barcode) {
      conditions.push(eq(packingItems.barcode, query.barcode))
    }

    if (query.operator_id) {
      conditions.push(eq(packingItems.operator_id, query.operator_id))
    }

    if (query.workstation_id) {
      conditions.push(eq(packingItems.workstation_id, query.workstation_id))
    }

    if (query.status) {
      conditions.push(eq(packingItems.status, query.status))
    }

    if (query.search) {
      conditions.push(
        or(
          ilike(packingItems.barcode, `%${query.search}%`),
          ilike(users.name, `%${query.search}%`),
          ilike(workstations.name, `%${query.search}%`)
        )!
      )
    }

    return conditions.length ? and(...conditions) : undefined
  }

  private getOrderByColumn(sortBy?: string, sortDir: string = 'desc') {
    const direction = sortDir.toLowerCase() === 'asc' ? 'asc' : 'desc'

    switch (sortBy) {
      case 'barcode':
        return direction === 'asc'
          ? sql`${packingItems.barcode} asc`
          : sql`${packingItems.barcode} desc`
      case 'created_at':
        return direction === 'asc'
          ? sql`${packingItems.created_at} asc`
          : sql`${packingItems.created_at} desc`
      case 'status':
        return direction === 'asc'
          ? sql`${packingItems.status} asc`
          : sql`${packingItems.status} desc`
      default:
        return direction === 'asc'
          ? sql`${packingItems.created_at} asc`
          : sql`${packingItems.created_at} desc`
    }
  }
}

export default new PackingRepository()
