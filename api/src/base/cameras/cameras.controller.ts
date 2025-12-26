import type { Context } from 'hono'
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../types/response.types'
import camerasService from './cameras.service'
import { logging } from '../../logger'
import { PaginationSchema } from '../../types/request.types'
import {
  CreateCameraSchema,
  DeleteCameraSchema,
  UpdateCameraSchema,
} from './cameras.types'

export class CamerasController {
  async getById(c: Context) {
    try {
      const userId = c.get('jwtPayload').id

      if (!userId) {
        return c.json(createErrorResponse('Unauthorized', 401), 401)
      }

      const cameraId = c.req.param('id')

      const response = await camerasService.getById(cameraId)

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
        `[Cameras Controller] An error occurred during the request: ${error}`
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
      const validationResult = PaginationSchema.safeParse({
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy || 'name',
        sortDir: query.sortDir || 'asc',
        search: query.search,
      })

      if (!validationResult.success) {
        return c.json(createErrorResponse('Invalid query parameters', 400), 400)
      }

      const response = await camerasService.getWithPagination(
        validationResult.data
      )

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
        `[Cameras Controller] An error occurred during the request: ${error}`
      )
      return c.json(
        createErrorResponse('An error occurred during the request'),
        500
      )
    }
  }

  async create(c: Context) {
    try {
      const userId = c.get('jwtPayload').id

      if (!userId) {
        return c.json(createErrorResponse('Unauthorized', 401), 401)
      }

      const requestBody = await c.req.json()
      requestBody.created_by = userId
      const validationResult = await CreateCameraSchema.safeParseAsync(
        requestBody
      )

      if (!validationResult.success) {
        logging.info(
          `[Cameras Controller] Validation error: ${JSON.stringify(
            validationResult.error.message
          )}`
        )
        return c.json(createErrorResponse('Invalid input data', 400), 400)
      }

      const response = await camerasService.create(validationResult.data)

      if (response.statusCode !== 201) {
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
      logging.error(`[Cameras Controller] Create error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }

  async update(c: Context) {
    try {
      const userId = c.get('jwtPayload').id

      if (!userId) {
        return c.json(createErrorResponse('Unauthorized', 401), 401)
      }

      const cameraId = c.req.param('id')
      const requestData = await c.req.json()
      requestData.updated_at = new Date()
      requestData.updated_by = userId

      // Remove empty password
      if (requestData.password === '') {
        delete requestData.password
      }

      const validationResult = await UpdateCameraSchema.safeParseAsync(
        requestData
      )

      if (!validationResult.success) {
        logging.info(
          `[Cameras Controller] Validation error: ${JSON.stringify(
            validationResult.error.message
          )}`
        )
        return c.json(createErrorResponse('Invalid input data', 400), 400)
      }

      const response = await camerasService.update(
        cameraId,
        validationResult.data
      )

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
      logging.error(`[Cameras Controller] Update error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }

  async delete(c: Context) {
    try {
      const userId = c.get('jwtPayload').id

      if (!userId) {
        return c.json(createErrorResponse('Unauthorized', 401), 401)
      }

      const requestData = { id: c.req.param('id') }

      const result = await DeleteCameraSchema.safeParseAsync(requestData)

      if (!result.success) {
        logging.info(`
          [Camera Controller] Request data: ${JSON.stringify(
            result.error?.message
          )}
        `)

        return c.json(createErrorResponse('Invalid input', 400), 400)
      }

      const response = await camerasService.delete(result.data)

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
      logging.error(`[Cameras Controller] Delete error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }
}

export default new CamerasController()
