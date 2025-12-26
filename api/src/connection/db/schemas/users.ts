import { pgTable, varchar, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { roles } from './roles'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 100 }),
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
})

export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.role_id],
    references: [roles.id],
  }),
}))
