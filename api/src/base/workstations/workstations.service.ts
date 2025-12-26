import { WorkstationRepository } from './workstations.repository'
import { logging } from '../../logger'
import { WORKSTATION_MESSAGES } from '../../constants/messages'
import type {
  ApiResponse,
  PaginationApiResponse,
} from '../../types/response.types'
import { createPaginationResponse } from '../../types/response.types'
import type { PaginationRequest } from '../../types/request.types'
import type {
  CreateWorkstationRequest,
  UpdateWorkstationRequest,
  DeleteWorkstationRequest,
} from './workstations.types'
import { workstations } from '../../connection/db/schemas'

export class WorkstationService {
  private workstationRepository: WorkstationRepository

  constructor() {
    this.workstationRepository = new WorkstationRepository()
  }

  private async checkDuplicate(
    camera_id?: string,
    excludeId?: string
  ): Promise<{ isDuplicate: boolean; field?: 'camera_id' }> {
    if (camera_id) {
      const existingByCameraId = (await this.workstationRepository.get({
        camera_id,
        select: { id: workstations.id },
      })) as { id: string } | undefined

      if (existingByCameraId && (!excludeId || existingByCameraId.id !== excludeId)) {
        return { isDuplicate: true, field: 'camera_id' }
      }
    }

    return { isDuplicate: false }
  }

  async getById(id: string): Promise<ApiResponse> {
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
  ): Promise<PaginationApiResponse> {
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
    const duplicateCheck = await this.checkDuplicate(data.camera_id)

    if (duplicateCheck.isDuplicate) {
      logging.error(
        `[Workstation Service] Workstation with ${duplicateCheck.field} '${data.camera_id}' already exists`
      )
      return {
        statusCode: 400,
        message: WORKSTATION_MESSAGES.ALREADY_EXISTS,
      }
    }

    const created = await this.workstationRepository.create({
      name: data.name,
      camera_id: data.camera_id,
    })

    if (!created) {
      logging.error(`[Workstation Service] Workstation could not be created`)
      return {
        statusCode: 400,
        message: WORKSTATION_MESSAGES.COULD_NOT_CREATE,
      }
    }

    logging.info(
      `[Workstation Service] Workstation created successfully: ${created.id}`
    )

    return {
      statusCode: 201,
      message: WORKSTATION_MESSAGES.CREATED_SUCCESS,
    }
  }

  async update(
    id: string,
    data: Partial<UpdateWorkstationRequest>
  ): Promise<ApiResponse> {
    const existingWorkstation = (await this.workstationRepository.get({
      id,
      select: {
        id: workstations.id,
        name: workstations.name,
        camera_id: workstations.camera_id,
      },
    })) as {
      id: string
      name: string | null
      camera_id: string
    }

    if (!existingWorkstation) {
      logging.error(`[Workstation Service] Workstation with id ${id} not found`)
      return {
        statusCode: 404,
        message: WORKSTATION_MESSAGES.NOT_FOUND,
      }
    }

    if (data.camera_id) {
      const duplicateCheck = await this.checkDuplicate(data.camera_id, id)

      if (duplicateCheck.isDuplicate) {
        logging.error(
          `[Workstation Service] Workstation with ${duplicateCheck.field} '${data.camera_id}' already exists`
        )
        return {
          statusCode: 400,
          message: WORKSTATION_MESSAGES.ALREADY_EXISTS,
        }
      }
    }

    const updated = await this.workstationRepository.update(id, data)

    if (!updated) {
      logging.error(
        `[Workstation Service] Workstation with id ${id} could not be updated`
      )
      return {
        statusCode: 400,
        message: WORKSTATION_MESSAGES.COULD_NOT_UPDATE,
      }
    }

    logging.info(
      `[Workstation Service] Workstation updated successfully: ${id}`
    )

    return {
      statusCode: 200,
      message: WORKSTATION_MESSAGES.UPDATED_SUCCESS,
    }
  }

  async delete(data: DeleteWorkstationRequest): Promise<ApiResponse> {
    const existingWorkstation = await this.workstationRepository.get({
      id: data.id,
    })

    if (!existingWorkstation) {
      logging.error(
        `[Workstation Service] Workstation with id ${data.id} not found`
      )
      return {
        statusCode: 404,
        message: WORKSTATION_MESSAGES.NOT_FOUND,
      }
    }

    await this.workstationRepository.delete(data)

    logging.info(
      `[Workstation Service] Workstation deleted successfully: ${data.id}`
    )

    return {
      statusCode: 200,
      message: WORKSTATION_MESSAGES.DELETED_SUCCESS,
    }
  }
}

export default new WorkstationService()
