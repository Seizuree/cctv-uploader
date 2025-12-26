import { PackingRepository, type PackingItemWithRelations } from './packing.repository'
import { logging } from '../../logger'
import { PACKING_MESSAGES } from '../../constants/messages'
import type { ApiResponse, PaginationApiResponse } from '../../types/response.types'
import { createPaginationResponse } from '../../types/response.types'
import type { PaginationRequest } from '../../types/request.types'
import type { ScanRequest } from './packing.types'

export class PackingService {
  private packingRepository: PackingRepository

  constructor() {
    this.packingRepository = new PackingRepository()
  }

  async getById(id: number): Promise<ApiResponse<PackingItemWithRelations | undefined>> {
    const packing = await this.packingRepository.get({ id })

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
  ): Promise<PaginationApiResponse<PackingItemWithRelations>> {
    const { data, count } = await this.packingRepository.gets({
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

  async scan(
    data: ScanRequest,
    operatorId: number
  ): Promise<ApiResponse<PackingItemWithRelations | undefined>> {
    if (data.action === 'START') {
      return this.handleScanStart(data, operatorId)
    } else {
      return this.handleScanEnd(data, operatorId)
    }
  }

  private async handleScanStart(
    data: ScanRequest,
    operatorId: number
  ): Promise<ApiResponse<PackingItemWithRelations | undefined>> {
    // Check if there's already an active packing for this barcode
    const existingPacking = await this.packingRepository.getActivePacking(
      data.barcode,
      data.workstation_id
    )

    if (existingPacking) {
      logging.error(
        `[Packing Service] Packing already started for barcode: ${data.barcode}`
      )
      return {
        statusCode: 400,
        message: PACKING_MESSAGES.ALREADY_STARTED,
      }
    }

    const created = await this.packingRepository.create({
      barcode: data.barcode,
      operator_id: operatorId,
      workstation_id: data.workstation_id,
      start_time: new Date(),
      status: 'PENDING_END',
    })

    const packing = await this.packingRepository.get({ id: created.id })

    logging.info(
      `[Packing Service] Packing started for barcode: ${data.barcode}`
    )

    return {
      statusCode: 201,
      message: PACKING_MESSAGES.SCAN_START_SUCCESS,
      data: packing,
    }
  }

  private async handleScanEnd(
    data: ScanRequest,
    operatorId: number
  ): Promise<ApiResponse<PackingItemWithRelations | undefined>> {
    // Find active packing for this barcode
    const existingPacking = await this.packingRepository.getActivePacking(
      data.barcode,
      data.workstation_id
    )

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

    const packing = await this.packingRepository.get({ id: existingPacking.id })

    logging.info(`[Packing Service] Packing ended for barcode: ${data.barcode}`)

    return {
      statusCode: 200,
      message: PACKING_MESSAGES.SCAN_END_SUCCESS,
      data: packing,
    }
  }

  async reprocess(id: number): Promise<ApiResponse> {
    const packing = await this.packingRepository.get({ id })

    if (!packing) {
      logging.error(`[Packing Service] Packing item with id ${id} not found`)
      return {
        statusCode: 404,
        message: PACKING_MESSAGES.NOT_FOUND,
      }
    }

    await this.packingRepository.updateStatus(id, 'READY_FOR_BATCH')

    logging.info(`[Packing Service] Packing item ${id} queued for reprocessing`)

    return {
      statusCode: 200,
      message: PACKING_MESSAGES.REPROCESS_SUCCESS,
    }
  }
}

export default new PackingService()
