import type { Context } from 'hono'
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../types/response.types'
import authService from './auth.service'
import { logging } from '../../logger'
import { LoginSchema, LogoutSchema, RefreshSchema } from './auth.types'
import type { JwtPayload } from '../../types/jwt.types'
import { verifyToken } from '../../utils/jwt'
import { AUTH_MESSAGES } from '../../constants/messages'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { decode } from 'jsonwebtoken'

export class AuthController {
  async login(c: Context) {
    try {
      const body = await c.req.json()
      const validationResult = LoginSchema.safeParse(body)

      if (!validationResult.success) {
        return c.json(createErrorResponse('Invalid input data', 400), 400)
      }

      const authResponse = await authService.login(validationResult.data)

      if (!authResponse.data) {
        return c.json(
          createErrorResponse(
            authResponse.response.message,
            authResponse.response.statusCode
          ),
          authResponse.response.statusCode
        )
      }

      return c.json(
        createSuccessResponse(
          authResponse.data.accessToken,
          authResponse.response.message,
          authResponse.response.statusCode
        ),
        authResponse.response.statusCode
      )
    } catch (error) {
      logging.error(`[Auth Controller] Login error: ${error}`)
      return c.json(createErrorResponse('An error occurred during login'), 500)
    }
  }

  async logout(c: Context) {
    try {
      // Validate request body
      const result = await LogoutSchema.safeParseAsync(await c.req.json())

      if (!result.success) {
        return c.json(
          createErrorResponse('Invalid input - email is required', 400),
          400
        )
      }

      // Use auth service to handle logout logic
      await authService.logout(result.data)

      // Clear access token cookie regardless of service response
      setCookie(c, 'adhi-karya-session', '', {
        httpOnly: false,
        path: '/',
        sameSite: 'Lax',
        secure: true,
        maxAge: 0,
      })

      // Clear refresh token cookie
      deleteCookie(c, 'adhi-karya-ref', {
        path: '/',
        secure: true,
        sameSite: 'Lax',
      })

      // Return success even if user not found (for security reasons)
      return c.json(createSuccessResponse(null, 'Logout successful'), 200)
    } catch (error) {
      logging.error(`[Auth Controller] Logout error: ${error}`)
      return c.json(createErrorResponse('An error occurred during logout'), 500)
    }
  }

  async refresh(c: Context) {
    try {
      // Extract token from cookie first, fallback to Authorization header
      let token = getCookie(c, 'adhi-karya-session')

      if (!token) {
        const authHeader = c.req.header('Authorization')
        token = authHeader?.split(' ')[1]
      }

      if (typeof token !== 'string') {
        return c.json(createErrorResponse('No access token provided', 401), 401)
      }

      let jwtPayload: JwtPayload
      try {
        const decoded = decode(token) as JwtPayload | null

        if (!decoded) {
          return c.json(createErrorResponse('Invalid token format', 401), 401)
        }

        jwtPayload = decoded
      } catch (error: any) {
        logging.error('[Auth Controller] Token decode failed:', error)
        return c.json(createErrorResponse('Invalid token format', 401), 401)
      }

      // Only accept access tokens for refresh
      if (jwtPayload.type !== 'access') {
        return c.json(
          createErrorResponse(
            'Invalid token type - expected access token',
            401
          ),
          401
        )
      }

      if (!jwtPayload.session_id) {
        return c.json(createErrorResponse('No valid session found', 401), 401)
      }

      // Get refresh token from HTTP-only cookie
      const refreshToken = getCookie(c, 'adhi-karya-ref')

      if (!refreshToken) {
        return c.json(createErrorResponse('No refresh token found', 401), 401)
      }

      // Use session_id and refresh token to validate and get new token pair
      const authResponse = await authService.refresh(
        jwtPayload.session_id,
        refreshToken
      )

      if (!authResponse.data) {
        // Clear both cookies on error
        setCookie(c, 'adhi-karya-session', '', {
          httpOnly: false,
          path: '/',
          sameSite: 'Lax',
          secure: true,
          maxAge: 0,
        })

        setCookie(c, 'adhi-karya-ref', '', {
          path: '/',
          secure: true,
          sameSite: 'Lax',
        })

        return c.json(
          createErrorResponse(authResponse.message, authResponse.statusCode),
          authResponse.statusCode
        )
      }

      // Set new access token cookie
      setCookie(c, 'adhi-karya-session', authResponse.data.accessToken, {
        path: '/',
        secure: true,
        httpOnly: false,
        sameSite: 'Lax',
      })

      // If refresh token was rotated, update the cookie
      if (authResponse.data.newRefreshToken) {
        setCookie(c, 'adhi-karya-ref', authResponse.data.newRefreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'Lax',
          path: '/',
          maxAge: 60 * 60 * 24, // 24 hours
        })
      }

      return c.json(
        createSuccessResponse(
          { accessToken: authResponse.data.accessToken },
          authResponse.message,
          authResponse.statusCode
        )
      )
    } catch (error) {
      logging.error(`[Auth Controller] Token refresh error: ${error}`)
      return c.json(
        createErrorResponse('An error occurred during token refresh'),
        500
      )
    }
  }
}

export default new AuthController()
