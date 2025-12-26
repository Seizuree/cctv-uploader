import { eq, count, and, type SQL, sql } from 'drizzle-orm'
import { db } from '../../connection/db'
import {
  batchJobs,
  batchJobItems,
  packingItems,
  type BatchJob,
  type NewBatchJob,
  type BatchJobItem,
  type NewBatchJobItem,
  type BatchJobStatus,
  type BatchItemStatus,
} from '../../connection/db/schemas'
import type { PaginationQuery } from '../../types/request.types'
import { applyPagination } from '../../utils/pagination'

export interface BatchQueryModel {
  select?: {}
  id?: number
  status?: BatchJobStatus
  pagination?: PaginationQuery
}

export class BatchRepository {
  async createJob(data: NewBatchJob) {
    const [result] = await db.insert(batchJobs).values(data).returning()
    return result
  }

  async createJobItem(data: NewBatchJobItem) {
    const [result] = await db.insert(batchJobItems).values(data).returning()
    return result
  }

  async updateJobStatus(
    id: number,
    status: BatchJobStatus,
    stats?: { success_items?: number; failed_items?: number; error_message?: string }
  ) {
    const updateData: Partial<BatchJob> = {
      status,
      ...(status !== 'RUNNING' && { finished_at: new Date() }),
      ...stats,
    }

    const [result] = await db
      .update(batchJobs)
      .set(updateData)
      .where(eq(batchJobs.id, id))
      .returning()
    return result
  }

  async updateItemStatus(
    id: number,
    status: BatchItemStatus,
    errorMessage?: string
  ) {
    const updateData: Partial<BatchJobItem> = {
      status,
      ...(status === 'PROCESSING' && { started_at: new Date() }),
      ...(status === 'SUCCESS' || status === 'FAILED'
        ? { finished_at: new Date() }
        : {}),
      ...(errorMessage && { error_message: errorMessage }),
    }

    const [result] = await db
      .update(batchJobItems)
      .set(updateData)
      .where(eq(batchJobItems.id, id))
      .returning()
    return result
  }

  async get(query: BatchQueryModel) {
    const select = query.select || batchJobs

    const [result] = await db
      .select(select)
      .from(batchJobs)
      .where(this.buildWhereConditions(query))
      .limit(1)
    return result
  }

  async getWithItems(id: number) {
    const [job] = await db
      .select()
      .from(batchJobs)
      .where(eq(batchJobs.id, id))
      .limit(1)

    if (!job) return null

    const items = await db
      .select()
      .from(batchJobItems)
      .leftJoin(packingItems, eq(batchJobItems.packing_item_id, packingItems.id))
      .where(eq(batchJobItems.batch_job_id, id))

    return { job, items }
  }

  async getRunningJob() {
    const [result] = await db
      .select()
      .from(batchJobs)
      .where(eq(batchJobs.status, 'RUNNING'))
      .limit(1)
    return result
  }

  async gets(query: BatchQueryModel) {
    const [countResult] = await db
      .select({ count: count() })
      .from(batchJobs)
      .where(this.buildWhereConditions(query))

    let baseQuery = db
      .select(query.select || batchJobs)
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
      default:
        return direction === 'asc'
          ? sql`${batchJobs.started_at} asc`
          : sql`${batchJobs.started_at} desc`
    }
  }
}

export default new BatchRepository()
