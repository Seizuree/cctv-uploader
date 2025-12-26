import { pgTable, varchar, boolean, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { cameras } from './cameras'

export const workstations = pgTable('workstations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }),
  camera_id: uuid('camera_id')
    .notNull()
    .unique()
    .references(() => cameras.id),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const workstationsRelations = relations(workstations, ({ one }) => ({
  camera: one(cameras, {
    fields: [workstations.camera_id],
    references: [cameras.id],
  }),
}))
