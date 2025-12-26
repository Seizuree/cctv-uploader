import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const cameras = pgTable('cameras', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  base_url: varchar('base_url', { length: 255 }).notNull(),
  cam_username: varchar('cam_username', { length: 100 }).notNull(),
  cam_password: varchar('cam_password', { length: 500 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  created_by: uuid('created_by').references((): AnyPgColumn => users.id),
  updated_by: uuid('updated_by').references((): AnyPgColumn => users.id),
})
