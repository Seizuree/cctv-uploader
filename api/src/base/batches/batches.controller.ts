import type { Context } from 'hono'
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../types/response.types'
import batchesService from './batches.service'
import { logging } from '../../logger'
import { PaginationSchema } from '../../types/request.types'
import { BatchFilterSchema } from './batches.types'

export class BatchesController {
  async getById(c: Context) {
    try {
      const userId = c.get('jwtPayload').id

      if (!userId) {
        return c.json(createErrorResponse('Unauthorized', 401), 401)
      }

      const batchId = c.req.param('id')

      const response = await batchesService.getById(batchId)

      if (!response.data) {
        return c.json(
          createErrorResponse(response.message, response.statusCode),
          response.statusCode
        )
      }

      return c.json(
        createSuccessResponse(
          response.data,
          response.message,
          response.statusCode
        ),
        response.statusCode
      )
    } catch (error) {
      logging.error(
        `[Batches Controller] An error occurred during the request: ${error}`
      )
      return c.json(
        createErrorResponse('An error occurred during the request'),
        500
      )
    }
  }

  async getWithPagination(c: Context) {
    try {
      const userId = c.get('jwtPayload').id

      if (!userId) {
        return c.json(createErrorResponse('Unauthorized', 401), 401)
      }

      const query = c.req.query()

      // Validate pagination params
      const paginationResult = PaginationSchema.safeParse({
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy || 'started_at',
        sortDir: query.sortDir || 'desc',
        search: query.search,
      })

      if (!paginationResult.success) {
        return c.json(createErrorResponse('Invalid query parameters', 400), 400)
      }

      // Validate filter params
      const filterResult = BatchFilterSchema.safeParse({
        status: query.status,
        startDate: query.startDate,
        endDate: query.endDate,
      })

      if (!filterResult.success) {
        return c.json(createErrorResponse('Invalid filter parameters', 400), 400)
      }

      const response = await batchesService.getWithPagination({
        ...paginationResult.data,
        ...filterResult.data,
      })

      return c.json(
        createSuccessResponse(
          response.data,
          response.message,
          response.statusCode
        ),
        response.statusCode
      )
    } catch (error) {
      logging.error(
        `[Batches Controller] An error occurred during the request: ${error}`
      )
      return c.json(
        createErrorResponse('An error occurred during the request'),
        500
      )
    }
  }
}

export default new BatchesController()
