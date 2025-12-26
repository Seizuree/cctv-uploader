import type { Context, Next } from 'hono'
import { logging } from '../logger'

export const loggingMiddleware = async (c: Context, next: Next) => {
  const start = Date.now()
  const requestId = crypto.randomUUID()

  c.set('reqId', requestId)

  logging.info({
    reqId: requestId,
    method: c.req.method,
    path: c.req.path,
    type: 'request',
  })

  await next()

  const duration = Date.now() - start

  logging.info({
    reqId: requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: `${duration}ms`,
    type: 'response',
  })
}
