import {
  pgTable,
  timestamp,
  integer,
  text,
  pgEnum,
  uuid,
} from 'drizzle-orm/pg-core'

export const batchJobStatusEnum = pgEnum('enum_batch_job_status', [
  'RUNNING',
  'SUCCESS',
  'PARTIAL_SUCCESS',
  'FAILED',
])

export const batchJobs = pgTable('batch_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  started_at: timestamp('started_at', { withTimezone: true }).notNull(),
  finished_at: timestamp('finished_at', { withTimezone: true }),
  status: batchJobStatusEnum('status').notNull().default('RUNNING'),
  total_items: integer('total_items').notNull().default(0),
  success_items: integer('success_items').notNull().default(0),
  failed_items: integer('failed_items').notNull().default(0),
  error_message: text('error_message'),
})
