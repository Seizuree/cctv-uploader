import type { Context } from 'hono'
import { logging } from '../logger'
import { COMMON_MESSAGES } from '../constants/messages'

export const errorHandler = (err: Error, c: Context) => {
  const isProd = process.env.NODE_ENV === 'production'
  const reqId = c.get('reqId') || 'unknown'

  logging.error(
    {
      reqId,
      err,
      path: c.req.path,
      method: c.req.method,
      stack: err.stack,
      type: 'uncaughtError',
    },
    `Uncaught error: ${err instanceof Error ? err.message : 'Unknown error'}`
  )

  return c.json(
    {
      statusCode: 500,
      message: COMMON_MESSAGES.INTERNAL_SERVER_ERROR,
      data: {},
      ...(isProd
        ? {}
        : {
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
            location:
              err instanceof Error && err.stack
                ? err.stack.split('\n')[1]?.trim()
                : undefined,
            reqId,
          }),
    },
    500
  )
}
