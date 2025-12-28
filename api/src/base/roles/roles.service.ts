import { RoleRepository } from './roles.repository'
import { logging } from '../../logger'
import { ROLE_MESSAGES } from '../../constants/messages'
import type {
  ApiResponse,
  PaginationApiResponse,
} from '../../types/response.types'
import { createPaginationResponse } from '../../types/response.types'
import type { PaginationRequest } from '../../types/request.types'
import { roles } from '../../connection/db/schemas'
import type {
  CreateRoleRequest,
  DeleteRoleRequest,
  UpdateRoleRequest,
} from './roles.types'
import { desc } from 'drizzle-orm'

export class RoleService {
  private roleRepository: RoleRepository

  constructor() {
    this.roleRepository = new RoleRepository()
  }

  private async checkDuplicate(
    name?: string,
    excludeId?: string
  ): Promise<{ isDuplicate: boolean; field?: 'name' }> {
    if (name) {
      const existingByName = (await this.roleRepository.get({
        name,
        select: { id: roles.id },
      })) as { id: string } | undefined

      if (existingByName && (!excludeId || existingByName.id !== excludeId)) {
        return { isDuplicate: true, field: 'name' }
      }
    }

    return { isDuplicate: false }
  }

  async getById(id: string): Promise<ApiResponse> {
    const select = {
      name: roles.name,
      description: roles.description,
    }

    const role = (await this.roleRepository.get({ id, select })) as {
      name: string
      description: string
    }

    if (!role) {
      logging.error(`[Role Service] Role with id ${id} not found`)
      return {
        statusCode: 404,
        message: ROLE_MESSAGES.NOT_FOUND,
      }
    }

    logging.info(`[Role Service] Role found: ${id}`)

    return {
      statusCode: 200,
      message: ROLE_MESSAGES.GET_SUCCESS,
      data: role,
    }
  }

  async getWithPagination(
    request: PaginationRequest
  ): Promise<PaginationApiResponse> {
    const { data, count } = await this.roleRepository.gets({
      select: {
        name: roles.name,
        description: roles.description,
        created_at: roles.created_at,
        updated_at: roles.updated_at,
      },
      pagination: request,
      search: request.search,
    })

    logging.info(`[Role Service] Get roles success`)

    return createPaginationResponse(
      data,
      count,
      request,
      ROLE_MESSAGES.GET_SUCCESS,
      200
    )
  }

  async create(data: CreateRoleRequest): Promise<ApiResponse> {
    const duplicateCheck = await this.checkDuplicate(data.name)

    if (duplicateCheck.isDuplicate) {
      logging.error(
        `[Role Service] Role with ${duplicateCheck.field} '${data.name}' already exists`
      )
      return {
        statusCode: 400,
        message: ROLE_MESSAGES.ALREADY_EXISTS,
      }
    }

    const created = await this.roleRepository.create({
      name: data.name,
      description: data.description,
    })

    if (!created) {
      logging.error(`[Role Service] Role could not be created`)
      return {
        statusCode: 400,
        message: ROLE_MESSAGES.COULD_NOT_CREATE,
      }
    }

    logging.info(`[Role Service] Role created successfully: ${created.id}`)

    return {
      statusCode: 201,
      message: ROLE_MESSAGES.CREATED_SUCCESS,
    }
  }

  async update(
    id: string,
    data: Partial<UpdateRoleRequest>
  ): Promise<ApiResponse> {
    const existingRole = (await this.roleRepository.get({
      id,
      select: {
        id: roles.id,
        name: roles.name,
        description: roles.description,
      },
    })) as {
      id: string
      name: string
      description: string
    }

    if (!existingRole) {
      logging.error(`[Role Service] Role with id ${id} not found`)
      return {
        statusCode: 404,
        message: ROLE_MESSAGES.NOT_FOUND,
      }
    }

    if (data.name) {
      const duplicateCheck = await this.checkDuplicate(data.name, id)

      if (duplicateCheck.isDuplicate) {
        logging.error(
          `[Role Service] Role with ${duplicateCheck.field} '${data.name}' already exists`
        )
        return {
          statusCode: 400,
          message: ROLE_MESSAGES.ALREADY_EXISTS,
        }
      }
    }

    const updated = await this.roleRepository.update(id, data)

    if (!updated) {
      logging.error(`[Role Service] Role with id ${id} could not be updated`)
      return {
        statusCode: 400,
        message: ROLE_MESSAGES.COULD_NOT_UPDATE,
      }
    }

    logging.info(`[Role Service] Role updated successfully: ${id}`)

    return {
      statusCode: 200,
      message: ROLE_MESSAGES.UPDATED_SUCCESS,
    }
  }

  async delete(request: DeleteRoleRequest): Promise<ApiResponse> {
    const existingRole = await this.roleRepository.get({ id: request.id })

    if (!existingRole) {
      logging.error(`[Role Service] Role with id ${request.id} not found`)
      return {
        statusCode: 404,
        message: ROLE_MESSAGES.NOT_FOUND,
      }
    }

    await this.roleRepository.delete(request)

    logging.info(`[Role Service] Role deleted successfully: ${request.id}`)

    return {
      statusCode: 200,
      message: ROLE_MESSAGES.DELETED_SUCCESS,
    }
  }
}

export default new RoleService()
