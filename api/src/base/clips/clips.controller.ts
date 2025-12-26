import type { Context } from 'hono'
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../types/response.types'
import clipsService from './clips.service'
import { logging } from '../../logger'
import { PaginationSchema } from '../../types/request.types'

export class ClipsController {
  async getById(c: Context) {
    try {
      const id = parseInt(c.req.param('id'))

      if (isNaN(id)) {
        return c.json(createErrorResponse('Invalid clip ID', 400), 400)
      }

      const response = await clipsService.getById(id)

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
      logging.error(`[Clips Controller] GetById error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }

  async getWithPagination(c: Context) {
    try {
      const query = c.req.query()
      const validationResult = PaginationSchema.safeParse({
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy || 'generated_at',
        sortDir: query.sortDir || 'desc',
        search: query.search,
      })

      if (!validationResult.success) {
        return c.json(createErrorResponse('Invalid query parameters', 400), 400)
      }

      const response = await clipsService.getWithPagination(validationResult.data)

      return c.json(
        createSuccessResponse(
          response.data,
          response.message,
          response.statusCode
        ),
        response.statusCode
      )
    } catch (error) {
      logging.error(`[Clips Controller] GetWithPagination error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }

  async getSignedUrl(c: Context) {
    try {
      const id = parseInt(c.req.param('id'))

      if (isNaN(id)) {
        return c.json(createErrorResponse('Invalid clip ID', 400), 400)
      }

      const response = await clipsService.getSignedUrl(id)

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
      logging.error(`[Clips Controller] GetSignedUrl error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }
}

export default new ClipsController()
