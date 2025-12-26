import { cors } from 'hono/cors'

export const corsMiddleware = cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
  ],
  credentials: true,
  exposeHeaders: ['Set-Cookie'],
  maxAge: 86400,
})
