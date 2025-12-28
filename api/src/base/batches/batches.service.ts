import { BatchRepository } from './batches.repository'
import { logging } from '../../logger'
import { BATCH_MESSAGES } from '../../constants/messages'
import type {
  ApiResponse,
  PaginationApiResponse,
} from '../../types/response.types'
import { createPaginationResponse } from '../../types/response.types'
import type { PaginationRequest } from '../../types/request.types'
import type { BatchFilter } from './batches.types'

export class BatchService {
  private batchRepository: BatchRepository

  constructor() {
    this.batchRepository = new BatchRepository()
  }

  async getById(id: string): Promise<ApiResponse> {
    const batch = await this.batchRepository.get({ id })

    if (!batch) {
      logging.error(`[Batch Service] Batch job with id ${id} not found`)
      return {
        statusCode: 404,
        message: BATCH_MESSAGES.NOT_FOUND,
      }
    }

    logging.info(`[Batch Service] Batch job found: ${id}`)

    return {
      statusCode: 200,
      message: BATCH_MESSAGES.GET_SUCCESS,
      data: batch,
    }
  }

  async getWithPagination(
    request: PaginationRequest & BatchFilter
  ): Promise<PaginationApiResponse> {
    const { data, count } = await this.batchRepository.gets({
      pagination: request,
      status: request.status,
      startDate: request.startDate,
      endDate: request.endDate,
    })

    logging.info(`[Batch Service] Get batch jobs success`)

    return createPaginationResponse(
      data,
      count,
      request,
      BATCH_MESSAGES.GET_SUCCESS,
      200
    )
  }
}

export default new BatchService()
