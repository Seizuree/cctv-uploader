import type { Context, Next } from 'hono'
import { createErrorResponse } from '../types/response.types'
import { logging } from '../logger'
import { COMMON_MESSAGES } from '../constants/messages'
import type { JwtPayload } from '../types/jwt.types'
import { roles } from '../connection/db/schemas'
import { ROLE_NAMES } from '../constants/roles'
import rolesRepository from '../base/roles/roles.repository'

export const requireSuperadmin = async (c: Context, next: Next) => {
  try {
    const jwtPayload = c.get('jwtPayload') as JwtPayload

    if (!jwtPayload) {
      logging.error('[Role Middleware] No JWT payload found')
      return c.json(createErrorResponse(COMMON_MESSAGES.UNAUTHORIZED, 401), 401)
    }

    const role = (await rolesRepository.get({
      id: jwtPayload.role_id,
      select: {
        name: roles.name,
      },
    })) as { name: string }

    if (!role) {
      logging.error('[Role Middleware] Role not found')
      return c.json(createErrorResponse(COMMON_MESSAGES.FORBIDDEN, 403), 403)
    }

    if (role.name !== ROLE_NAMES.SUPERADMIN) {
      logging.error('[Role Middleware] User is not SUPERADMIN')
      return c.json(createErrorResponse(COMMON_MESSAGES.FORBIDDEN, 403), 403)
    }

    await next()
  } catch (error) {
    logging.error({ err: error }, '[Role Middleware] Error')
    return c.json(createErrorResponse(COMMON_MESSAGES.FORBIDDEN, 403), 403)
  }
}

export const requireOperator = async (c: Context, next: Next) => {
  try {
    const jwtPayload = c.get('jwtPayload') as JwtPayload

    if (!jwtPayload) {
      logging.error('[Role Middleware] No JWT payload found')
      return c.json(createErrorResponse(COMMON_MESSAGES.UNAUTHORIZED, 401), 401)
    }

    const role = (await rolesRepository.get({
      id: jwtPayload.role_id,
      select: {
        name: roles.name,
      },
    })) as { name: string }

    if (!role) {
      logging.error('[Role Middleware] Role not found')
      return c.json(createErrorResponse(COMMON_MESSAGES.FORBIDDEN, 403), 403)
    }

    if (
      role.name !== ROLE_NAMES.OPERATOR &&
      role.name !== ROLE_NAMES.SUPERADMIN
    ) {
      logging.error('[Role Middleware] User is not OPERATOR or SUPERADMIN')
      return c.json(createErrorResponse(COMMON_MESSAGES.FORBIDDEN, 403), 403)
    }

    await next()
  } catch (error) {
    logging.error({ err: error }, '[Role Middleware] Error')
    return c.json(createErrorResponse(COMMON_MESSAGES.FORBIDDEN, 403), 403)
  }
}
