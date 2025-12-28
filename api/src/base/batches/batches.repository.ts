import { eq, count, and, gte, lte, type SQL, sql } from 'drizzle-orm'
import { db } from '../../connection/db'
import {
  batchJobs,
  batchJobItems,
  packingItems,
} from '../../connection/db/schemas'
import type { PaginationQuery } from '../../types/request.types'
import { applyPagination } from '../../utils/pagination'
import type { BatchJobStatus } from './batches.types'

export interface BatchQueryModel {
  id?: string
  status?: BatchJobStatus
  pagination?: PaginationQuery
  startDate?: string
  endDate?: string
}

export class BatchRepository {
  // Get single batch dengan items (2 query internal)
  async get(query: BatchQueryModel) {
    // Query 1: Get batch
    const [batch] = await db
      .select({
        id: batchJobs.id,
        status: batchJobs.status,
        started_at: batchJobs.started_at,
        finished_at: batchJobs.finished_at,
        total_items: batchJobs.total_items,
        success_items: batchJobs.success_items,
        failed_items: batchJobs.failed_items,
        error_message: batchJobs.error_message,
      })
      .from(batchJobs)
      .where(this.buildWhereConditions(query))
      .limit(1)

    if (!batch) return null

    // Query 2: Get items dengan barcode
    const items = await db
      .select({
        id: batchJobItems.id,
        status: batchJobItems.status,
        error_message: batchJobItems.error_message,
        started_at: batchJobItems.started_at,
        finished_at: batchJobItems.finished_at,
        barcode: packingItems.barcode,
      })
      .from(batchJobItems)
      .leftJoin(packingItems, eq(batchJobItems.packing_item_id, packingItems.id))
      .where(eq(batchJobItems.batch_job_id, query.id!))

    return { ...batch, items }
  }

  // Get list batches (tanpa items)
  async gets(query: BatchQueryModel) {
    const [countResult] = await db
      .select({ count: count() })
      .from(batchJobs)
      .where(this.buildWhereConditions(query))

    let baseQuery = db
      .select({
        id: batchJobs.id,
        status: batchJobs.status,
        started_at: batchJobs.started_at,
        finished_at: batchJobs.finished_at,
        total_items: batchJobs.total_items,
        success_items: batchJobs.success_items,
        failed_items: batchJobs.failed_items,
      })
      .from(batchJobs)
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

  private buildWhereConditions(query: BatchQueryModel): SQL | undefined {
    const conditions: SQL[] = []

    if (query.id) {
      conditions.push(eq(batchJobs.id, query.id))
    }

    if (query.status) {
      conditions.push(eq(batchJobs.status, query.status))
    }

    if (query.startDate) {
      conditions.push(gte(batchJobs.started_at, new Date(query.startDate)))
    }

    if (query.endDate) {
      conditions.push(lte(batchJobs.started_at, new Date(query.endDate)))
    }

    return conditions.length ? and(...conditions) : undefined
  }

  private getOrderByColumn(sortBy?: string, sortDir: string = 'desc') {
    const direction = sortDir.toLowerCase() === 'asc' ? 'asc' : 'desc'

    switch (sortBy) {
      case 'started_at':
        return direction === 'asc'
          ? sql`${batchJobs.started_at} asc`
          : sql`${batchJobs.started_at} desc`
      case 'status':
        return direction === 'asc'
          ? sql`${batchJobs.status} asc`
          : sql`${batchJobs.status} desc`
      case 'total_items':
        return direction === 'asc'
          ? sql`${batchJobs.total_items} asc`
          : sql`${batchJobs.total_items} desc`
      case 'success_items':
        return direction === 'asc'
          ? sql`${batchJobs.success_items} asc`
          : sql`${batchJobs.success_items} desc`
      case 'failed_items':
        return direction === 'asc'
          ? sql`${batchJobs.failed_items} asc`
          : sql`${batchJobs.failed_items} desc`
      default:
        return direction === 'asc'
          ? sql`${batchJobs.started_at} asc`
          : sql`${batchJobs.started_at} desc`
    }
  }
}

export default new BatchRepository()
