import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from './connection/db'
import { logging } from './logger'

async function runMigrations() {
  logging.info('Running migrations...')

  try {
    await migrate(db, { migrationsFolder: './migrations' })
    logging.info('Migrations completed successfully')
    process.exit(0)
  } catch (error) {
    logging.error(`Migration failed: ${error}`)
    process.exit(1)
  }
}

runMigrations()
