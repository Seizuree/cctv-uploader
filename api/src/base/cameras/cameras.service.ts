import { CameraRepository } from './cameras.repository'
import { logging } from '../../logger'
import { CAMERA_MESSAGES } from '../../constants/messages'
import type {
  ApiResponse,
  PaginationApiResponse,
} from '../../types/response.types'
import { createPaginationResponse } from '../../types/response.types'
import type { PaginationRequest } from '../../types/request.types'
import type {
  CreateCameraRequest,
  UpdateCameraRequest,
  DeleteCameraRequest,
} from './cameras.types'
import { encryptPassword, decryptPassword } from '../../utils/encryption'
import { cameras } from '../../connection/db/schemas'

export class CameraService {
  private cameraRepository: CameraRepository

  constructor() {
    this.cameraRepository = new CameraRepository()
  }

  private async checkDuplicate(
    name: string,
    base_url: string,
    excludeId?: string
  ): Promise<boolean> {
    const existingCamera = (await this.cameraRepository.get({
      name,
      base_url,
      select: { id: cameras.id },
    })) as { id: string } | undefined

    if (!existingCamera) {
      return false
    }

    if (excludeId && existingCamera.id === excludeId) {
      return false
    }

    return true
  }

  async getById(id: string): Promise<ApiResponse> {
    const select = {
      id: cameras.id,
      name: cameras.name,
      base_url: cameras.base_url,
      cam_username: cameras.cam_username,
      cam_password: cameras.cam_password,
      created_at: cameras.created_at,
      updated_at: cameras.updated_at,
    }

    const camera = (await this.cameraRepository.get({
      id,
      select,
    })) as {
      id: string
      name: string
      base_url: string
      cam_username: string
      cam_password: string
      created_at: Date
      updated_at: Date
    }

    if (!camera) {
      logging.error(`[Camera Service] Camera with id ${id} not found`)
      return {
        statusCode: 404,
        message: CAMERA_MESSAGES.NOT_FOUND,
      }
    }

    logging.info(`[Camera Service] Camera found: ${id}`)

    return {
      statusCode: 200,
      message: CAMERA_MESSAGES.GET_SUCCESS,
      data: camera,
    }
  }

  async getWithPagination(
    request: PaginationRequest
  ): Promise<PaginationApiResponse> {
    const { data, count } = await this.cameraRepository.gets({
      select: {
        id: cameras.id,
        name: cameras.name,
        base_url: cameras.base_url,
        cam_username: cameras.cam_username,
        cam_password: cameras.cam_password,
        created_at: cameras.created_at,
        updated_at: cameras.updated_at,
      },
      pagination: request,
      search: request.search,
    })

    logging.info(`[Camera Service] Get cameras success`)

    return createPaginationResponse(
      data,
      count,
      request,
      CAMERA_MESSAGES.GET_SUCCESS,
      200
    )
  }

  async create(data: CreateCameraRequest): Promise<ApiResponse> {
    const isDuplicate = await this.checkDuplicate(data.name, data.base_url)

    if (isDuplicate) {
      logging.error(
        `[Camera Service] Camera with name '${data.name}' and base_url '${data.base_url}' already exists`
      )
      return {
        statusCode: 400,
        message: CAMERA_MESSAGES.ALREADY_EXISTS,
      }
    }

    const encryptedPassword = encryptPassword(data.cam_password)

    const created = await this.cameraRepository.create({
      name: data.name,
      base_url: data.base_url,
      cam_username: data.cam_username,
      cam_password: encryptedPassword,
    })

    if (!created) {
      logging.error(`[Camera Service] Camera could not be created`)
      return {
        statusCode: 400,
        message: CAMERA_MESSAGES.COULD_NOT_CREATE,
      }
    }

    logging.info(`[Camera Service] Camera created successfully: ${created.id}`)

    return {
      statusCode: 201,
      message: CAMERA_MESSAGES.CREATED_SUCCESS,
    }
  }

  async update(
    id: string,
    data: Partial<UpdateCameraRequest>
  ): Promise<ApiResponse> {
    const existingCamera = (await this.cameraRepository.get({
      id,
      select: {
        id: cameras.id,
        name: cameras.name,
        base_url: cameras.base_url,
        cam_username: cameras.cam_username,
      },
    })) as {
      id: string
      name: string
      base_url: string
      cam_username: string
    }

    if (!existingCamera) {
      logging.error(`[Camera Service] Camera with id ${id} not found`)
      return {
        statusCode: 404,
        message: CAMERA_MESSAGES.NOT_FOUND,
      }
    }

    if (data.name || data.base_url) {
      const newName = data.name || existingCamera.name
      const newBaseUrl = data.base_url || existingCamera.base_url

      const isDuplicate = await this.checkDuplicate(newName, newBaseUrl, id)

      if (isDuplicate) {
        logging.error(
          `[Camera Service] Camera with name '${newName}' and base_url '${newBaseUrl}' already exists`
        )
        return {
          statusCode: 400,
          message: CAMERA_MESSAGES.ALREADY_EXISTS,
        }
      }
    }

    const updated = await this.cameraRepository.update(id, data)

    if (!updated) {
      logging.error(
        `[Camera Service] Camera with id ${id} could not be updated`
      )
      return {
        statusCode: 400,
        message: CAMERA_MESSAGES.COULD_NOT_UPDATE,
      }
    }

    logging.info(`[Camera Service] Camera updated successfully: ${id}`)

    return {
      statusCode: 200,
      message: CAMERA_MESSAGES.UPDATED_SUCCESS,
    }
  }

  async delete(request: DeleteCameraRequest): Promise<ApiResponse> {
    const existingCamera = await this.cameraRepository.get({ id: request.id })

    if (!existingCamera) {
      logging.error(`[Camera Service] Camera with id ${request.id} not found`)
      return {
        statusCode: 404,
        message: CAMERA_MESSAGES.NOT_FOUND,
      }
    }

    await this.cameraRepository.delete(request.id)

    logging.info(`[Camera Service] Camera deleted successfully: ${request.id}`)

    return {
      statusCode: 200,
      message: CAMERA_MESSAGES.DELETED_SUCCESS,
    }
  }

  // Internal method for worker to get decrypted password
  async getWithPassword(id: string): Promise<{
    camera: {
      id: string
      name: string
      base_url: string
      cam_username: string
      created_at: Date
      updated_at: Date
    }
    password: string
  } | null> {
    const camera = (await this.cameraRepository.get({
      id,
      select: {
        id: cameras.id,
        name: cameras.name,
        base_url: cameras.base_url,
        cam_username: cameras.cam_username,
        cam_password: cameras.cam_password,
        created_at: cameras.created_at,
        updated_at: cameras.updated_at,
      },
    })) as {
      id: string
      name: string
      base_url: string
      cam_username: string
      cam_password: string
      created_at: Date
      updated_at: Date
    }

    if (!camera) {
      return null
    }

    return {
      camera: {
        id: camera.id,
        name: camera.name,
        base_url: camera.base_url,
        cam_username: camera.cam_username,
        created_at: camera.created_at,
        updated_at: camera.updated_at,
      },
      password: decryptPassword(camera.cam_password),
    }
  }
}

export default new CameraService()
