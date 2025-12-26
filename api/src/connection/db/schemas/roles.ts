import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 255 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  created_by: uuid('created_by').references((): AnyPgColumn => users.id),
  updated_by: uuid('updated_by').references((): AnyPgColumn => users.id),
})

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}))
