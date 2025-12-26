import type { Context } from 'hono'
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../types/response.types'
import packingService from './packing.service'
import { logging } from '../../logger'
import { PaginationSchema } from '../../types/request.types'
import { ScanRequestSchema } from './packing.types'
import type { JwtPayload } from '../../types/jwt.types'

export class PackingController {
  async getById(c: Context) {
    try {
      const id = parseInt(c.req.param('id'))

      if (isNaN(id)) {
        return c.json(createErrorResponse('Invalid packing item ID', 400), 400)
      }

      const response = await packingService.getById(id)

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
      logging.error(`[Packing Controller] GetById error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }

  async getWithPagination(c: Context) {
    try {
      const query = c.req.query()
      const validationResult = PaginationSchema.safeParse({
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy || 'created_at',
        sortDir: query.sortDir || 'desc',
        search: query.search,
      })

      if (!validationResult.success) {
        return c.json(createErrorResponse('Invalid query parameters', 400), 400)
      }

      const response = await packingService.getWithPagination(validationResult.data)

      return c.json(
        createSuccessResponse(
          response.data,
          response.message,
          response.statusCode
        ),
        response.statusCode
      )
    } catch (error) {
      logging.error(`[Packing Controller] GetWithPagination error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }

  async scan(c: Context) {
    try {
      const jwtPayload = c.get('jwtPayload') as JwtPayload

      if (!jwtPayload) {
        return c.json(createErrorResponse('Unauthorized', 401), 401)
      }

      const body = await c.req.json()
      const validationResult = ScanRequestSchema.safeParse(body)

      if (!validationResult.success) {
        logging.info(
          `[Packing Controller] Validation error: ${JSON.stringify(
            validationResult.error.message
          )}`
        )
        return c.json(createErrorResponse('Invalid input data', 400), 400)
      }

      const response = await packingService.scan(
        validationResult.data,
        jwtPayload.id
      )

      if (!response.data && response.statusCode !== 201 && response.statusCode !== 200) {
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
      logging.error(`[Packing Controller] Scan error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }

  async reprocess(c: Context) {
    try {
      const id = parseInt(c.req.param('id'))

      if (isNaN(id)) {
        return c.json(createErrorResponse('Invalid packing item ID', 400), 400)
      }

      const response = await packingService.reprocess(id)

      if (response.statusCode !== 200) {
        return c.json(
          createErrorResponse(response.message, response.statusCode),
          response.statusCode
        )
      }

      return c.json(
        createSuccessResponse({}, response.message, response.statusCode),
        response.statusCode
      )
    } catch (error) {
      logging.error(`[Packing Controller] Reprocess error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }
}

export default new PackingController()
