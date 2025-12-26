import { eq, count, ilike, or, and, type SQL, sql } from 'drizzle-orm'
import { db } from '../../connection/db'
import { workstations, cameras } from '../../connection/db/schemas'
import type { PaginationQuery } from '../../types/request.types'
import { applyPagination } from '../../utils/pagination'
import type {
  CreateWorkstationRequest,
  UpdateWorkstationRequest,
  DeleteWorkstationRequest,
} from './workstations.types'

export interface WorkstationQueryModel {
  select?: {}
  id?: string
  name?: string
  camera_id?: string
  pagination?: PaginationQuery
  search?: string
}

export class WorkstationRepository {
  async create(data: CreateWorkstationRequest) {
    const [result] = await db.insert(workstations).values(data).returning()
    return result
  }

  async update(id: string, data: Partial<UpdateWorkstationRequest>) {
    const [result] = await db
      .update(workstations)
      .set(data)
      .where(eq(workstations.id, id))
      .returning()
    return result
  }

  async delete(data: DeleteWorkstationRequest) {
    const [result] = await db
      .delete(workstations)
      .where(eq(workstations.id, data.id))
      .returning()
    return result
  }

  async get(query: WorkstationQueryModel) {
    const select = query.select || workstations

    const [result] = await db
      .select(select)
      .from(workstations)
      .leftJoin(cameras, eq(workstations.camera_id, cameras.id))
      .where(this.buildWhereConditions(query))
      .limit(1)
    return result
  }

  async gets(query: WorkstationQueryModel) {
    const [countResult] = await db
      .select({ count: count() })
      .from(workstations)
      .leftJoin(cameras, eq(workstations.camera_id, cameras.id))
      .where(this.buildWhereConditions(query))

    let baseQuery = db
      .select(query.select || workstations)
      .from(workstations)
      .leftJoin(cameras, eq(workstations.camera_id, cameras.id))
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

  private buildWhereConditions(query: WorkstationQueryModel): SQL | undefined {
    const conditions: SQL[] = []

    if (query.id) {
      conditions.push(eq(workstations.id, query.id))
    }

    if (query.name) {
      conditions.push(eq(workstations.name, query.name))
    }

    if (query.camera_id) {
      conditions.push(eq(workstations.camera_id, query.camera_id))
    }

    if (query.search) {
      conditions.push(
        or(
          ilike(workstations.name, `%${query.search}%`),
          ilike(cameras.name, `%${query.search}%`)
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
          ? sql`${workstations.name} asc`
          : sql`${workstations.name} desc`
      case 'camera_name':
        return direction === 'asc'
          ? sql`${cameras.name} asc`
          : sql`${cameras.name} desc`
      default:
        return direction === 'asc'
          ? sql`${workstations.name} asc`
          : sql`${workstations.name} desc`
    }
  }
}

export default new WorkstationRepository()
