import z from 'zod'

export const SessionSchema = z.object({
  user_id: z.string().uuid('User ID must be a valid UUID'),
  session_token: z.string().min(1, 'Session Token is required'),
  expires_at: z.coerce.date(),
})

export const DeleteSessionSchema = z.object({
  session_id: z.string().uuid('Session ID must be a valid UUID'),
})

export type SessionRequest = z.infer<typeof SessionSchema>
export type DeleteSessionRequest = z.infer<typeof DeleteSessionSchema>
