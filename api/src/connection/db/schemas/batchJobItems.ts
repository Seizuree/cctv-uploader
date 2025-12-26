import { pgTable, timestamp, text, pgEnum, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { batchJobs } from './batchJobs'
import { packingItems } from './packingItems'

export const batchItemStatusEnum = pgEnum('enum_batch_item_status', [
  'PENDING',
  'PROCESSING',
  'SUCCESS',
  'FAILED',
])

export const batchJobItems = pgTable('batch_job_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  batch_job_id: uuid('batch_job_id')
    .notNull()
    .references(() => batchJobs.id),
  packing_item_id: uuid('packing_item_id')
    .notNull()
    .references(() => packingItems.id),
  status: batchItemStatusEnum('status').notNull().default('PENDING'),
  error_message: text('error_message'),
  started_at: timestamp('started_at', { withTimezone: true }),
  finished_at: timestamp('finished_at', { withTimezone: true }),
})

export const batchJobItemsRelations = relations(batchJobItems, ({ one }) => ({
  batchJob: one(batchJobs, {
    fields: [batchJobItems.batch_job_id],
    references: [batchJobs.id],
  }),
  packingItem: one(packingItems, {
    fields: [batchJobItems.packing_item_id],
    references: [packingItems.id],
  }),
}))
