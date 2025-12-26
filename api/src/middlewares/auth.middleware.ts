import type { Context, Next } from 'hono'
import { verify } from 'hono/jwt'
import { config } from '../config'
import { createErrorResponse } from '../types/response.types'
import { logging } from '../logger'
import { AUTH_MESSAGES } from '../constants/messages'
import type { JwtPayload } from '../types/jwt.types'
import { db } from '../connection/db'
import { sessions } from '../connection/db/schemas'
import { eq } from 'drizzle-orm'

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.split(' ')[1]

    if (!token || typeof token !== 'string') {
      logging.error('[Auth Middleware] No access token provided')
      return c.json(
        createErrorResponse(AUTH_MESSAGES.UNAUTHORIZED_NO_TOKEN, 401),
        401
      )
    }

    try {
      const decoded = await verify(token, config.jwtSecret)
      const payload: JwtPayload = {
        id: decoded.id as number,
        role_id: decoded.role_id as number,
        session_id: decoded.session_id as number,
        type: decoded.type as 'access' | 'refresh',
      }

      if (payload.type !== 'access') {
        logging.error(
          '[Auth Middleware] Invalid token type - expected access token'
        )
        return c.json(
          createErrorResponse(AUTH_MESSAGES.UNAUTHORIZED_INVALID_TYPE, 401),
          401
        )
      }

      // Validate session is still active (not revoked)
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, payload.session_id))
        .limit(1)

      if (!session) {
        logging.error('[Auth Middleware] Session not found')
        return c.json(
          createErrorResponse(AUTH_MESSAGES.SESSION_EXPIRED, 401),
          401
        )
      }

      if (session.revoked_at !== null) {
        logging.error('[Auth Middleware] Session has been revoked')
        return c.json(
          createErrorResponse(AUTH_MESSAGES.SESSION_REVOKED, 401),
          401
        )
      }

      if (new Date() > session.expires_at) {
        logging.error('[Auth Middleware] Session has expired')
        return c.json(
          createErrorResponse(AUTH_MESSAGES.SESSION_EXPIRED, 401),
          401
        )
      }

      c.set('jwtPayload', payload)
      await next()
    } catch (error) {
      logging.error({ err: error }, '[Auth Middleware] Token verification failed')
      return c.json(
        createErrorResponse(AUTH_MESSAGES.UNAUTHORIZED_INVALID_TOKEN, 401),
        401
      )
    }
  } catch (error) {
    logging.error({ err: error }, '[Auth Middleware] Error in Auth Middleware')
    return c.json(
      createErrorResponse(AUTH_MESSAGES.UNAUTHORIZED_FAILED, 401),
      401
    )
  }
}
