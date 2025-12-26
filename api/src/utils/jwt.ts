import { sign, verify } from 'jsonwebtoken'
import { config } from '../config'
import type { JwtPayload } from '../types/jwt.types'

export const generateAccessToken = (
  payload: Omit<JwtPayload, 'type'>
): string => {
  return sign({ ...payload, type: 'access' }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: 'HS256',
  })
}

export const generateRefreshToken = (
  payload: Omit<JwtPayload, 'type'>
): string => {
  return sign({ ...payload, type: 'refresh' }, config.jwtSecret, {
    expiresIn: config.refreshTokenExpiresIn,
    algorithm: 'HS256',
  })
}

export const verifyToken = (token: string): JwtPayload => {
  return verify(token, config.jwtSecret) as JwtPayload
}
