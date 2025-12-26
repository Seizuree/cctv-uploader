import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../../connection/db'
import { sessions } from '../../connection/db/schemas'
import type { SessionRequest } from './sessions.types'

export interface SessionQueryModel {
  select?: {}
  id?: string
  user_id?: string
  session_token?: string
  active_only?: boolean
}

export class SessionRepository {
  async create(data: SessionRequest) {
    const [result] = await db.insert(sessions).values(data).returning()
    return result
  }

  async get(query: SessionQueryModel) {
    const select = query.select || sessions

    const [result] = await db
      .select(select)
      .from(sessions)
      .where(this.buildWhereConditions(query))
      .limit(1)
    return result
  }

  async update(id: string, data: Partial<SessionRequest>) {
    const [result] = await db
      .update(sessions)
      .set(data)
      .where(eq(sessions.id, id))
      .returning()
    return result
  }

  async delete(query: SessionQueryModel) {
    const [result] = await db
      .delete(sessions)
      .where(this.buildWhereConditions(query))
      .returning()
    return result
  }

  private buildWhereConditions(query: SessionQueryModel) {
    const conditions = []

    if (query.id) {
      conditions.push(eq(sessions.id, query.id))
    }

    if (query.user_id) {
      conditions.push(eq(sessions.user_id, query.user_id))
    }

    if (query.session_token) {
      conditions.push(eq(sessions.session_token, query.session_token))
    }

    return conditions.length ? and(...conditions) : undefined
  }
}

export default new SessionRepository()
