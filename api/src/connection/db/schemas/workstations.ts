import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { cameras } from './cameras'
import { users } from './users'

export const workstations = pgTable('workstations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }),
  camera_id: uuid('camera_id')
    .notNull()
    .unique()
    .references(() => cameras.id),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  created_by: uuid('created_by').references((): AnyPgColumn => users.id),
  updated_by: uuid('updated_by').references((): AnyPgColumn => users.id),
})

export const workstationsRelations = relations(workstations, ({ one }) => ({
  camera: one(cameras, {
    fields: [workstations.camera_id],
    references: [cameras.id],
  }),
}))
