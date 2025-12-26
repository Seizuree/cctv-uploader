import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schemas'
import { config } from '../../config'

const client = postgres(config.dbUrl)

export const db = drizzle(client, { schema })
