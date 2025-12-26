import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { roles } from './roles'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).unique(),
  email: varchar('email', { length: 100 }).unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role_id: uuid('role_id')
    .notNull()
    .references(() => roles.id),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  created_by: uuid('created_by').references((): AnyPgColumn => users.id),
  updated_by: uuid('updated_by').references((): AnyPgColumn => users.id),
})

export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.role_id],
    references: [roles.id],
  }),
}))
