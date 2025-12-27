import type { Context, Next } from 'hono'
import { verifyToken } from '../utils/jwt'
import { createErrorResponse } from '../types/response.types'
import { logging } from '../logger'
import { AUTH_MESSAGES } from '../constants/messages'
import type { JwtPayload } from '../types/jwt.types'
import { sessions } from '../connection/db/schemas'
import sessionsRepository from '../base/sessions/sessions.repository'

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
      const payload = verifyToken(token)

      if (payload.type !== 'access') {
        logging.error(
          '[Auth Middleware] Invalid token type - expected access token'
        )
        return c.json(
          createErrorResponse(AUTH_MESSAGES.UNAUTHORIZED_INVALID_TYPE, 401),
          401
        )
      }

      const session = (await sessionsRepository.get({
        id: payload.session_id,
        select: {
          expires_at: sessions.expires_at,
        },
      })) as { expires_at: Date }

      if (!session) {
        logging.error('[Auth Middleware] Session not found')
        return c.json(
          createErrorResponse(AUTH_MESSAGES.SESSION_EXPIRED, 401),
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
      logging.error(`[Auth Middleware] Token verification failed: ${error}`)
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
