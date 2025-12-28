import { UserRepository } from './users.repository'
import { logging } from '../../logger'
import { USER_MESSAGES } from '../../constants/messages'
import type {
  ApiResponse,
  PaginationApiResponse,
} from '../../types/response.types'
import { createPaginationResponse } from '../../types/response.types'
import type { PaginationRequest } from '../../types/request.types'
import type {
  CreateUserRequest,
  DeleteUserRequest,
  UpdateUserRequest,
} from './users.types'
import { hashPassword } from '../../utils/hash'
import { users, roles } from '../../connection/db/schemas'

export class UserService {
  private userRepository: UserRepository

  constructor() {
    this.userRepository = new UserRepository()
  }

  private async checkDuplicate(
    name?: string,
    email?: string,
    excludeId?: string
  ): Promise<{ isDuplicate: boolean; field?: 'name' | 'email' }> {
    if (name) {
      const existingByName = (await this.userRepository.get({
        name,
        select: { id: users.id },
      })) as { id: string } | undefined

      if (existingByName && (!excludeId || existingByName.id !== excludeId)) {
        return { isDuplicate: true, field: 'name' }
      }
    }

    if (email) {
      const existingByEmail = (await this.userRepository.get({
        email,
        select: { id: users.id },
      })) as { id: string } | undefined

      if (existingByEmail && (!excludeId || existingByEmail.id !== excludeId)) {
        return { isDuplicate: true, field: 'email' }
      }
    }

    return { isDuplicate: false }
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
  ): Promise<PaginationApiResponse> {
    const select = {
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
      data,
      count,
      request,
      USER_MESSAGES.GET_SUCCESS,
      200
    )
  }

  async create(data: CreateUserRequest): Promise<ApiResponse> {
    const duplicateCheck = await this.checkDuplicate(data.name, data.email)

    if (duplicateCheck.isDuplicate) {
      logging.error(
        `[User Service] User with ${duplicateCheck.field} '${
          duplicateCheck.field === 'name' ? data.name : data.email
        }' already exists`
      )
      return {
        statusCode: 400,
        message: USER_MESSAGES.ALREADY_EXISTS,
      }
    }

    if (!data.password) {
      logging.error(`[User Service] Password is required`)
      return {
        statusCode: 400,
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
    const existingUser = (await this.userRepository.get({
      id,
      select: {
        id: users.id,
        name: users.name,
        email: users.email,
        role_id: users.role_id,
      },
    })) as {
      id: string
      name: string | null
      email: string | null
      role_id: string
    }

    if (!existingUser) {
      logging.error(`[User Service] User with id ${id} not found`)
      return {
        statusCode: 404,
        message: USER_MESSAGES.NOT_FOUND,
      }
    }

    if (data.name || data.email) {
      const duplicateCheck = await this.checkDuplicate(
        data.name,
        data.email,
        id
      )

      if (duplicateCheck.isDuplicate) {
        logging.error(
          `[User Service] User with ${duplicateCheck.field} '${
            duplicateCheck.field === 'name' ? data.name : data.email
          }' already exists`
        )
        return {
          statusCode: 400,
          message: USER_MESSAGES.ALREADY_EXISTS,
        }
      }
    }

    if (data.password) {
      const hashedPassword = await hashPassword(data.password)
      data.password = hashedPassword
    }

    const updated = await this.userRepository.update(id, data)

    if (!updated) {
      logging.error(`[User Service] User with id ${id} could not be updated`)
      return {
        statusCode: 400,
        message: USER_MESSAGES.COULD_NOT_UPDATE,
      }
    }

    logging.info(`[User Service] User updated successfully: ${id}`)

    return {
      statusCode: 200,
      message: USER_MESSAGES.UPDATED_SUCCESS,
    }
  }

  async delete(data: DeleteUserRequest): Promise<ApiResponse> {
    const existingUser = await this.userRepository.get({
      id: data.id,
    })

    if (!existingUser) {
      logging.error(`[User Service] User with id ${data.id} not found`)
      return {
        statusCode: 404,
        message: USER_MESSAGES.NOT_FOUND,
      }
    }

    await this.userRepository.delete(data)

    logging.info(`[User Service] User deleted successfully`)

    return {
      statusCode: 200,
      message: USER_MESSAGES.DELETED_SUCCESS,
    }
  }
}

export default new UserService()
