import {
  pgTable,
  varchar,
  timestamp,
  integer,
  bigint,
  pgEnum,
  uuid,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { packingItems } from './packingItems'
import { cameras } from './cameras'

export const miniClipStatusEnum = pgEnum('enum_mini_clip_status', [
  'PENDING',
  'UPLOADED',
  'FAILED',
])

export const miniClips = pgTable('mini_clips', {
  id: uuid('id').defaultRandom().primaryKey(),
  packing_item_id: uuid('packing_item_id')
    .notNull()
    .unique()
    .references(() => packingItems.id),
  camera_id: uuid('camera_id')
    .notNull()
    .references(() => cameras.id),
  storage_path: varchar('storage_path', { length: 500 }).notNull(),
  duration_sec: integer('duration_sec'),
  filesize_bytes: bigint('filesize_bytes', { mode: 'number' }),
  generated_at: timestamp('generated_at', { withTimezone: true }).notNull(),
  status: miniClipStatusEnum('status').notNull().default('PENDING'),
})

export const miniClipsRelations = relations(miniClips, ({ one }) => ({
  packingItem: one(packingItems, {
    fields: [miniClips.packing_item_id],
    references: [packingItems.id],
  }),
  camera: one(cameras, {
    fields: [miniClips.camera_id],
    references: [cameras.id],
  }),
}))
