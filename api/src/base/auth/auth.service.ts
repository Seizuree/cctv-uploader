import { comparePassword, hashPassword } from '../../utils/hash'
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt'
import { logging } from '../../logger'
import { config } from '../../config'
import { AUTH_MESSAGES } from '../../constants/messages'
import type { ApiResponse } from '../../types/response.types'
import type { AuthResponse, LoginRequest, LogoutRequest } from './auth.types'
import { createHash, randomBytes } from 'crypto'
import { UserRepository } from '../users'
import { roles, sessions, users } from '../../connection/db/schemas'
import { SessionRepository } from '../sessions'
import { addHours, getCurrentTime } from '../../utils/formatDate'

export class AuthService {
  private userRepository: UserRepository
  private sessionRepository: SessionRepository

  constructor() {
    this.userRepository = new UserRepository()
    this.sessionRepository = new SessionRepository()
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const user = (await this.userRepository.get({
      email: credentials.email,
      select: {
        id: users.id,
        name: users.name,
        role_id: users.role_id,
        role_name: roles.name,
        password: users.password,
      },
    })) as {
      id: string
      name: string
      role_id: string
      role_name: string
      password: string
    }

    if (!user) {
      logging.error(`[Auth Service] User not found: ${credentials.email}`)
      return {
        response: {
          statusCode: 401,
          message: AUTH_MESSAGES.LOGIN_FAILED,
        },
      }
    }

    const isPasswordValid = await comparePassword(
      credentials.password,
      user.password
    )

    if (!isPasswordValid) {
      logging.error(
        `[Auth Service] Invalid password for user: ${credentials.email}`
      )
      return {
        response: {
          statusCode: 401,
          message: AUTH_MESSAGES.LOGIN_FAILED,
        },
      }
    }

    // Delete all existing sessions for this user (single session enforcement)
    await this.sessionRepository.delete({
      user_id: user.id,
    })

    // Create session token
    const sessionToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + config.refreshTokenExpiresIn * 1000)

    const session = (await this.sessionRepository.create({
      user_id: user.id,
      session_token: sessionToken,
      expires_at: expiresAt,
    })) as { id: string }

    const tokenPayload = {
      id: user.id,
      role_id: user.role_id,
      session_id: session.id,
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    logging.info(`[Auth Service] User logged in: ${credentials.email}`)

    return {
      data: {
        user: {
          name: user.name,
          role_id: user.role_id,
        },
        accessToken,
        refreshToken,
      },
      response: {
        statusCode: 200,
        message: AUTH_MESSAGES.LOGIN_SUCCESS,
      },
    }
  }

  async logout(credentials: LogoutRequest): Promise<ApiResponse> {
    try {
      const { email } = credentials

      // Find user by email
      const user = (await this.userRepository.get({
        email,
        select: { id: users.id },
      })) as { id: string }

      if (!user) {
        logging.warn(`[Auth Service] User not found for logout: ${email}`)
        return {
          message: AUTH_MESSAGES.USER_NOT_FOUND,
          statusCode: 404,
        }
      }

      // Delete all sessions for this user
      await this.sessionRepository.delete({
        user_id: user.id,
      })

      logging.info(`[Auth Service] Successfully logged out user: ${email}`)

      return {
        message: AUTH_MESSAGES.LOGOUT_SUCCESS,
        statusCode: 200,
      }
    } catch (error: any) {
      logging.error('[Auth Service] Error during logout:', error)
      return {
        message: AUTH_MESSAGES.LOGIN_ERROR,
        statusCode: 500,
      }
    }
  }

  /**
   * Refresh access token using session ID and refresh token validation
   */
  async refresh(sessionId: string, refreshToken: string): Promise<ApiResponse> {
    try {
      // Get session from database
      const session = (await this.sessionRepository.get({
        id: sessionId,
        select: {
          id: sessions.id,
          user_id: sessions.user_id,
          session_token: sessions.session_token,
          expires_at: sessions.expires_at,
        },
      })) as {
        id: string
        user_id: string
        session_token: string
        expires_at: Date
      }

      if (!session) {
        return {
          message: AUTH_MESSAGES.SESSION_EXPIRED,
          statusCode: 401,
        }
      }

      // Validate refresh token hash
      const isValidToken = await comparePassword(
        refreshToken,
        session.session_token
      )

      if (!isValidToken) {
        // Invalid refresh token - delete session
        logging.warn(
          `[Auth Service] Invalid refresh token detected for session ${sessionId}`
        )
        await this.sessionRepository.delete({ id: session.id })
        return {
          message: 'Invalid refresh token',
          statusCode: 401,
        }
      }

      // Check if session has expired
      if (session.expires_at < getCurrentTime()) {
        await this.sessionRepository.delete({ id: session.id })
        return {
          message: AUTH_MESSAGES.SESSION_EXPIRED,
          statusCode: 401,
        }
      }

      // Get user details
      const user = (await this.userRepository.get({
        id: session.user_id,
        select: {
          id: users.id,
          name: users.name,
          role_id: users.role_id,
        },
      })) as {
        id: string
        name: string
        role_id: string
      }

      if (!user) {
        return {
          message: AUTH_MESSAGES.USER_NOT_FOUND,
          statusCode: 401,
        }
      }

      // Generate new access token (15 minutes)
      const accessToken = generateAccessToken({
        id: user.id,
        role_id: user.role_id,
        session_id: session.id,
      })

      // Check if refresh token needs rotation (within 1 hour of expiration)
      const hoursUntilExpiration =
        session.expires_at.getHours() - getCurrentTime().getHours()
      let newRefreshToken: string | null = null

      if (hoursUntilExpiration <= 1) {
        // Generate new refresh token for security
        newRefreshToken = randomBytes(32).toString('hex')

        logging.info(
          `[Auth Service] Rotating refresh token for session ${session.id}`
        )

        // Update session with new refresh token and extend expiration
        await this.sessionRepository.update(session.id, {
          session_token: await hashPassword(newRefreshToken),
          expires_at: addHours(24), // Extend expiration by 24 hours
        })
      }

      return {
        data: {
          accessToken,
          newRefreshToken,
          expiresIn: 900,
        },
        message: AUTH_MESSAGES.TOKEN_REFRESH_SUCCESS,
        statusCode: 200,
      }
    } catch (error: any) {
      logging.error(
        '[Auth Service] Error refreshing token by session ID:',
        error
      )
      return {
        message: AUTH_MESSAGES.REFRESH_TOKEN_FAILED,
        statusCode: 401,
      }
    }
  }
}

export default new AuthService()
