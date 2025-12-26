import { ClipRepository, type ClipWithRelations } from './clips.repository'
import { logging } from '../../logger'
import { CLIP_MESSAGES } from '../../constants/messages'
import type { ApiResponse, PaginationApiResponse } from '../../types/response.types'
import { createPaginationResponse } from '../../types/response.types'
import type { PaginationRequest } from '../../types/request.types'
import type { SignedUrlResponse } from './clips.types'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Client } from '../../connection/gcs'
import { config } from '../../config'

export class ClipService {
  private clipRepository: ClipRepository

  constructor() {
    this.clipRepository = new ClipRepository()
  }

  async getById(id: number): Promise<ApiResponse<ClipWithRelations | undefined>> {
    const clip = await this.clipRepository.get({ id })

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
  ): Promise<PaginationApiResponse<ClipWithRelations>> {
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

  async getSignedUrl(id: number): Promise<ApiResponse<SignedUrlResponse | undefined>> {
    const clip = await this.clipRepository.get({ id })

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
