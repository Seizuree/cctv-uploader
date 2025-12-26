import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
})

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const LogoutSchema = z.object({
  email: z.string().email('Valid email is required'),
})

export type LoginRequest = z.infer<typeof LoginSchema>
export type RefreshRequest = z.infer<typeof RefreshSchema>
export type LogoutRequest = z.infer<typeof LogoutSchema>

export interface AuthResponse {
  data?: {
    user: {
      name: string
      role_id: string
    }
    accessToken?: string
    refreshToken?: string
  }
  response: ServiceResponse
}

export interface ServiceResponse {
  statusCode: ContentfulStatusCode
  message: string
}
