import type { Context } from 'hono'
import {
  createErrorResponse,
  createSuccessResponse,
} from '../../types/response.types'
import usersService from './users.service'
import { logging } from '../../logger'
import { PaginationSchema } from '../../types/request.types'
import {
  CreateUserSchema,
  DeleteUserSchema,
  UpdateUserSchema,
} from './users.types'

export class UsersController {
  async getById(c: Context) {
    try {
      const userId = c.get('jwtPayload').id

      if (!userId) {
        return c.json(createErrorResponse('Unauthorized', 401), 401)
      }

      const id = c.req.param('id')
      const response = await usersService.getById(id)

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
        `[Users Controller] An error occurred during the request: ${error}`
      )
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }

  async getMe(c: Context) {
    try {
      const userId = c.get('jwtPayload').id

      if (!userId) {
        return c.json(createErrorResponse('Unauthorized', 401), 401)
      }

      const response = await usersService.getMe(userId)

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
        `[Users Controller] An error occurred during the request: ${error}`
      )
      return c.json(
        createErrorResponse('An error occurred while retrieving user profile'),
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

      const response = await usersService.getWithPagination(
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
      logging.error(
        `[[User Controller] An error occurred during the request: ${error}`
      )
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }

  async create(c: Context) {
    try {
      const userId = c.get('jwtPayload').id

      if (!userId) {
        return c.json(createErrorResponse('Unauthorized', 401), 401)
      }

      const body = await c.req.json()
      body.created_by = userId
      const validationResult = CreateUserSchema.safeParse(body)

      if (!validationResult.success) {
        logging.info(
          `[Users Controller] Validation error: ${JSON.stringify(
            validationResult.error.message
          )}`
        )
        return c.json(createErrorResponse('Invalid input data', 400), 400)
      }

      const response = await usersService.create(validationResult.data)

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
      logging.error(`[Users Controller] Create error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }

  async update(c: Context) {
    try {
      const userId = c.get('jwtPayload').id

      if (!userId) {
        return c.json(createErrorResponse('Unauthorized', 401), 401)
      }

      const id = c.req.param('id')

      if (!id) {
        return c.json(createErrorResponse('Invalid user ID', 400), 400)
      }

      const body = await c.req.json()
      body.updated_at = new Date()
      body.updated_by = userId

      // Remove empty password
      if (body.password === '') {
        delete body.password
      }

      const validationResult = await UpdateUserSchema.safeParseAsync(body)

      if (!validationResult.success) {
        logging.info(
          `[Users Controller] Validation error: ${JSON.stringify(
            validationResult.error.message
          )}`
        )
        return c.json(createErrorResponse('Invalid input data', 400), 400)
      }

      const response = await usersService.update(id, validationResult.data)

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
      logging.error(`[Users Controller] Update error: ${error}`)
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

      const validationResult = await DeleteUserSchema.safeParseAsync(
        requestData
      )

      if (!validationResult.success) {
        logging.info(`
          [Users Controller] Request data: ${JSON.stringify(
          validationResult.error?.message
        )}
        `)

        return c.json(createErrorResponse('Invalid input', 400), 400)
      }

      const response = await usersService.delete(validationResult.data)

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
      logging.error(`[Users Controller] Delete error: ${error}`)
      return c.json(createErrorResponse('An error occurred'), 500)
    }
  }
}

export default new UsersController()
