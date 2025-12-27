import { eq, count, ilike, or, and, type SQL, sql } from 'drizzle-orm'
import { db } from '../../connection/db'
import { users, roles } from '../../connection/db/schemas'
import type { PaginationQuery } from '../../types/request.types'
import { applyPagination } from '../../utils/pagination'
import type {
  CreateUserRequest,
  DeleteUserRequest,
  UpdateUserRequest,
} from './users.types'

export interface UserQueryModel {
  select?: {}
  id?: string
  name?: string
  email?: string
  role_id?: string
  pagination?: PaginationQuery
  search?: string
}

export class UserRepository {
  async create(data: CreateUserRequest) {
    const [result] = await db.insert(users).values(data).returning()
    return result
  }

  async update(id: string, data: Partial<UpdateUserRequest>) {
    const [result] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning()
    return result
  }

  async delete(data: DeleteUserRequest) {
    const [result] = await db
      .delete(users)
      .where(eq(users.id, data.id))
      .returning()
    return result
  }

  async get(query: UserQueryModel) {
    const select = query.select || users

    const [result] = await db
      .select(select)
      .from(users)
      .leftJoin(roles, eq(users.role_id, roles.id))
      .where(this.buildWhereConditions(query))
      .limit(1)

    return result
  }

  async gets(query: UserQueryModel) {
    const [countResult] = await db
      .select({ count: count() })
      .from(users)
      .leftJoin(roles, eq(users.role_id, roles.id))
      .where(this.buildWhereConditions(query))

    let baseQuery = db
      .select(query.select || users)
      .from(users)
      .leftJoin(roles, eq(users.role_id, roles.id))
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

  private buildWhereConditions(query: UserQueryModel): SQL | undefined {
    const conditions: SQL[] = []

    if (query.id) {
      conditions.push(eq(users.id, query.id))
    }

    if (query.name) {
      conditions.push(eq(users.name, query.name))
    }

    if (query.email) {
      conditions.push(eq(users.email, query.email))
    }

    if (query.role_id) {
      conditions.push(eq(users.role_id, query.role_id))
    }

    if (query.search) {
      conditions.push(
        or(
          ilike(users.name, `%${query.search}%`),
          ilike(users.email, `%${query.search}%`)
        )!
      )
    }

    return conditions.length ? and(...conditions) : undefined
  }

  private getOrderByColumn(sortBy?: string, sortDir: string = 'asc') {
    const direction = sortDir.toLowerCase() === 'asc' ? 'asc' : 'desc'

    switch (sortBy) {
      case 'email':
        return direction === 'asc'
          ? sql`${users.email} asc`
          : sql`${users.email} desc`
      case 'role_name':
        return direction === 'asc'
          ? sql`${roles.name} asc`
          : sql`${roles.name} desc`
      default:
        return direction === 'asc'
          ? sql`${users.name} asc`
          : sql`${users.name} desc`
    }
  }
}

export default new UserRepository()
