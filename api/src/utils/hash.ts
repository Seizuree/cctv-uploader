import { hash, compare } from 'bcryptjs'
import { config } from '../config'

export const hashPassword = async (password: string): Promise<string> => {
  return await hash(password, config.saltRounds)
}

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await compare(password, hashedPassword)
}
