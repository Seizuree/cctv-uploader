import { z } from 'zod'

// Zod schema untuk PackingStatus (sesuai database schema)
export const PackingStatusSchema = z.enum([
  'PENDING',
  'READY_FOR_BATCH',
  'CLIP_GENERATED',
  'ERROR',
])

export const PackingItemsSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
  operator_id: z.uuid('Operator ID must be a valid UUID'),
  workstation_id: z.uuid('Workstation ID must be a valid UUID'),
  start_time: z.date().optional(),
  end_time: z.date().optional(),
  status: PackingStatusSchema,
})
// Request schemas
export const ScanStartRequestSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
  workstation_id: z.uuid('Workstation ID must be a valid UUID'),
})

export const ScanEndRequestSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
})

export type PackingItemsRequest = z.infer<typeof PackingItemsSchema>
export type PackingStatus = z.infer<typeof PackingStatusSchema>
export type ScanStartRequest = z.infer<typeof ScanStartRequestSchema>
export type ScanEndRequest = z.infer<typeof ScanEndRequestSchema>
