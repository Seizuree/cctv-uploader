import type { Context } from 'hono'
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../types/response.types'
import rolesService from './roles.service'
import { logging } from '../../logger'
import { PaginationSchema } from '../../types/request.types'
import {
  CreateRoleSchema,
  DeleteRoleSchema,
  UpdateRoleSchema,
} from './roles.types'

export class RolesController {
  async getById(c: Context) {
    try {
      const userId = c.get('jwtPayload').id

      if (!userId) {
        return c.json(createErrorResponse('Unauthorized', 401), 401)
      }

      const roleId = c.req.param('id')

      const response = await rolesService.getById(roleId)

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
      logging.error(`[Roles Controller] GetById error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }

  async getWithPagination(c: Context) {
    try {
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

      const response = await rolesService.getWithPagination(
        validationResult.data
      )

      return c.json(
        createSuccessResponse(
          response.data,
          response.message,
          response.statusCode
        ),
        response.statusCode
      )
    } catch (error) {
      logging.error(`[Roles Controller] GetWithPagination error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }

  async create(c: Context) {
    try {
      const userId = c.get('jwtPayload').id

      if (!userId) {
        return c.json(createErrorResponse('Unauthorized', 401), 401)
      }

      const requestData = await c.req.json()
      requestData.created_by = userId
      const validationResult = await CreateRoleSchema.safeParseAsync(
        requestData
      )

      if (!validationResult.success) {
        logging.info(
          `[Roles Controller] Validation error: ${JSON.stringify(
            validationResult.error.message
          )}`
        )
        return c.json(createErrorResponse('Invalid input data', 400), 400)
      }

      const response = await rolesService.create(validationResult.data)

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
      logging.error(`[Roles Controller] Create error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }

  async update(c: Context) {
    try {
      const userId = c.get('jwtPayload').id

      if (!userId) {
        return c.json(createErrorResponse('Unauthorized', 401), 401)
      }

      const roleId = c.req.param('id')
      const requestData = await c.req.json()
      requestData.updated_at = new Date()
      requestData.updated_by = userId

      const validationResult = await UpdateRoleSchema.safeParseAsync(
        requestData
      )

      if (!validationResult.success) {
        logging.info(
          `[Roles Controller] Validation error: ${JSON.stringify(
            validationResult.error.message
          )}`
        )
        return c.json(createErrorResponse('Invalid input data', 400), 400)
      }

      const response = await rolesService.update(roleId, validationResult.data)

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
      logging.error(`[Roles Controller] Update error: ${error}`)
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

      const result = await DeleteRoleSchema.safeParseAsync(requestData)

      if (!result.success) {
        logging.info(`
            [Roles Controller] Request data: ${JSON.stringify(
              result.error?.message
            )}
          `)

        return c.json(createErrorResponse('Invalid input', 400), 400)
      }

      const response = await rolesService.delete(result.data)

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
      logging.error(`[Roles Controller] Delete error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }
}

export default new RolesController()
