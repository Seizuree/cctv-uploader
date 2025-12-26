import type { Context } from 'hono'
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../types/response.types'
import batchesService from './batches.service'
import { logging } from '../../logger'
import { PaginationSchema } from '../../types/request.types'

export class BatchesController {
  async getById(c: Context) {
    try {
      const id = parseInt(c.req.param('id'))

      if (isNaN(id)) {
        return c.json(createErrorResponse('Invalid batch job ID', 400), 400)
      }

      const response = await batchesService.getById(id)

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
      logging.error(`[Batches Controller] GetById error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }

  async getWithPagination(c: Context) {
    try {
      const query = c.req.query()
      const validationResult = PaginationSchema.safeParse({
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy || 'started_at',
        sortDir: query.sortDir || 'desc',
        search: query.search,
      })

      if (!validationResult.success) {
        return c.json(createErrorResponse('Invalid query parameters', 400), 400)
      }

      const response = await batchesService.getWithPagination(validationResult.data)

      return c.json(
        createSuccessResponse(
          response.data,
          response.message,
          response.statusCode
        ),
        response.statusCode
      )
    } catch (error) {
      logging.error(`[Batches Controller] GetWithPagination error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }

  async trigger(c: Context) {
    try {
      const response = await batchesService.trigger()

      if (response.statusCode >= 400) {
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
      logging.error(`[Batches Controller] Trigger error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }
}

export default new BatchesController()
