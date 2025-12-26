import { RoleRepository } from './roles.repository'
import { logging } from '../../logger'
import { ROLE_MESSAGES } from '../../constants/messages'
import type { ApiResponse, PaginationApiResponse } from '../../types/response.types'
import { createPaginationResponse } from '../../types/response.types'
import type { PaginationRequest } from '../../types/request.types'
import type { Role } from '../../connection/db/schemas'

export class RoleService {
  private roleRepository: RoleRepository

  constructor() {
    this.roleRepository = new RoleRepository()
  }

  async getById(id: number): Promise<ApiResponse<Role | undefined>> {
    const role = await this.roleRepository.get({ id })

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
  ): Promise<PaginationApiResponse<Role>> {
    const { data, count } = await this.roleRepository.gets({
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
}

export default new RoleService()
