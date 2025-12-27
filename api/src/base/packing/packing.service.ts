import { PackingRepository } from './packing.repository'
import { logging } from '../../logger'
import { PACKING_MESSAGES } from '../../constants/messages'
import type {
  ApiResponse,
  PaginationApiResponse,
} from '../../types/response.types'
import { createPaginationResponse } from '../../types/response.types'
import type { PaginationRequest } from '../../types/request.types'
import type { ScanStartRequest, ScanEndRequest } from './packing.types'
import { packingItems } from '../../connection/db/schemas'

export class PackingService {
  private packingRepository: PackingRepository

  constructor() {
    this.packingRepository = new PackingRepository()
  }

  async getById(id: string): Promise<ApiResponse> {
    const select = {
      id: packingItems.id,
      barcode: packingItems.barcode,
      operator_id: packingItems.operator_id,
      workstation_id: packingItems.workstation_id,
      start_time: packingItems.start_time,
      end_time: packingItems.end_time,
      status: packingItems.status,
    }

    const packing = await this.packingRepository.get({
      select,
      id,
    })

    if (!packing) {
      logging.error(`[Packing Service] Packing item with id ${id} not found`)
      return {
        statusCode: 404,
        message: PACKING_MESSAGES.NOT_FOUND,
      }
    }

    logging.info(`[Packing Service] Packing item found: ${id}`)

    return {
      statusCode: 200,
      message: PACKING_MESSAGES.GET_SUCCESS,
      data: packing,
    }
  }

  async getWithPagination(
    request: PaginationRequest
  ): Promise<PaginationApiResponse> {
    const select = {
      id: packingItems.id,
      barcode: packingItems.barcode,
      operator_id: packingItems.operator_id,
      workstation_id: packingItems.workstation_id,
      start_time: packingItems.start_time,
      end_time: packingItems.end_time,
      status: packingItems.status,
    }

    const { data, count } = await this.packingRepository.gets({
      select,
      pagination: request,
      search: request.search,
    })

    logging.info(`[Packing Service] Get packing items success`)

    return createPaginationResponse(
      data,
      count,
      request,
      PACKING_MESSAGES.GET_SUCCESS,
      200
    )
  }

  async scanStart(
    data: ScanStartRequest,
    userId: string
  ): Promise<ApiResponse> {
    // Check if there's already an active packing for this barcode
    const existingPacking = (await this.packingRepository.get({
      operator_id: userId,
      barcode: data.barcode,
      status: 'PENDING',
    })) as { id: string }

    if (existingPacking) {
      logging.error(
        `[Packing Service] Packing already started for barcode: ${data.barcode}`
      )
      return {
        statusCode: 400,
        message: PACKING_MESSAGES.ALREADY_STARTED,
      }
    }

    await this.packingRepository.create({
      barcode: data.barcode,
      operator_id: userId,
      workstation_id: data.workstation_id,
      start_time: new Date(),
      status: 'PENDING',
    })

    logging.info(
      `[Packing Service] Packing started for barcode: ${data.barcode}`
    )

    return {
      statusCode: 201,
      message: PACKING_MESSAGES.SCAN_START_SUCCESS,
    }
  }

  async scanEnd(data: ScanEndRequest, userId: string): Promise<ApiResponse> {
    // Find active packing for this barcode
    const existingPacking = (await this.packingRepository.get({
      operator_id: userId,
      barcode: data.barcode,
      status: 'PENDING',
    })) as { id: string }

    if (!existingPacking) {
      logging.error(
        `[Packing Service] No active packing found for barcode: ${data.barcode}`
      )
      return {
        statusCode: 400,
        message: PACKING_MESSAGES.NOT_STARTED,
      }
    }

    await this.packingRepository.update(existingPacking.id, {
      end_time: new Date(),
      status: 'READY_FOR_BATCH',
    })

    logging.info(`[Packing Service] Packing ended for barcode: ${data.barcode}`)

    return {
      statusCode: 200,
      message: PACKING_MESSAGES.SCAN_END_SUCCESS,
    }
  }

  async reprocess(id: string): Promise<ApiResponse> {
    const packing = await this.packingRepository.get({ id })

    if (!packing) {
      logging.error(`[Packing Service] Packing item with id ${id} not found`)
      return {
        statusCode: 404,
        message: PACKING_MESSAGES.NOT_FOUND,
      }
    }

    await this.packingRepository.update(id, {
      status: 'PENDING',
    })

    logging.info(`[Packing Service] Packing item ${id} queued for reprocessing`)

    return {
      statusCode: 200,
      message: PACKING_MESSAGES.REPROCESS_SUCCESS,
    }
  }
}

export default new PackingService()
