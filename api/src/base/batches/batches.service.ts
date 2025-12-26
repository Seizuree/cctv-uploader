import { BatchRepository } from './batches.repository'
import { PackingRepository } from '../packing/packing.repository'
import { logging } from '../../logger'
import { BATCH_MESSAGES } from '../../constants/messages'
import type {
  ApiResponse,
  PaginationApiResponse,
} from '../../types/response.types'
import { createPaginationResponse } from '../../types/response.types'
import type { PaginationRequest } from '../../types/request.types'
import type { BatchJobResponse, BatchJobWithItems } from './batches.types'
import type { BatchJob } from '../../connection/db/schemas'

export class BatchService {
  private batchRepository: BatchRepository
  private packingRepository: PackingRepository

  constructor() {
    this.batchRepository = new BatchRepository()
    this.packingRepository = new PackingRepository()
  }

  async getById(
    id: number
  ): Promise<ApiResponse<BatchJobWithItems | undefined>> {
    const result = await this.batchRepository.getWithItems(id)

    if (!result) {
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
      data: {
        ...result.job,
        items: result.items,
      },
    }
  }

  async getWithPagination(
    request: PaginationRequest
  ): Promise<PaginationApiResponse<BatchJob>> {
    const { data, count } = await this.batchRepository.gets({
      pagination: request,
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

  async trigger(): Promise<ApiResponse<BatchJobResponse | undefined>> {
    // Check if there's already a running batch job
    const runningJob = await this.batchRepository.getRunningJob()

    if (runningJob) {
      logging.error(
        `[Batch Service] A batch job is already running: ${runningJob.id}`
      )
      return {
        statusCode: 400,
        message: BATCH_MESSAGES.ALREADY_RUNNING,
      }
    }

    // Get items ready for batch
    const readyItems = await this.packingRepository.getReadyForBatch(100)

    if (readyItems.length === 0) {
      logging.info(`[Batch Service] No items ready for batch processing`)
      return {
        statusCode: 200,
        message: 'No items ready for batch processing',
      }
    }

    // Create batch job
    const batchJob = await this.batchRepository.createJob({
      started_at: new Date(),
      status: 'RUNNING',
      total_items: readyItems.length,
      success_items: 0,
      failed_items: 0,
    })

    // Create batch job items
    for (const item of readyItems) {
      await this.batchRepository.createJobItem({
        batch_job_id: batchJob.id,
        packing_item_id: item.id,
        status: 'PENDING',
      })
    }

    logging.info(
      `[Batch Service] Batch job triggered with ${readyItems.length} items: ${batchJob.id}`
    )

    return {
      statusCode: 201,
      message: BATCH_MESSAGES.TRIGGER_SUCCESS,
      data: batchJob,
    }
  }
}

export default new BatchService()
