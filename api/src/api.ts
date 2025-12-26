import { Hono } from 'hono'
import './connection/db'
import { loggingMiddleware } from './middlewares/logging.middleware'
import { corsMiddleware } from './middlewares/cors.middleware'
import { errorHandler } from './middlewares/error.middleware'
import router from './router'
import { logging } from './logger'
import { config } from './config'

const app = new Hono()

app.use('*', loggingMiddleware)
app.use('*', corsMiddleware)

app.route('/api', router)

// Health check endpoint
app.get('/health', (c) => {
  logging.debug('Health check endpoint called')
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler global
app.onError(errorHandler)

const port = config.port

logging.info(`Starting server on port ${port}`)

export default {
  port,
  fetch: app.fetch,
}
