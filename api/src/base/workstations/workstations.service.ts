import { WorkstationRepository, type WorkstationWithCamera } from './workstations.repository'
import { logging } from '../../logger'
import { WORKSTATION_MESSAGES } from '../../constants/messages'
import type { ApiResponse, PaginationApiResponse } from '../../types/response.types'
import { createPaginationResponse } from '../../types/response.types'
import type { PaginationRequest } from '../../types/request.types'
import type { CreateWorkstationRequest, UpdateWorkstationRequest, WorkstationResponse } from './workstations.types'

export class WorkstationService {
  private workstationRepository: WorkstationRepository

  constructor() {
    this.workstationRepository = new WorkstationRepository()
  }

  async getById(id: number): Promise<ApiResponse<WorkstationResponse | undefined>> {
    const workstation = await this.workstationRepository.get({ id })

    if (!workstation) {
      logging.error(`[Workstation Service] Workstation with id ${id} not found`)
      return {
        statusCode: 404,
        message: WORKSTATION_MESSAGES.NOT_FOUND,
      }
    }

    logging.info(`[Workstation Service] Workstation found: ${id}`)

    return {
      statusCode: 200,
      message: WORKSTATION_MESSAGES.GET_SUCCESS,
      data: workstation,
    }
  }

  async getWithPagination(
    request: PaginationRequest
  ): Promise<PaginationApiResponse<WorkstationWithCamera>> {
    const { data, count } = await this.workstationRepository.gets({
      pagination: request,
      search: request.search,
    })

    logging.info(`[Workstation Service] Get workstations success`)

    return createPaginationResponse(
      data,
      count,
      request,
      WORKSTATION_MESSAGES.GET_SUCCESS,
      200
    )
  }

  async create(data: CreateWorkstationRequest): Promise<ApiResponse> {
    const created = await this.workstationRepository.create({
      name: data.name,
      camera_id: data.camera_id,
      is_active: data.is_active ?? true,
    })

    if (!created) {
      logging.error(`[Workstation Service] Workstation could not be created`)
      return {
        statusCode: 400,
        message: WORKSTATION_MESSAGES.COULD_NOT_CREATE,
      }
    }

    logging.info(`[Workstation Service] Workstation created successfully: ${created.id}`)

    return {
      statusCode: 201,
      message: WORKSTATION_MESSAGES.CREATED_SUCCESS,
    }
  }

  async update(id: number, data: UpdateWorkstationRequest): Promise<ApiResponse> {
    const existingWorkstation = await this.workstationRepository.get({ id })

    if (!existingWorkstation) {
      logging.error(`[Workstation Service] Workstation with id ${id} not found`)
      return {
        statusCode: 404,
        message: WORKSTATION_MESSAGES.NOT_FOUND,
      }
    }

    const updateData: Partial<{
      name: string
      camera_id: number
      is_active: boolean
    }> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.camera_id) updateData.camera_id = data.camera_id
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    const updated = await this.workstationRepository.update(id, updateData)

    if (!updated) {
      logging.error(`[Workstation Service] Workstation with id ${id} could not be updated`)
      return {
        statusCode: 400,
        message: WORKSTATION_MESSAGES.COULD_NOT_UPDATE,
      }
    }

    logging.info(`[Workstation Service] Workstation updated successfully: ${id}`)

    return {
      statusCode: 200,
      message: WORKSTATION_MESSAGES.UPDATED_SUCCESS,
    }
  }

  async delete(id: number): Promise<ApiResponse> {
    const existingWorkstation = await this.workstationRepository.get({ id })

    if (!existingWorkstation) {
      logging.error(`[Workstation Service] Workstation with id ${id} not found`)
      return {
        statusCode: 404,
        message: WORKSTATION_MESSAGES.NOT_FOUND,
      }
    }

    await this.workstationRepository.delete(id)

    logging.info(`[Workstation Service] Workstation deleted successfully: ${id}`)

    return {
      statusCode: 200,
      message: WORKSTATION_MESSAGES.DELETED_SUCCESS,
    }
  }
}

export default new WorkstationService()
