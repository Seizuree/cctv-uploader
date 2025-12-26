import { pgTable, varchar, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

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
})

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(roles),
}))
