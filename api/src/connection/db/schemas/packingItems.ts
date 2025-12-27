import { pgTable, varchar, timestamp, pgEnum, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { workstations } from './workstations'

export const packingStatusEnum = pgEnum('enum_packing_status', [
  'PENDING',
  'READY_FOR_BATCH',
  'CLIP_GENERATED',
  'ERROR',
])

export const packingItems = pgTable('packing_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  barcode: varchar('barcode', { length: 255 }).notNull(),
  operator_id: uuid('operator_id')
    .notNull()
    .references(() => users.id),
  workstation_id: uuid('workstation_id')
    .notNull()
    .references(() => workstations.id),
  start_time: timestamp('start_time', { withTimezone: true }),
  end_time: timestamp('end_time', { withTimezone: true }),
  status: packingStatusEnum('status').notNull().default('PENDING'),
  created_at: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const packingItemsRelations = relations(packingItems, ({ one }) => ({
  operator: one(users, {
    fields: [packingItems.operator_id],
    references: [users.id],
  }),
  workstation: one(workstations, {
    fields: [packingItems.workstation_id],
    references: [workstations.id],
  }),
}))
