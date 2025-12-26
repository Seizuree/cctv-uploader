import { UserRepository } from './users.repository'
import { logging } from '../../logger'
import { USER_MESSAGES } from '../../constants/messages'
import type {
  ApiResponse,
  PaginationApiResponse,
} from '../../types/response.types'
import { createPaginationResponse } from '../../types/response.types'
import type { PaginationRequest } from '../../types/request.types'
import type { CreateUserRequest, UpdateUserRequest } from './users.types'
import { hashPassword } from '../../utils/hash'
import { users, roles } from '../../connection/db/schemas'

interface UserWithRole {
  id: number
  username: string
  full_name: string | null
  email: string | null
  role_id: number
  is_active: boolean
  created_at: Date
  updated_at: Date
  role_name: string | null
}

export class UserService {
  private userRepository: UserRepository

  constructor() {
    this.userRepository = new UserRepository()
  }

  async getById(id: string): Promise<ApiResponse> {
    const select = {
      name: users.name,
      email: users.email,
      role_id: users.role_id,
    }

    const user = await this.userRepository.get({ id, select })

    if (!user) {
      logging.error(`[User Service] User with id ${id} not found`)
      return {
        statusCode: 404,
        message: USER_MESSAGES.NOT_FOUND,
      }
    }

    logging.info(`[User Service] User found: ${id}`)

    return {
      statusCode: 200,
      message: USER_MESSAGES.PROFILE_RETRIEVED,
      data: user,
    }
  }

  async getMe(id: string): Promise<ApiResponse> {
    const select = {
      id: users.id,
      name: users.name,
      email: users.email,
      role_id: users.role_id,
      role_name: roles.name,
    }

    const user = await this.userRepository.get({ id, select })

    if (!user) {
      logging.error(`[User Service] Current user with id ${id} not found`)
      return {
        statusCode: 404,
        message: USER_MESSAGES.NOT_FOUND,
      }
    }

    logging.info(`[User Service] User retrieved successfully`)

    return {
      statusCode: 200,
      message: USER_MESSAGES.CURRENT_USER_RETRIEVED,
      data: user,
    }
  }

  async getWithPagination(
    request: PaginationRequest
  ): Promise<PaginationApiResponse<UserWithRole>> {
    const select = {
      id: users.id,
      name: users.name,
      email: users.email,
      role_id: users.role_id,
      created_at: users.created_at,
      updated_at: users.updated_at,
      role_name: roles.name,
    }

    const { data, count } = await this.userRepository.gets({
      select,
      pagination: request,
      search: request.search,
    })

    logging.info(`[User Service] Get users success`)

    return createPaginationResponse(
      data as UserWithRole[],
      count,
      request,
      USER_MESSAGES.GET_SUCCESS,
      200
    )
  }

  async create(data: CreateUserRequest): Promise<ApiResponse> {
    const existingUser = await this.userRepository.get({
      name: data.name,
    })

    if (existingUser) {
      logging.error(`[User Service] Username ${data.name} already exists`)
      return {
        statusCode: 400,
        message: USER_MESSAGES.ALREADY_EXISTS,
      }
    }

    if (!data.password) {
      logging.error(`[User Service] Password hashing failed`)
      return {
        statusCode: 500,
        message: USER_MESSAGES.COULD_NOT_CREATE,
      }
    }

    const hashedPassword = await hashPassword(data.password)

    const created = await this.userRepository.create({
      name: data.name,
      password: hashedPassword,
      email: data.email,
      role_id: data.role_id,
    })

    if (!created) {
      logging.error(`[User Service] User could not be created`)
      return {
        statusCode: 400,
        message: USER_MESSAGES.COULD_NOT_CREATE,
      }
    }

    logging.info(`[User Service] User created successfully: ${created.id}`)

    return {
      statusCode: 201,
      message: USER_MESSAGES.CREATED_SUCCESS,
    }
  }

  async update(
    id: string,
    data: Partial<UpdateUserRequest>
  ): Promise<ApiResponse> {
    const getUser = await this.userRepository.get({
      id,
    })

    if (!getUser) {
      logging.error(`
        [User Service] User with id ${id} cannot be found.
      `)
      return {
        statusCode: 404,
        message: USER_MESSAGES.NOT_FOUND,
      }
    }

    if (data.password) {
      const hashedPassword = await hashPassword(data.password)
      data.password = hashedPassword
    }

    const updateUser = await this.userRepository.update(id, data)

    if (!updateUser) {
      logging.error(`
        [User Service] User with id ${id} could not be updated
      `)
      return {
        statusCode: 400,
        message: USER_MESSAGES.COULD_NOT_UPDATE,
      }
    }

    logging.info(`
      [User Service] User updated successfully
    `)

    return {
      statusCode: 200,
      message: USER_MESSAGES.UPDATED_SUCCESS,
    }
  }

  async delete(id: string): Promise<ApiResponse> {
    const existingUser = await this.userRepository.get({ id })

    if (!existingUser) {
      logging.error(`[User Service] User with id ${id} not found`)
      return {
        statusCode: 404,
        message: USER_MESSAGES.NOT_FOUND,
      }
    }

    await this.userRepository.delete(id)

    logging.info(`[User Service] User deleted successfully: ${id}`)

    return {
      statusCode: 200,
      message: USER_MESSAGES.DELETED_SUCCESS,
    }
  }
}

export default new UserService()
