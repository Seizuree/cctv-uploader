import { eq, count, ilike, or, and, type SQL } from 'drizzle-orm'
import { db } from '../../connection/db'
import { roles, type Role, type NewRole } from '../../connection/db/schemas'
import type { PaginationQuery } from '../../types/request.types'
import { applyPagination } from '../../utils/pagination'

export interface RoleQueryModel {
  select?: {}
  id?: number
  name?: string
  pagination?: PaginationQuery
  search?: string
}

export class RoleRepository {
  async create(data: NewRole) {
    const [result] = await db.insert(roles).values(data).returning()
    return result
  }

  async update(id: number, data: Partial<NewRole>) {
    const [result] = await db
      .update(roles)
      .set({ ...data, updated_at: new Date() })
      .where(eq(roles.id, id))
      .returning()
    return result
  }

  async delete(id: number) {
    const [result] = await db
      .delete(roles)
      .where(eq(roles.id, id))
      .returning()
    return result
  }

  async get(query: RoleQueryModel) {
    const select = query.select || roles

    const [result] = await db
      .select(select)
      .from(roles)
      .where(this.buildWhereConditions(query))
      .limit(1)
    return result
  }

  async gets(query: RoleQueryModel) {
    const [countResult] = await db
      .select({ count: count() })
      .from(roles)
      .where(this.buildWhereConditions(query))

    let baseQuery = db
      .select(query.select || roles)
      .from(roles)
      .where(this.buildWhereConditions(query))
      .$dynamic()

    if (query.pagination) {
      baseQuery = applyPagination(baseQuery, query.pagination)
    }

    const data = await baseQuery

    return {
      data,
      count: Number(countResult?.count || 0),
    }
  }

  private buildWhereConditions(query: RoleQueryModel): SQL | undefined {
    const conditions: SQL[] = []

    if (query.id) {
      conditions.push(eq(roles.id, query.id))
    }

    if (query.name) {
      conditions.push(eq(roles.name, query.name))
    }

    if (query.search) {
      conditions.push(
        or(
          ilike(roles.name, `%${query.search}%`),
          ilike(roles.description, `%${query.search}%`)
        )!
      )
    }

    return conditions.length ? and(...conditions) : undefined
  }
}

export default new RoleRepository()
