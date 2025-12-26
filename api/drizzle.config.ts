import type { Config } from 'drizzle-kit'

export default {
  schema: './src/connection/db/schemas/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://cctv:cctv@localhost:5432/cctv',
  },
  breakpoints: true,
  verbose: true,
  strict: true,
} satisfies Config
