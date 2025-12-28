import { ClipRepository } from './clips.repository'
import { logging } from '../../logger'
import { CLIP_MESSAGES } from '../../constants/messages'
import type {
  ApiResponse,
  PaginationApiResponse,
} from '../../types/response.types'
import { createPaginationResponse } from '../../types/response.types'
import type { PaginationRequest } from '../../types/request.types'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Client } from '../../connection/gcs'
import { config } from '../../config'
import { cameras, miniClips, packingItems } from '../../connection/db/schemas'

export class ClipService {
  private clipRepository: ClipRepository

  constructor() {
    this.clipRepository = new ClipRepository()
  }

  async getById(id: string): Promise<ApiResponse> {
    const clip = await this.clipRepository.get({
      id,
      select: {
        camera_name: cameras.name,
        barcode: packingItems.barcode,
        duration_sec: miniClips.duration_sec,
        generated_at: miniClips.generated_at,
        status: miniClips.status,
      },
    })

    if (!clip) {
      logging.error(`[Clip Service] Clip with id ${id} not found`)
      return {
        statusCode: 404,
        message: CLIP_MESSAGES.NOT_FOUND,
      }
    }

    logging.info(`[Clip Service] Clip found: ${id}`)

    return {
      statusCode: 200,
      message: CLIP_MESSAGES.GET_SUCCESS,
      data: clip,
    }
  }

  async getWithPagination(
    request: PaginationRequest
  ): Promise<PaginationApiResponse> {
    const { data, count } = await this.clipRepository.gets({
      pagination: request,
      search: request.search,
    })

    logging.info(`[Clip Service] Get clips success`)

    return createPaginationResponse(
      data,
      count,
      request,
      CLIP_MESSAGES.GET_SUCCESS,
      200
    )
  }

  async getSignedUrl(id: string): Promise<ApiResponse> {
    const clip = (await this.clipRepository.get({
      id,
      select: {
        storage_path: miniClips.storage_path,
      },
    })) as { storage_path: string }

    if (!clip) {
      logging.error(`[Clip Service] Clip with id ${id} not found`)
      return {
        statusCode: 404,
        message: CLIP_MESSAGES.NOT_FOUND,
      }
    }

    const expiresIn = 3600 // 1 hour

    try {
      const command = new GetObjectCommand({
        Bucket: config.gcs.bucket,
        Key: clip.storage_path,
      })

      const url = await getSignedUrl(s3Client, command, { expiresIn })

      logging.info(`[Clip Service] Signed URL generated for clip: ${id}`)

      return {
        statusCode: 200,
        message: CLIP_MESSAGES.URL_GENERATED,
        data: {
          url,
          expires_in: expiresIn,
        },
      }
    } catch (error) {
      logging.error(`[Clip Service] Error generating signed URL: ${error}`)
      return {
        statusCode: 500,
        message: 'Failed to generate signed URL',
      }
    }
  }
}

export default new ClipService()
