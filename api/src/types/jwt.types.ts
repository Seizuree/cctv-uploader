export interface JwtPayload {
  id: string
  role_id: string
  session_id: string
  type: 'access' | 'refresh'
}
